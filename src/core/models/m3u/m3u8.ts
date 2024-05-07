import * as PlaylistItem from "./model/playlistItem";
import * as StreamItem from "./model/streamItem";
import * as Item from "./model/item";
import { DataTypes, Attributes } from "./model/attributes";
import { URL } from "url";

interface IItems {
  PlaylistItem: Array<PlaylistItem.PlaylistItem>;
  StreamItem: Array<StreamItem.StreamItem>;
}

export class M3U8 {
  public type: string;
  public manifestType: string;
  public path: string | Buffer;
  public remotePath: string;
  public items: IItems;
  public properties: Object;
  constructor() {
    this.items = {
      PlaylistItem: [],
      StreamItem: []
    };
    this.properties = {};
  }

  public get(key: string) {
    return this.properties[key];
  }

  public set(key: string, value: any) {
    const tagKey = findByTag(key);
    if (tagKey) key = tagKey.key;
    this.properties[key] = coerce[dataTypes[key] || "unknown"](value);

    return this;
  }

  public setType(type: string) {
    this.type = type;
  }

  public setPath(path: string | Buffer) {
    this.path = path;
  }

  public setRemotePath(path: string) {
    this.remotePath = path;
  }

  public setManifestType(type: string) {
    this.manifestType = type;
  }

  public addItem(item: any) {
    this.items[item.constructor.name].push(item);

    return this;
  }

  public addPlaylistItem(data: DataTypes) {
    this.items.PlaylistItem.push(PlaylistItem.create(data));
  }

  public removePlaylistItem(index: number) {
    if (index < this.items.PlaylistItem.length && index >= 0) {
      this.items.PlaylistItem.splice(index, 1);
    } else {
      throw new RangeError("M3U PlaylistItem out of range");
    }
  }

  public incrementMediaSequence() {
    this.set("mediaSequence", this.get("mediaSequence") + 1);
  }

  public addStreamItem(data: DataTypes) {
    this.items.StreamItem.push(StreamItem.create(data));
  }

  public domainDurations() {
    var index = 0;
    return this.items.PlaylistItem.reduce(
      (duration, item) => {
        if (item.get("discontinuity")) {
          index = duration.push(0) - 1;
        }
        duration[index] += item.get("duration");

        return duration;
      },
      [0]
    );
  }

  public totalDuration() {
    return this.items.PlaylistItem.reduce((duration, item) => {
      return duration + item.get("duration");
    }, 0);
  }

  public merge(m3u: M3U8) {
    if (m3u.get("targetDuration") > this.get("targetDuration")) {
      this.set("targetDuration", m3u.get("targetDuration"));
    }
    m3u.items.PlaylistItem[0].set("discontinuity", true);
    this.items.PlaylistItem = this.items.PlaylistItem.concat(
      m3u.items.PlaylistItem
    );

    return this;
  }

  public toString() {
    // M3U8 toString
    const output = ["#EXTM3U"];
    Object.keys(this.properties).forEach(key => {
      const tagKey = findByKey(key);
      const tag = tagKey ? tagKey.tag : key;

      if (dataTypes[key] === "boolean") {
        output.push("#" + tag);
      } else {
        output.push("#" + tag + ":" + this.get(key));
      }
    });

    if (this.items.PlaylistItem.length) {
      output.push(this.items.PlaylistItem.map(itemToString).join("\n"));

      if (this.get("playlistType") === "VOD") {
        output.push("#EXT-X-ENDLIST");
      }
    } else {
      if (this.items.StreamItem.length) {
        output.push(this.items.StreamItem.map(itemToString).join("\n") + "\n");
      }
    }

    return output.join("\n") + "\n";
  }

  public propertiesToString() {
    // M3U8 toString
    const output = ["#EXTM3U"];
    const item = this.items.PlaylistItem[0];
    Object.keys(this.properties).forEach(key => {
      const tagKey = findByKey(key);
      const tag = tagKey ? tagKey.tag : key;

      if (dataTypes[key] === "boolean") {
        output.push("#" + tag);
      } else {
        let value = this.get(key);
        if (tag === "EXT-X-MAP") {
          if (value.indexOf("http") < 0) {
            value = `URI="${createUrlFrom(
              decodeURIComponent(
                this.items.PlaylistItem[0].properties.uri || ""
              ),
              value
            )}`;
          }
        }
        output.push("#" + tag + ":" + value);
      }
    });

    return output.join("\n") + "\n";
  }

  public endOfFile() {
    const output = ["#EXT-X-ENDLIST"];
    return output.join("\n") + "\n";
  }

  public serialize() {
    const object = { properties: this.properties, items: {} };
    Object.keys(this.items).forEach(constructor => {
      object.items[constructor] = this.items[constructor].map(serializeItem);
    });

    return object;
  }
}

export function create() {
  return new M3U8();
}

export function unserialize(object: M3U8) {
  const m3u = new M3U8();
  m3u.properties = object.properties;
  Object.keys(object.items).forEach(constructor => {
    m3u.items[constructor] = object.items[constructor].map(
      Item.unserialize.bind(null, M3U8[constructor])
    );
  });

  return m3u;
}

function createUrlFrom(itemUrl: string, uri: string) {
  const query = itemUrl.split("?segment=")[1];
  if (query) {
    const url = new URL(query);
    let base = "";
    if (uri.charAt(0) === "/") {
      base = url.origin;
    } else {
      base =
        url.origin +
        url.pathname
          .split("/")
          .slice(0, -2)
          .join("/");
    }
    uri = uri.split('URI="')[1] || "";
    return base + uri;
  }
  return uri;
}

function itemToString(item: Item.Item) {
  return item.toString();
}

function serializeItem(item: Item.Item) {
  return item.serialize();
}

const propertyMap = [
  // M3U8 tags
  { tag: "EXT-X-ALLOW-CACHE", key: "allowCache" },
  { tag: "EXT-X-I-FRAMES-ONLY", key: "iframesOnly" },
  { tag: "EXT-X-MEDIA-SEQUENCE", key: "mediaSequence" },
  { tag: "EXT-X-PLAYLIST-TYPE", key: "playlistType" },
  { tag: "EXT-X-TARGETDURATION", key: "targetDuration" },
  { tag: "EXT-X-VERSION", key: "version" },
  { tag: "EXT-X-INDEPENDENT-SEGMENTS", key: "independentSegments" }
];

const dataTypes = {
  iframesOnly: "boolean",
  independentSegments: "boolean",
  targetDuration: "integer",
  mediaSequence: "integer",
  version: "integer",
  allowCache: "string"
};

function findByTag(tag: string) {
  return propertyMap[
    propertyMap
      .map(tagKey => {
        return tagKey.tag;
      })
      .indexOf(tag)
  ];
}

function findByKey(key: string) {
  return propertyMap[
    propertyMap
      .map(tagKey => {
        return tagKey.key;
      })
      .indexOf(key)
  ];
}

const coerce = {
  boolean: (value: any) => {
    return true;
  },
  integer: (value: any) => {
    return parseInt(value, 10);
  },
  string: (value: any) => {
    return value.toString();
  },
  unknown: (value: any) => {
    return value;
  }
};
