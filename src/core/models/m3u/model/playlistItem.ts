import { Item } from "./item";
import { Attributes, DataTypes } from "./attributes";

export class PlaylistItem extends Item {
  constructor(attributes?: DataTypes) {
    super(attributes);
  }

  public toString() {
    // M3U8 toString
    const output: Array<string> = [];
    let firstLine: Boolean = false;
    if (this.get("discontinuity")) {
      output.push("#EXT-X-DISCONTINUITY");
      firstLine = true;
    }
    // if (this.get('cue')) {
    //     output.push('#EXT-X-CUE')
    // 		firstLine = true
    // }
    if (this.get("date")) {
      var date = this.get("date");
      if (date.getMonth) {
        date = date.toISOString();
      }
      output.push("#EXT-X-PROGRAM-DATE-TIME:" + date);
      firstLine = true;
    }
    if (this.get("asset")) {
      output.push("#EXT-X-ASSET:" + [this.get("asset")].join(","));
    }
    if (this.get("cue")) {
      output.push("#EXT-X-CUE:" + [this.get("cue")].join(","));
    }
    if (this.get("cue-out")) {
      output.push("#EXT-X-CUE-OUT:" + [this.get("cue-out")].join(","));
    }
    if (this.get("cue-out-cont")) {
      output.push(
        "#EXT-X-CUE-OUT-CONT:" + [this.get("cue-out-cont")].join(",")
      );
    }
    if (this.get("cue-in")) {
      output.push("#EXT-X-CUE-IN");
    }
    if (this.get("scte35")) {
      output.push("#EXT-X-SCTE35:" + [this.get("scte35")].join(","));
    }
    if (this.get("key")) {
      output.push("#EXT-X-KEY:" + [this.get("key")].join(","));
    }
    if (this.get("duration") != null || this.get("title") != null) {
      output.push(
        "#EXTINF:" +
          [this.get("duration").toFixed(4), this.get("title")].join(",")
      );
      firstLine = true;
    }
    if (this.get("byteRange") != null) {
      output.push("#EXT-X-BYTERANGE:" + this.get("byteRange"));
      firstLine = true;
    }
    if (!firstLine) {
      // output.push
    }
    output.push(this.get("uri"));

    return output.join("\n") + "\n";
  }
}

export function create(data: DataTypes) {
  const item = new PlaylistItem(data);
  return item;
}
