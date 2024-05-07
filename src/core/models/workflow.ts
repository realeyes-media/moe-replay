import { Step } from "./step";
import { Task } from "./task";
import { StepConfig } from "../../config/step-config";
import { WorkflowConfig } from "../../config/workflow-config";
import * as workflowStatuses from "../../config/workflow-statuses";
import { Modules } from "../../config/modules";
import { M3U8 } from "./m3u/m3u8";
import { Cookie } from "request";
import * as tough from "tough-cookie";
import * as request from "request";

export interface Manifest {
  baseUrl: string;
  setLevel: M3U8;
  streamLevel: Array<M3U8>;
}

interface URLData {
  protocol: string;
  hostName: string;
  basePath: string;
}

export interface WorkflowData {
  workflowId: number;
  url: string;
  urlData: URLData;
  type?: string;
  streamName: string;
  startTime?: number;
  baseLiveUrl: string;
  token?: string;
  cookie?: Cookie[];
  urlType?: string;
  savePath?: string;
  baseSavePath?: string;
  setLevel?: M3U8;
  newSetLevel?: M3U8;
  manifestObject?: Manifest;
  workflowType?: string;
  dvr?: number;
  contentType?: string;
  requestCookie?: request.Cookie;
  stringCookie?: string;
}

interface WorkflowType {
  id: number;
  tasks: string[];
}

export interface ModulesObject {
  [type: string]: Module;
}

export interface Module {
  id: number;
  path: string;
  adaptors: string[];
  create(Task: Task): Task;
}

export class Workflow {
  public type: string;
  public id: number;
  public steps: Step[];
  public requiredModules: ModulesObject;
  public status: string;
  public totalTasks = 0;
  public completedTasks = 0;
  public isCleanup: boolean;

  constructor(public data: WorkflowData) {
    this.status = workflowStatuses.NOT_STARTED;
    this.id = data.workflowId;
    this.type = data.type;
    this.steps = Object.entries(StepConfig).map(step => {
      return new Step(Number(step[0]), step[1], this.type);
    });
    this.steps.map(step => step.tasks.map(task => this.totalTasks++));
  }

  public trimSteps() {
    this.steps = this.steps.filter(step => step.tasks.length > 0);
    this.steps.map((step, index) => (step.id = index + 1));
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
