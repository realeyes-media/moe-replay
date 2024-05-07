import { WorkflowConfig } from "../config/workflow-config";
import { Workflow, WorkflowData, Manifest } from "../core/models/workflow";
import { Task } from "../core/models/task";
import { startWorkflow } from "../core/control/workflow-controller";
import { M3U8 } from "../core/models/m3u/m3u8";
import { URL } from "url";
import * as path from "path";
import * as config from "../config/config";
import * as querystring from "querystring";
import * as urlModule from "url";
const manifestUrl = config.MANIFEST_URL;
const localPath = config.LOCAL_PATH;
const localUrl = config.LOCAL_URL;

export interface WorkflowConstructor {
  workflowId: number;
  body: RequestBody;
}

interface RequestBody {
  manifest: string;
  token?: string;
  type?: string;
  startTime?: string;
  dvr?: string;
  previousManifest?: Manifest;
  stringCookie?: string;
}

export async function configureWorkflow(
  workflowConfig: WorkflowConstructor
): Promise<Workflow> {
  const data = createConfig(workflowConfig);
  let finishedWorkflow: Workflow;
  if (data instanceof Error) {
    throw data;
  }

  const worflowsExist: boolean = WorkflowConfig[data.type] !== undefined;

  if (worflowsExist) {
    const workflow: Workflow = new Workflow(data);
    workflow.trimSteps();

    finishedWorkflow = await startWorkflow(workflow);
  }

  if (!worflowsExist) {
    throw new Error(`Invalid workflow type: ${data.type}`);
  }

  return finishedWorkflow;
}

function createConfig(data: WorkflowConstructor): WorkflowData | Error {
  const workflowId = data.workflowId;
  const urlType = isUrl(data.body.manifest);
  const streamName = getStreamName(data.body.manifest);
  const baseSavePath = setSavePath(streamName, workflowId);
  const url = setUrl(data.body.manifest, urlType, data.body.token);
  const baseUrlData = setUrlData(url);

  if (!data.body.type) {
    data.body.type = WorkflowConfig.GET_M3U8.name;
  }
  const workflowData: WorkflowData = {
    streamName: streamName,
    type: data.body.type,
    workflowId: workflowId,
    urlType: urlType,
    url: url,
    urlData: baseUrlData,
    baseSavePath: baseSavePath,
    baseLiveUrl: setLiveUrl(baseSavePath),
    savePath: `${baseSavePath + streamName}.m3u8`,
    manifestObject: {
      baseUrl: getBaseURL(url),
      setLevel: new M3U8(),
      streamLevel: []
    }
  };

  if (data.body.previousManifest) {
    workflowData.manifestObject = data.body.previousManifest;
  }

  if (data.body.stringCookie) {
    workflowData.stringCookie = data.body.stringCookie;
  }

  if (data.body.token) {
    workflowData.token = data.body.token;
  }
  if (data.body.startTime) {
    workflowData.startTime = Number(data.body.startTime);
  }
  if (data.body.dvr) {
    workflowData.dvr = Number(data.body.dvr);
  }

  return workflowData;
}

function cleanWorkflowSteps(workflow: Workflow) {
  workflow.steps.filter(step => {
    return step.tasks.length > 0;
  });
  return workflow.steps;
}

function checkWorkflows(element: string): boolean {
  return WorkflowConfig[element.toUpperCase()] !== undefined;
}

function isUrl(s) {
  const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  const urlTest = regexp.test(s);
  let type;
  if (urlTest === true) {
    type = "url";
  } else {
    type = "file";
  }
  return type;
}

function setUrl(url, urlType, token) {
  switch (urlType) {
    case "url": {
      if (token) {
        url = url + "?" + token;
      }
      return url;
    }
    case "file": {
      return manifestUrl + querystring.escape(url);
    }
    default: {
      return manifestUrl + querystring.escape(url);
    }
  }
}

function setUrlData(url: string) {
  const urlObject = new URL(url);
  return {
    protocol: urlObject.protocol,
    hostName: urlObject.host,
    basePath: path.dirname(urlObject.pathname)
  };
}

function setSavePath(streamName, timestamp) {
  return `${localPath}/${streamName}_${timestamp}/`;
}

function getStreamName(url: string) {
  const urlObject = urlModule.parse(url);
  const path = urlObject.pathname;
  const assetName = path.split(".");
  return assetName[0].replace(/\//g, "_");
}

function setLiveUrl(savePath) {
  const path = querystring.escape(savePath);
  const delimiter = path.charAt(0) === "/" ? "" : "/";
  return `${localUrl}livestream${delimiter}${path}`;
}

function getBaseURL(url: string) {
  return url.match(/^(.*[\\\/])/)[1];
}
