import { Router, Request, Response, NextFunction } from "express";
import { configureWorkflow } from "../../modules/workflow-manager";
import { BaseRouter } from "./base-router";
import * as urlModule from "url";

class ManifestRouter extends BaseRouter {
  constructor() {
    super();
  }

  public initRoutes() {
    this.router.get("/", this.requestManifest.bind(this));
  }

  private async requestManifest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!req.query.manifest) {
      const error = new Error("Missing vod manifest location");
      this.handleResponse(
        400,
        {
          message: error.message,
          success: false
        },
        res
      );
      return;
    }

    try {
      const workflowId = Date.now();
      const workflow = await configureWorkflow({
        workflowId: workflowId,
        body: req.query
      });
      const newManifest = workflow.data.newSetLevel.toString();
      let origin = "localhost";
      if (req.get("origin")) {
        const urlParsed = urlModule.parse(req.get("origin"));
        origin = urlParsed.host;
      } else {
        origin = "localhost";
      }
      res.set({
        "Content-Type": workflow.data.contentType,
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "*",
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
        Expires: 0,
        Vary: "Accept-Encoding"
      });
      res.send(newManifest);
      const createLiveWorkflow = configureWorkflow({
        workflowId: Date.now(),
        body: {
          manifest: workflow.data.baseLiveUrl,
          token: workflow.data.token ? workflow.data.token : null,
          type: "CREATE_LIVE",
          dvr: workflow.data.dvr ? workflow.data.dvr.toString() : null,
          previousManifest: workflow.data.manifestObject,
          stringCookie: workflow.data.requestCookie
            ? encodeURIComponent(workflow.data.requestCookie.toString())
            : null
        }
      });
    } catch (error) {
      res.send(error.message);
    }
  }

  private handleResponse(status: number, data: any, res: Response) {
    res.status(status).json(data);
  }
}

export default new ManifestRouter().router;
