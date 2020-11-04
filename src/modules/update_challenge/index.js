const Kafka = require('no-kafka')
const constants = require('../../constants')
const handler = require('./handler')

module.exports = {
  topics: [constants.KAFKA.TOPICS.CHALLENGE_UPDATE_TOPIC],
  handler: handler,
  options: {
    time: Kafka.LATEST_OFFSET
  }
}
