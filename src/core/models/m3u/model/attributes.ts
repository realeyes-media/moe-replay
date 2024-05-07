export interface DataTypes {
  audio?: string;
  autoselect?: boolean;
  "average-bandwidth"?: number;
  bandwidth?: number;
  byterange?: Array<string>;
  "closed-captions"?: string;
  codecs?: string;
  default?: boolean;
  duration?: number;
  forced?: boolean;
  "frame-rate"?: number;
  "group-id"?: string;
  "instream-id"?: string;
  language?: string;
  name?: string;
  "program-id"?: number;
  resolution?: Array<number>;
  subtitles?: string;
  title?: Array<string>;
  type?: Array<string>;
  uri?: string;
  video?: string;
}

const dataTypes: Object = {
  audio: "0",
  autoselect: "1",
  "average-bandwidth": "2",
  bandwidth: "2",
  byterange: "3",
  "closed-captions": "0",
  codecs: "0",
  default: "1",
  duration: "4",
  forced: "1",
  "frame-rate": "2",
  "group-id": "0",
  "instream-id": "0",
  language: "0",
  name: "0",
  "program-id": "2",
  resolution: "5",
  subtitles: "0",
  title: "3",
  type: "3",
  uri: "0",
  video: "0"
};

export class Attributes {
  public attributes: DataTypes;
  constructor(attributes: DataTypes) {
    this.attributes = {};
    if (attributes) {
      this.mergeAttributes(attributes);
    }
  }

  public get(key: string) {
    return this.attributes[key];
  }
  public set(key: string, value: any) {
    key = key.toLowerCase();
    this.attributes[key] = parse[dataTypes[key] || "unknown"](value, key);

    return this;
  }

  public serialize() {
    return this.attributes;
  }

  public unserialize(object: any) {
    const list = new Attributes(object);
    return list;
  }

  public toString() {
    return Object.keys(this.attributes)
      .map(key => {
        return [key.toUpperCase(), this.getCoerced(key)].join("=");
      })
      .join(",");
  }

  private mergeAttributes(attributes: DataTypes) {
    if (Array.isArray(attributes)) {
      attributes.forEach(attribute => {
        this.set(attribute.key, attribute.value);
      });
    }
  }

  private getCoerced(key: string) {
    return coerce[dataTypes[key] || "unknown"](this.get(key));
  }
}

export function unserializeAttribute(object: any) {
  const list = new Attributes(object);
  return list;
}

const coerce = {
  "0": (value: any) => {
    // 0
    return '"' + value.replace(/"/g, '\\"') + '"';
  },
  "1": (value: any) => {
    // 1
    return value ? "YES" : "NO";
  },
  "2": (value: any) => {
    // 2
    return parseInt(value, 10);
  },
  "3": (value: any) => {
    // 3
    return value;
  },
  "4": parseFloat, // 4
  "5": (value: any) => {
    // 5
    if (Array.isArray(value)) {
      return value.join("x");
    } else {
      return value;
    }
  },
  unknown: (value: any) => {
    return value;
  }
};

const parse = {
  "0": (value: any) => {
    // 0
    if (Array.isArray(value)) {
      return value.join(",");
    } else if (
      value.indexOf('"') === 0 &&
      value.lastIndexOf('"') === value.length - 1
    ) {
      return value.slice(1, -1);
    } else {
      return value;
    }
  },
  "1": (value: any) => {
    // 1
    return value === "1" || value === 1
      ? value
      : value === "YES"
        ? true
        : false;
  },
  "2": (value: any) => {
    // 2
    return parseInt(value, 10);
  },
  "3": (value: any) => {
    // 3
    return value;
  },
  "4": parseFloat, // 4
  "5": (value: any) => {
    // 5
    return value.split("x").map(parse["2"]);
  },
  unknown: (value: any, key: string) => {
    console.error("Handling value:", value, " for unknown key:", key);
    return value;
  }
};
