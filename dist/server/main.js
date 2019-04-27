"use strict";

/**
 * Web API entry point.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module server/main
 */
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});
process.on('uncaughtException', err => {
  logger.error(`An unexpected error occurred\n  ${err.stack}`);
  process.exit(1);
});
process.on('unhandledRejection', err => {
  if (!err) {
    logger.error('An unexpected empty rejection occurred');
  } else if (err instanceof Error) {
    logger.error(`An unexpected rejection occurred\n  ${err.stack}`);
  } else {
    logger.error(`An unexpected rejection occurred\n  ${err}`);
  }

  process.exit(1);
}); // TODO: Handle SIGTERM gracefully for Docker
// SEE: http://joseoncode.com/2014/07/21/graceful-shutdown-in-node-dot-js/

require('./app')(logger).then(app => {
  const port = app.get('port');
  const server = app.listen(port);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', () => {
      logger.info(`Feathers application started on ${app.get('host')}:${port}`);
      resolve(server);
    });
  });
}).catch(err => {
  logger.error(err);
});