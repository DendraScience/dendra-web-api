const { FixedThreadPool } = require('poolifier')

module.exports = function (app) {
  const dendraDatapointMerge = new FixedThreadPool(
    // TODO: Make configurable!!!
    5,
    './dist/server/workers/dendraDatapointMerge.js',
    {
      errorHandler: err => app.logger.error(err),
      onlineHandler: () =>
        app.logger.info('Worker thread is online: dendraDatapointMerge')
    }
  )

  app.set('pools', {
    dendraDatapointMerge
  })
}
