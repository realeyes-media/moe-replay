import { Task } from "../core/models/task";
import { Module } from "./module";
import { Local } from "../adaptors/io/local";
import { LOCAL_PATH } from "../config/config";
import { Stats } from "fs";
import promisify = require("promisify-node");

const fs = promisify("fs");

class FileIO extends Module {
  constructor(protected task: Task) {
    super(task);
  }

  public async makeDirectories(): Promise<Task> {
    const adaptor = this.adaptors.local.create<Local>();
    const path = await adaptor.makeDirectories(
      LOCAL_PATH,
      `${this.task.data.streamName}_${this.task.data.workflowId}`
    );
    return this.task;
  }
}

/**
 *
 * @param {Task} task
 * @returns {IO}
 */
export function create(task: Task) {
  return new FileIO(task);
}
