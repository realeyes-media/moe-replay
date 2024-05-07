import { Modules } from "../config/modules";
import { Task } from "../core/models/task";
import { ADAPTOR_PATH } from "../config/config";

interface Adaptors {
  [type: string]: Adaptor;
}

interface Adaptor {
  type: string;
  name: string;
  create<T>(options?: any): T;
}

export abstract class Module {
  protected adaptors: Adaptors;
  constructor(protected task: Task) {
    const adaptors: string[] = Modules[this.task.taskModule].adaptors;
    this.adaptors = {};

    adaptors.map(adaptor => {
      const adaptorModule: Adaptor = require(ADAPTOR_PATH + adaptor);
      this.adaptors[adaptorModule.type] = adaptorModule;
    });
  }
}
