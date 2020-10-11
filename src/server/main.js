/**
 * Web API entry point.
 *
 * @author J. Scott Smith
 * @license BSD-2-Clause-FreeBSD
 * @module server/main
 */

const isProd = process.env.NODE_ENV === 'production'
const { createLogger, format, transports } = require('winston')
const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: isProd
    ? format.json()
    : format.combine(format.timestamp(), format.prettyPrint()),
  transports: [new transports.Console()]
})

process.on('uncaughtException', err => {
  logger.error(`An unexpected error occurred\n  ${err.stack}`)
  process.exit(1)
})

process.on('unhandledRejection', err => {
  if (!err) {
    logger.error('An unexpected empty rejection occurred')
  } else if (err instanceof Error) {
    logger.error(`An unexpected rejection occurred\n  ${err.stack}`)
  } else {
    logger.error(`An unexpected rejection occurred\n  ${err}`)
  }
  process.exit(1)
})

require('./app')(logger)
  .then(app => {
    const port = app.get('port')
    const server = app.listen(port)

    process.on('SIGTERM', () => {
      // Handle SIGTERM gracefully for Docker
      // SEE: http://joseoncode.com/2014/07/21/graceful-shutdown-in-node-dot-js/

      new Promise(resolve => server.close(resolve))
        .then(() => {
          server.unref()

          const pools = app.get('pools')
          if (pools)
            return Promise.all(
              Object.keys(pools).map(key => pools[key].destroy())
            )
        })
        .then(() => {
          process.exit(0)
        })
    })

    return new Promise((resolve, reject) => {
      server.once('error', reject)
      server.once('listening', () => {
        logger.info(
          `Feathers application started on ${app.get('host')}:${port}`
        )
        resolve(server)
      })
    })
  })
  .catch(err => {
    logger.error(err)
  })
