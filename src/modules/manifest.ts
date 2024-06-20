import { Task } from "../core/models/task";
import { Module } from "./module";
import { Local } from "../adaptors/io/local";
import { Rest } from "../adaptors/http/rest";
import { ReadStream, WriteStream, createWriteStream } from "fs";
import * as Parser from "../core/models/m3u/parser";
import { URL } from "url";
import { M3U8 } from "../core/models/m3u/m3u8";
import { StreamItem } from "../core/models/m3u/model/streamItem";
import * as mime from "mime";
import * as path from "path";
import { log, LogLevels } from "../core/util/logger";
import * as config from "../config/config";

class Manifest extends Module {
  constructor(protected task: Task) {
    super(task);
  }

  public async createItem(): Promise<Task> {
    const ioAdaptor = this.adaptors.local.create<Local>();
    const restAdaptor = this.adaptors.rest.create<Rest>();
    const file = await ioAdaptor.makeReadStream(this.task.data.savePath);
    this.task.data.manifestObject.setLevel = await this.parseM3U8(file);
    this.task.data.contentType = mime.getType(this.task.data.savePath);
    const streamItems = this.task.data.manifestObject.setLevel.items.StreamItem;
    const streamLevels = await Promise.all(
      streamItems.map(async streamItem => {
        return await this.parseStreamLevel(
          this.task,
          streamItem,
          ioAdaptor,
          restAdaptor
        );
      })
    );
    this.task.data.manifestObject.streamLevel = streamLevels;
    return this.task;
  }

  public async overwriteManifest(): Promise<Task> {
    const ioAdaptor = this.adaptors.local.create<Local>();
    const setLevel = this.task.data.manifestObject.setLevel;
    const path = setLevel.path as string;

    setLevel.items.StreamItem.forEach(streamItem => {
      streamItem.replaceURI(this.task.data.baseLiveUrl, path);
    });
    const writeStream = await ioAdaptor.makeWriteStream(path);

    writeStream.on("error", (error: Error) => {
      writeStream.close();
      throw new Error("Error creating new manifest");
    });

    await this.writeNewManifest(writeStream, setLevel);
    this.task.data.newSetLevel = setLevel;

    return this.task;
  }

  public async createLiveStreams(): Promise<Task> {
    const playlistItems = this.task.data.manifestObject.streamLevel;
    const dvr = this.task.data.dvr ? this.task.data.dvr : null;
    const ioAdaptor = this.adaptors.local.create<Local>();
    await Promise.all(
      playlistItems.map(async playlistItem => {
        return await this.writeStreamLevel(
          playlistItem,
          ioAdaptor,
          0,
          dvr,
          this.task.data.token
        );
      })
    );
    return this.task;
  }

  private async writeStreamLevel(
    playlistManifest: M3U8,
    adaptor: Local,
    index: number,
    dvr: number,
    token: string
  ) {
    const writeStream = await adaptor.makeWriteStream(
      playlistManifest.path as string
    );
    const delay = duration =>
      new Promise(resolve => setTimeout(resolve, duration));
    let dvrCount = dvr ? await this.setWindow(playlistManifest, dvr) : null;
    dvrCount = dvr ? (dvrCount > 3 ? dvrCount : 3) : null;
    writeStream.on("error", (error: Error) => {
      log(LogLevels.error, error);
      writeStream.close();
      throw new Error("Error creating live stream level manifest");
    });

    writeStream.write(playlistManifest.propertiesToString());
    const playlistItem = playlistManifest.items.PlaylistItem[index];
    const fileName = await this.removeFileName(playlistManifest.remotePath);
    let uri = fileName + "/" + playlistItem.properties.uri;
    uri = this.task.data.stringCookie
      ? config.LOCAL_URL +
        "livestream/proxy?segment=" +
        encodeURIComponent(uri) +
        "&cookie=" +
        this.task.data.stringCookie
      : config.LOCAL_URL +
        "livestream/proxy?segment=" +
        encodeURIComponent(uri);
    playlistItem.set("uri", uri);
    for (let i = 0; i <= index; i++) {
      writeStream.write(playlistManifest.items.PlaylistItem[i].toString());
    }
    if (dvrCount && index >= dvrCount) {
      playlistManifest.removePlaylistItem(0);
      playlistManifest.incrementMediaSequence();
      index--;
    }
    if (index < 3) {
      writeStream.end();
      return await this.writeStreamLevel(
        playlistManifest,
        adaptor,
        ++index,
        dvr,
        token
      );
    } else if (index < playlistManifest.items.PlaylistItem.length) {
      await delay(playlistItem.properties.duration * 1000);
      writeStream.end();
      return await this.writeStreamLevel(
        playlistManifest,
        adaptor,
        ++index,
        dvr,
        token
      );
    } else {
      writeStream.write(playlistManifest.endOfFile());
      writeStream.end();
      return;
    }
  }

