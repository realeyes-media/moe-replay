import { log, LogLevels } from "../util/logger";
import * as workflowStatuses from "../../config/workflow-statuses";
import { Task } from "../models/task";
import { Modules } from "../../config/modules";
import { Module, WorkflowData } from "../models/workflow";

export async function initTask(task: Task, data: WorkflowData): Promise<Task> {
  for (let i = 0; i < task.retryCount; i++) {
    try {
      const modulePath = `../../${Modules[task.taskModule].path}`;
      task.initialize(data);
      log(LogLevels.info, `Starting task: ${task.type}`);

      const TaskModule: Module = require(modulePath);
      const module = TaskModule.create(task);
      const completedTask = await module[task.type]();

      log(LogLevels.info, `Finished task: ${task.type}`);
      return completedTask;
    } catch (error) {
      log(LogLevels.warn, error);
      // Catch errors and handle retries. Throw error to workflow-manager if all retries fail
      log(
        LogLevels.warn,
        `Task: ${task.type} attempt ${i + 1} of ${task.retryCount} failed... `
      );
      if (i === task.retryCount - 1) {
        task.error();
        log(LogLevels.info, error);
        throw new Error(
          `All attempts for task type: ${task.type} failed: ${error}`
        );
      }
      log(LogLevels.info, `Trying ${task.type} again`);
    }
  }
}
