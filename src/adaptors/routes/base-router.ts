import { Router } from "express";

export abstract class BaseRouter {
  public router: Router;
  // Initialize the WorkflowRouter
  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  public abstract initRoutes();
}