  private async setWindow(
    manifest: M3U8,
    maxDuration: number
  ): Promise<number> {
    let totalDuration = 0;
    let index = 0;
    manifest.items.PlaylistItem.forEach(item => {
      manifest.set("allowCache", "NO");
      totalDuration += item.properties.duration;
      if (totalDuration <= maxDuration) {
        index++;
      } else {
        return index;
      }
    });
    return index;
  }

  private async removeFileName(uri: string) {
    const urlObject = new URL(uri);
    const urlArr = urlObject.pathname.split("/");
    urlArr.pop();
    urlArr.shift();
    const newPath = urlArr.join("/");
    return urlObject.protocol + "//" + urlObject.host + "/" + newPath;
  }

  private async writeNewManifest(writeStream: WriteStream, manifest: M3U8) {
    return new Promise((resolve, reject) => {
      writeStream.write(manifest.toString(), () => {
        writeStream.close();
        return resolve();
      });
      writeStream.on("error", (error: Error) => {
        writeStream.close();
        return reject(new Error("Error creating new manifest"));
      });
    });
  }

  private async parseStreamLevel(
    task: Task,
    streamItem: StreamItem,
    ioAdaptor: Local,
    restAdaptor: Rest
  ): Promise<M3U8> {
    let remotePath = null;
    try {
      const urlData = task.data.urlData;
      const pathSep = streamItem.properties.uri.indexOf("/") === 0 ? "" : "/";
      const isAUrl = await isUrl(streamItem.properties.uri);
      const fileName = path.basename(streamItem.properties.uri);
      if (isAUrl) {
        remotePath = streamItem.properties.uri;
      } else if (pathSep === "/") {
        remotePath = `${urlData.protocol}//${urlData.hostName +
          urlData.basePath +
          pathSep}${streamItem.properties.uri}`;
      } else {
        remotePath = `${urlData.protocol}//${urlData.hostName +
          streamItem.properties.uri}`;
      }
      if (this.task.data.token) {
        remotePath = remotePath + "?" + this.task.data.token;
      }
      const streamName = await getStreamName(streamItem.properties.uri);
      const uri =
        streamItem.properties.uri.indexOf("/") === 0
          ? streamItem.properties.uri.substring(1)
          : streamItem.properties.uri;
      const savePath = isAUrl
        ? this.task.data.baseSavePath +
          path
            .dirname(new URL(streamItem.properties.uri).pathname)
            .substring(1) +
          "/" +
          fileName
        : this.task.data.baseSavePath + uri;
      const response = this.task.data.cookie
        ? await restAdaptor.getWithCookie(
            remotePath,
            savePath,
            task.data.cookie
          )
        : await restAdaptor.get(remotePath, savePath);
      if (response.cookie) {
        this.task.data.requestCookie = response.cookie;
      }
      await ioAdaptor.writeFile(
        savePath,
        response.body || response.result.body,
        true
      );
      const file = await ioAdaptor.makeReadStream(savePath);
      const manifest = await this.parseM3U8(file);
      manifest.setRemotePath(remotePath);
      return manifest;
    } catch (error) {
      // TODO: why does this error but still download
      log(LogLevels.warn, error);
    }
  }

  private async parseM3U8(file: ReadStream): Promise<M3U8> {
    return new Promise<M3U8>((resolve, reject) => {
      const parser = Parser.createStream(file);

      parser
        .on("item", (item: any) => {})
        .on("error", (error: Error) => {
          file.destroy();
          error = new Error(`Could not parse M3U8: ${file.path}`);
          return reject(error);
        })
        .on("m3u", (m3u: M3U8) => {
          file.destroy();
          return resolve(m3u);
        });
    });
  }
}

async function getStreamName(uri: string) {
  return path.basename(uri);
}

async function isUrl(s): Promise<boolean> {
  const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  const urlTest = regexp.test(s);
  return urlTest;
}

export function create(task: Task) {
  return new Manifest(task);
}
