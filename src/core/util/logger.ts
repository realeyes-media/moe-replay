import * as pinoModule from "pino";

export enum LogLevels {
  trace,
  debug,
  info,
  warn,
  error,
  fatal
}

const pinoLog = {
  0: (...args) => pino.trace(args),
  1: (...args) => pino.debug(args),
  2: (...args) => pino.info(args),
  3: (...args) => pino.warn(args),
  4: (...args) => pino.error(args),
  5: (...args) => pino.fatal(args)
};

const pino = pinoModule();

export function log(level: LogLevels, ...args) {
  pinoLog[level](args);
}
