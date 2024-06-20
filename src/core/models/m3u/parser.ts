import * as fs from "fs";
import * as Item from "./model/item";
import * as readline from "readline";
import * as PlaylistItem from "./model/playlistItem";
import * as StreamItem from "./model/streamItem";
import * as Attributes from "./model/attributes";
import * as querystring from "querystring";
import * as m3u8 from "./m3u8";
import * as events from "events";

const NON_QUOTED_COMMA = /,(?=(?:[^"]|"[^"]*")*$)/;

export class Parser extends events.EventEmitter {
  public linesRead: number;
  public m3u: m3u8.M3U8;
  public stream: fs.ReadStream;
  public currentItem: Item.Item;
  public rl: readline.ReadLine;
  public playlistDiscontinuity: boolean;
  public tag = {
    // M3U8 tags
    EXTINF: (data: any) => {
      if (!this.m3u.manifestType) {
        this.m3u.setManifestType("streamLevel");
      }
      this.addItem(new PlaylistItem.PlaylistItem());

      data = data.split(",");
      this.currentItem.set("duration", parseFloat(data[0]));
      this.currentItem.set("title", data[1]);
      if (this.playlistDiscontinuity) {
        this.currentItem.set("discontinuity", true);
        this.playlistDiscontinuity = false;
      }
    },
    "EXT-X-CUE": (data: any) => {
      if (!this.m3u.manifestType) {
        this.m3u.setManifestType("streamLevel");
      }
      if (data) {
        data = data.split(",");
        this.currentItem.set("cue", data);
      }
    },
    "EXT-X-CUE-OUT": (data: any) => {
      if (data) {
        data = data.split(",");
        this.currentItem.set("cue-out", data);
      }
    },
    "EXT-X-CUE-OUT-CONT": (data: any) => {
      if (data) {
        data = data.split(",");
        this.currentItem.set("cue-out-cont", data);
      }
    },
    "EXT-X-CUE-IN": () => {
      const data = {};
      this.currentItem.set("cue-in", data);
    },
    "EXT-X-SCTE35": (data: any) => {
      if (data) {
        data = data.split(",");
        this.currentItem.set("scte35", data);
      }
    },
    "EXT-X-ASSET": (data: any) => {
      if (data) {
        data = data.split(",");
        this.currentItem.set("asset", data);
      }
    },
    "EXT-X-DISCONTINUITY": () => {
      this.playlistDiscontinuity = true;
    },
    "EXT-X-BYTERANGE": (data: any) => {
      this.currentItem.set("byteRange", data);
    },
    "EXT-X-STREAM-INF": (data: any) => {
      this.addItem(new StreamItem.StreamItem(this.parseAttributes(data)));
      if (!this.m3u.manifestType) {
        this.m3u.setManifestType("setLevel");
      }
    }
  };

  constructor(stream: fs.ReadStream) {
    super();
    this.stream = stream;
    this.linesRead = 0;
    this.m3u = new m3u8.M3U8();
    this.m3u.setPath(stream.path);
    this.readLine(stream);
    this.rl.on("line", this.parse.bind(this));
    this.rl.on("close", () => {
      this.emit("m3u", this.m3u);
    });
  }

  public parse(line: string) {
    line = line.trim();
    if (this.linesRead === 0) {
      if (line !== "#EXTM3U") {
        return this.emit(
          "error",
          new Error("Non-valid M3U file. First line: " + line)
        );
      } else {
        this.m3u.setType("m3u8");
      }
      this.linesRead++;
      return true;
    }
    if (["", "#EXT-X-ENDLIST"].indexOf(line) > -1) return true;
    if (line.indexOf("#") === 0) {
      this.parseLine(line);
    } else {
      if (this.currentItem.attributes.attributes.uri !== undefined) {
        this.addItem(new PlaylistItem.PlaylistItem());
      }
      this.currentItem.set("uri", line);
      this.emit("item", this.currentItem);
    }
    this.linesRead++;
  }

  private addItem(item: Item.Item) {
    this.m3u.addItem(item);
    this.currentItem = item;
    return item;
  }

  private parseLine(line: string) {
    const parts = line.slice(1).split(/:(.*)/);
    const tag = parts[0];
    const data = parts[1];
    if (typeof this.tag[tag] === "function") {
      this.tag[tag](data, tag);
    } else {
      this.m3u.set(tag, data);
    }
  }

  private parseAttributes(data: any) {
    data = data.split(NON_QUOTED_COMMA);
    return data.map(function(attribute: string) {
      const keyValue = attribute.split(/=(.+)/).map(function(str: string) {
        return str.trim();
      });
      return {
        key: keyValue[0],
        value: keyValue[1]
      };
    });
  }

  private readLine(stream: fs.ReadStream) {
    this.rl = readline.createInterface({
      input: stream
    });
  }
}

export function createStream(stream: fs.ReadStream) {
  return new Parser(stream);
}
