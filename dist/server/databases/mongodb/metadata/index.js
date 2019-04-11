"use strict";

const MongoClient = require('mongodb').MongoClient;

module.exports = async app => {
  const {
    metadata
  } = app.get('databases').mongodb;
  const log = app.logger; // Configure a new instance

  let retries = 100;

  while (true) {
    try {
      metadata.client = await MongoClient.connect(metadata.url, metadata.options);
      metadata.db = metadata.client.db(metadata.dbName);
      break;
    } catch (err) {
      log.error(err);
    }

    if (retries-- === 0) throw new Error('MongoDB connection retry attempts exceeded');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};