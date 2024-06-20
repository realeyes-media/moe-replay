import { Task } from "./task";
import { WorkflowConfig } from "../../config/workflow-config";
import * as workflowStatuses from "../../config/workflow-statuses";

export class Step {
  public tasks: Task[] = [];
  public status: string;
  public taskTypes: string[] = [];
  constructor(public id: number, taskNames: string[], workflowType: string) {
    this.status = workflowStatuses.NOT_STARTED;
    taskNames.map(taskName => {
      if (
        WorkflowConfig[workflowType].tasks.includes(taskName) &&
        !this.taskTypes.includes(taskName)
      ) {
        this.taskTypes.push(taskName);
        this.tasks.push(new Task(taskName));
      }
    });
  }

  public initialize() {
    this.status = workflowStatuses.IN_PROGRESS;
  }

  public complete() {
    this.status = workflowStatuses.COMPLETE;
  }

  public error() {
    this.status = workflowStatuses.ERRORED;
  }
}
