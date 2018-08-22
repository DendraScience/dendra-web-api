const path = require('path')

module.exports = (sequelize) => {
  const names = [
    'datavalues2',
    'datavalues_borr',
    'datavalues_day',
    'datavalues_month',
    'datavalues_motes',
    'datavalues_sagehen',
    'datavalues_seasonal',
    'datavalues_ucnrs'
  ]

  const models = {}
  names.forEach(name => {
    models[name] = sequelize.import(path.join(__dirname, name.toLowerCase()))
  })

  return models
}
