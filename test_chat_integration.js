/*
 * Copyright (c) 2017 TopCoder, Inc. All rights reserved.
 */
/**
 * This module is the wrapper of the kafka consumer.
 *
 * Changes in 1.1:
 * - changes related to https://www.topcoder.com/challenges/30060466
 * @author TCSCODER
 * @version 1.1
 */
'use strict';

const config = require('./config/default.js');
const kafka = require('no-kafka');
const rocketchat = require('rocketchat-api');


class Kafka {
  constructor() {
    this.consumer = new kafka.SimpleConsumer(config.KAFKA_OPTIONS);
    this.producer = new kafka.Producer(config.KAFKA_OPTIONS);

    this.producer.init().then(() => {
      console.info('kafka producer is ready.');
    }).catch((err) => {
      console.error(`kafka producer is not connected. ${err.stack}`);
    });

    this.check = this.check.bind(this);
  }

  messageHandler(messageSet) {
    console.log(this.rocketchat_api);
    messageSet.forEach((item) => {
      // The event should be a JSON object
      let event;
      console.log(this.rocketchat_api);
      try {
        event = JSON.parse(item.message.value.toString('utf8'));
        event = event.payload;
        console.debug(event);


        var rocketChatClient=new rocketchat('https','chat.topcoder-dev.com', 443);

        rocketChatClient.login(config.ROCKETCHAT_OPTIONS.username, config.ROCKETCHAT_OPTIONS.password).then((body, self)=>{
          console.info('Rocket chat is ready');
          var roomName = event.track + "_" + event.name.replace(/ /g, '_');
          rocketChatClient.groups.create(roomName, ['tc-admin', 'Ghostar'], (err, body)=>{
          if(err){
            console.log("Private group / room creation error", err);
          }
          else{
            console.log("Private group / room created:", roomName, body.group._id);
            rocketChatClient.chat.postMessage({roomId:body.group._id, text:"Welcome to Topcoder " + event.track + " challenge!\r\nPlease post your questions in this chat group, thanks!"}, this.chatPosted);
          }
        });

        }).catch((err) => {
          console.error(`Rocket chat connect failed.  ${err.stack}`);
        });

      } catch (err) {
        console.error(`"message" is not a valid JSON-formatted string: ${err.message}`);
        return;
      }

      console.debug(event);
    });
  }

  chatPosted(errContent, body){
    console.log("Chat message posted", errContent);
  }

  // check if there is kafka connection alive
  check() {
    if (!this.consumer.client.initialBrokers && !this.consumer.client.initialBrokers.length) {
      return false;
    }
    let connected = true;
    this.consumer.client.initialBrokers.forEach((conn) => {
      connected = conn.connected && connected;
    });

    return connected;
  }

  run() {
    this.consumer.init().then(() => {
      console.info('kafka consumer is ready');
      this.consumer.subscribe(config.TOPIC, {}, this.messageHandler);
    }).catch((err) => {
      console.error(`kafka consumer is not connected. ${err.stack}`);
    });
  }
}
new Kafka().run();