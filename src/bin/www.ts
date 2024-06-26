import * as http from "http";
import App from "../app";
import { log, LogLevels } from "../core/util/logger";

const port = normalizePort(process.env.PORT || 3300);
App.set("port", port);

const server = http.createServer(App);
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function normalizePort(val: number | string): number | string | boolean {
  const port: number = typeof val === "string" ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      log(LogLevels.error, `${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      log(LogLevels.error, `${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  log(LogLevels.info, `Listening on ${bind}`);
}
