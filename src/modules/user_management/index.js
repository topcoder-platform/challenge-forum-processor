const Kafka = require('no-kafka')
const constants = require('../../constants')
const handler = require('./handler')

module.exports = {
  topics: [
    constants.KAFKA.TOPICS.RESOURCE_CREATE_TOPIC,
    constants.KAFKA.TOPICS.RESOURCE_DELETE_TOPIC
  ],
  handler,
  options: {
    time: Kafka.LATEST_OFFSET
  }
}
