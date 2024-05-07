import { ReadStream, WriteStream } from "fs";

export abstract class Local {
  public abstract async makeReadStream(filePath: string): Promise<ReadStream>;
  public abstract async makeWriteStream(filePath: string): Promise<WriteStream>;
  public abstract async makeDirectories(
    basePath: string,
    path: string
  ): Promise<string>;
  public abstract async writeFile(
    filePath: string,
    data: string,
    mkdir: boolean
  ): Promise<string>;
}
