module.exports = (sequelize, DataTypes, modelName, tableName) => {
  return sequelize.define(
    modelName,
    {
      id: {
        allowNull: false,
        field: 'ValueID',
        primaryKey: true,
        type: DataTypes.BIGINT
      },
      datastream_id: {
        allowNull: false,
        field: 'DatastreamID',
        type: DataTypes.INTEGER
      },
      local_date_time: {
        field: 'LocalDateTime',
        type: DataTypes.DATE
      },
      utc_offset: {
        field: 'UTCOffset',
        type: DataTypes.INTEGER
      },
      value: {
        allowNull: false,
        field: 'DataValue',
        type: DataTypes.DOUBLE
      }
    },
    {
      freezeTableName: true,
      tableName
    }
  )
}
