module.exports = async (app) => {
  const databases = app.get('databases')

  if (databases.mongodb) await require('./mongodb')(app)
  if (databases.mysql) await require('./mysql')(app)
}
