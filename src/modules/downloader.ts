import { Task } from "../core/models/task";
import { Module } from "./module";
import { Rest } from "../adaptors/http/rest";
import { Local } from "../adaptors/io/local";

class Downloader extends Module {
  constructor(protected task: Task) {
    super(task);
  }

  public async downloadMedia(): Promise<Task> {
    const adaptor = this.adaptors.rest.create<Rest>();
    const localAdaptor = this.adaptors.local.create<Local>();
    const response = await adaptor.get(
      this.task.data.url,
      this.task.data.savePath
    );
    if (this.task.data.token) {
      if (!response.headers["set-cookie"][0]) {
        const error = new Error("No cookie returned from token request");
        throw error;
      }
      this.task.data.cookie = response.headers["set-cookie"];
    }
    await localAdaptor.writeFile(this.task.data.savePath, response.body, false);
    return this.task;
  }
}

export function create(task: Task) {
  return new Downloader(task);
}
