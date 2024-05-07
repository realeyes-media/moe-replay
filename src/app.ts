import * as path from "path";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as pinoModule from "express-pino-logger";
import * as cors from "cors";
import ManifestRouter from "./adaptors/routes/manifest-router";
import LivestreamRouter from "./adaptors/routes/livestream-router";
const pino = pinoModule();

class App {
  public express = express();

  constructor() {
    this.middleware();
    this.routes();
    this.handleErrors();
  }

  private middleware() {
    this.express.use(pino);
    this.express.use(bodyParser.json());
    this.express.use(cookieParser());
    this.express.use(
      bodyParser.urlencoded({
        extended: false
      })
    );
    this.express.use(cors());
  }

  private routes() {
    const router = express.Router();
    router.get("/", async (req, res, next) => {
      res.json({
        message: "RELM!"
      });
    });
    this.express.use("/", router);

    this.express.use("/manifest", ManifestRouter);
    this.express.use("/livestream", LivestreamRouter);
  }

  private handleErrors() {
    this.express.use(
      (
        error: express.ErrorRequestHandler,
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
      ) => {
        response.status(500).send("Server Error");
      }
    );
    this.express.use(
      (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction
      ) => {
        response.status(404).send(`Bad Request. Invalid URL: ${request.path}`);
      }
    );
  }
}

export default new App().express;
