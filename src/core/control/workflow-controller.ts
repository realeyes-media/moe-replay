import { Workflow, WorkflowData } from "../models/workflow";
import { log, LogLevels } from "../util/logger";
import { Task } from "../models/task";
import {
  configureWorkflow,
  WorkflowConstructor
} from "../../modules/workflow-manager";
import { initTask } from "./task-controller";

/**
 * Starts workflow and runs concurrency groups as Promise.all
 * This is the parent "catch" block, this is where error handling happens for the application
 * @param {Workflow} workflow
 * @returns {Promise<>}
 */
export async function startWorkflow(workflow: Workflow): Promise<Workflow> {
  try {
    log(LogLevels.info, `Workflow ${workflow.type} started`);
    workflow.initialize();

    if (!workflow.isCleanup) {
      // initialize db
    }

    for (const step of workflow.steps) {
      log(LogLevels.info, `Starting step: ${step.id}`);
      step.initialize();

      const requiredTasks: Task[] = step.tasks.filter(task => task.required);
      const nonRequiredTasks: Task[] = step.tasks.filter(
        task => !task.required
      );
      runNonRequiredTasks(nonRequiredTasks, workflow);
      const requiredTaskPromises = requiredTasks.map(task =>
        initTask(task, workflow.data)
      );

      const awaitedRequiredTasks = await Promise.all(requiredTaskPromises);
      step.complete();
      log(LogLevels.info, `Finished step: ${step.id}`);
      workflow.data = await handleCompletedTasks(
        awaitedRequiredTasks,
        workflow
      );
    }
    return workflow;
  } catch (error) {
    workflow.error();

    log(LogLevels.info, `Workflow: ${workflow.id} has fatally errored`);
    log(LogLevels.error, error);
    throw error;
  }
}

async function runNonRequiredTasks(tasks: Task[], workflow: Workflow) {
  if (tasks.length) {
    const taskPromises = tasks.map(task => initTask(task, workflow.data));
    const awaitedTasks = await Promise.all(taskPromises);

    workflow.data = await handleCompletedTasks(awaitedTasks, workflow);
  }
}

async function handleCompletedTasks(
  tasks: Task[],
  workflow: Workflow
): Promise<WorkflowData> {
  let cleanWorkflow = false;
  let data = {} as WorkflowData;
  tasks.map(task => {
    if (task.complete) {
      task.complete();
      workflow.completedTasks++;
      data = { ...data, ...task.data };
    }
  });

  if (workflow.completedTasks === workflow.totalTasks) {
    finishWorkflow(workflow);
    cleanWorkflow = true;
  }
  return data;
}

function finishWorkflow(workflow: Workflow) {
  log(LogLevels.info, `Workflow: ${workflow.id} complete`);
  workflow.complete();
}
