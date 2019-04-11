module.exports = async app => {
  const mysql = app.get('databases').mysql

  if (mysql.legacy) await require('./legacy')(app)
}
