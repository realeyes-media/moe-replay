import { Router, Request, Response, NextFunction } from "express";
import { BaseRouter } from "./base-router";
import promisify = require("promisify-node");
import * as request from "request";
import * as tough from "tough-cookie";
import * as cookieParser from "cookie-parser";
import * as http from "../http/http";
import * as urlModule from "url";

const fs = promisify("fs");

class LivestreamRouter extends BaseRouter {
  constructor() {
    super();
  }

  public initRoutes() {
    this.router.get("/", this.missingUrl.bind(this));
    this.router.get("/proxy", this.proxyFile.bind(this));
    this.router.get("/:videoUrl", this.sendLiveStream.bind(this));
  }

  private async sendLiveStream(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.params.videoUrl) {
        const error = new Error("Missing video url");
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
      const videoUrl = req.params.videoUrl;
      const origin = req.headers["origin"];
      const file = await fs.readFile(videoUrl);
      res.set({
        "Content-Length": file.length,
        "Content-Type": "application/x-mpegURL",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": true,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: 0
      });
      res.status(200).send(file);
    } catch (error) {
      res.status(400).send("video not found");
    }
  }

  private proxyFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.query.segment) {
        const error = new Error("Missing segment url");
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

      const segmentParsed = urlModule.parse(req.query.segment);
      const cookieUrl = segmentParsed.protocol + "//" + segmentParsed.host;
      const cookieJar = request.jar();
      const cookie = req.query.cookie;
      if (!!cookie) {
        cookieJar.setCookie(cookie, cookieUrl);
      }

      const options: request.Options = {
        uri: decodeURI(req.query.segment),
        method: "GET",
        jar: cookieJar
      };

      request(options)
        .on("error", error => {
          throw error;
        })
        .pipe(res);
    } catch (error) {
      res.status(400).send("video not found");
    }
  }

  private missingUrl(req: Request, res: Response, next: NextFunction) {
    res.status(200).send("Please provide a videoUrl");
  }

  private handleResponse(status: number, data: any, res: Response) {
    res.status(status).json(data);
  }
}

export default new LivestreamRouter().router;
