import { Attributes, DataTypes } from "./attributes";
import { Item } from "./item";

export class StreamItem extends Item {
  constructor(attributes: DataTypes) {
    super(attributes);
  }

  public toString() {
    // M3U8 toString
    const output: Array<string> = [];
    // if (this.get('media')) {
    // output.push('#EXT-X-MEDIA:' + this.attributes.toString())
    // }
    // if (this.get('stream-inf')) {
    output.push("#EXT-X-STREAM-INF:" + this.attributes.toString());
    // }
    output.push(this.get("uri"));

    return output.join("\n");
  }
}

export function create(data: DataTypes) {
  const item = new StreamItem(data);
  return item;
}
