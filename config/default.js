/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */
'use strict';
const fs = require('fs');
/**
 * This module is the configuration of the app.
 * Changes in 1.1:
 * - changes related to https://www.topcoder.com/challenges/30060466
 * @author TCSCODER
 * @version 1.1
 */
/* eslint-disable */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PARTITION: process.env.PARTITION || 0,
  TOPIC: process.env.TOPIC || 'challenge.notification.create',
  KAFKA_OPTIONS: {
    connectionString: process.env.KAFKA_URL || 'silver-craft-01.srvs.cloudkafka.com:9093,silver-craft-01.srvs.cloudkafka.com:9094',
    ssl: {
      cert: process.env.KAFKA_CLIENT_CERT || fs.readFileSync('./config/kafka_client.cer'), // eslint-disable-line no-sync
      key: process.env.KAFKA_CLIENT_CERT_KEY || fs.readFileSync('./config/kafka_client.key'), // eslint-disable-line no-sync
      passphrase: 'secret', // NOTE:* This configuration specifies the private key passphrase used while creating it.
    }
  },
  ROCKETCHAT_OPTIONS:{
    username:' ',
    password:' ',
    host:' ',
    port:' '
  }
};
