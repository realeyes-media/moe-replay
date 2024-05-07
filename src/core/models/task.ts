import { TaskTypes } from "../../config/tasks";
import { WorkflowData } from "./workflow";
import * as workflowStatuses from "../../config/workflow-statuses";

export class Task {
  public id: number;
  public taskModule: string;
  public retryCount: number;
  public required: boolean;
  public status: string;
  public data?: WorkflowData;

  constructor(public type: string) {
    const { id, retryCount, required, taskModule } = TaskTypes[type];

    this.id = id;
    this.retryCount = retryCount;
    this.required = required;
    this.taskModule = taskModule;
    this.status = workflowStatuses.NOT_STARTED;
  }

  public initialize(data: WorkflowData): void {
    this.status = workflowStatuses.IN_PROGRESS;
    this.data = data;
  }

  public complete() {
    this.status = workflowStatuses.COMPLETE;
  }

  public error() {
    this.status = workflowStatuses.ERRORED;
  }
}
