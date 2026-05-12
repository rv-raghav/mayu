/**
 * Winston logger singleton.
 * JSON format in production, colorized in development.
 * @module utils/logger
 */

import winston from 'winston';

const level = process.env['NODE_ENV'] === 'production' ? 'info' : 'debug';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level: lvl, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${String(timestamp)} ${lvl}: ${String(message)}${metaStr}`;
  }),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

/** Application-wide Winston logger. */
export const logger = winston.createLogger({
  level,
  format: process.env['NODE_ENV'] === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});
