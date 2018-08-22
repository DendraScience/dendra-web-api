const Sequelize = require('sequelize')
const models = require('./models')

module.exports = async (app) => {
  const {legacy} = app.get('databases').mysql

  // Configure a new instance
  const opts = {
    define: {
      timestamps: false,
      underscored: true
    },
    dialect: 'mysql',
    // TODO: Replace logger with winston; handle this centrally
    logging: console.log
  }
  const sequelize = new Sequelize(legacy.url, opts)

  legacy.Sequelize = Sequelize
  legacy.sequelize = sequelize
  legacy.models = models(sequelize)
}
