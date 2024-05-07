import promisify = require("promisify-node");
import { ReadStream, WriteStream } from "fs";
import { Local } from "./local";
import * as pathUtil from "path";

const fs = promisify("fs");
const chokidar = promisify("chokidar");
const mkdirp = require("mkdirp-promise");
export const type = "local";
export const name = "localFs";

/**
 *
 * @class LocalFs
 */
class LocalFs extends Local {
  constructor() {
    super();
  }

  public async makeReadStream(filePath: string): Promise<ReadStream> {
    return fs.createReadStream(filePath);
  }

  public async makeWriteStream(filePath: string): Promise<WriteStream> {
    return fs.createWriteStream(filePath);
  }

  public async makeDirectories(
    basePath: string,
    path: string
  ): Promise<string> {
    return await path.split("/").reduce(async (fullPathPromise, folder) => {
      let fullPath = await fullPathPromise;
      fullPath += folder + "/";
      if (!fs.existsSync(fullPath)) {
        await fs.mkdir(fullPath);
      }
      return fullPath;
    }, Promise.resolve(`${basePath}/`));
  }
  public async writeFile(
    filePath: string,
    data: string,
    mkdir: boolean
  ): Promise<string> {
    if (mkdir) {
      await mkdirp(pathUtil.dirname(filePath));
    }
    return await fs.writeFile(filePath, data);
  }
}

export function create() {
  return new LocalFs();
}
