import { Attributes, DataTypes, unserializeAttribute } from "./attributes";
import * as querystring from "querystring";
import * as urlModule from "url";

interface Properties {
  asset?: Object;
  byteRange?: any;
  date?: string;
  discontinuity?: any;
  cue?: any;
  duration?: number;
  title?: string;
  uri?: string;
  media?: string;
  "cue-out"?: Object;
  "cue-out-cont"?: Object;
  "cue-in"?: any;
  scte35?: Object;
  key: Object;
}

export class Item {
  public attributes: Attributes;
  public properties: Properties;
  constructor(dataTypes: DataTypes) {
    this.attributes = new Attributes(dataTypes);
    this.properties = {
      asset: null,
      byteRange: null,
      date: null,
      discontinuity: null,
      cue: null,
      duration: null,
      key: null,
      title: null,
      uri: null,
      media: null,
      "cue-out": null,
      "cue-out-cont": null,
      "cue-in": null,
      scte35: null
    };
  }

  public get(key: string) {
    if (this.propertiesHasKey(key)) {
      return this.properties[key];
    } else {
      return this.attributes.get(key);
    }
  }

  public setData(data: any) {
    Object.keys(data).forEach((key: string) => {
      this.set(key, data[key]);
    });
  }

  public set(key: string, value: any) {
    if (this.propertiesHasKey(key)) {
      this.properties[key] = value;
    } else {
      this.attributes.set(key, value);
    }

    return this;
  }

  public serialize() {
    return {
      attributes: this.attributes.serialize(),
      properties: this.properties
    };
  }

  public replaceURI(host: string, path: string) {
    let uri = getStreamName(this.properties.uri);
    if (uri.indexOf("/") === 0) {
      uri = uri.substring(1);
    }
    uri = encodeURIComponent(uri);
    this.properties.uri = host + uri;
  }

  private propertiesHasKey(key: string) {
    return Object.keys(this.properties).indexOf(key) > -1;
  }
}

export function unserialize(constructor: any, object: Item) {
  const item = new constructor();
  item.attributes = unserializeAttribute(object.attributes);
  item.properties = object.properties;
  return item;
}

function getStreamName(url: string) {
  const urlObject = urlModule.parse(url);
  const path = urlObject.pathname;
  return path;
}

async function isUrl(s): Promise<boolean> {
  const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  const urlTest = regexp.test(s);
  return urlTest;
}

function getBaseURL(url: string) {
  return url.match(/^(.*[\\\/])/)[1];
}
