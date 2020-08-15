const util = require('util')
const logger = require('../../utils/logger.util')
const { createRocketChatRoom } = require('../../services/rokect')
const { createVanillaGroup } = require('../../services/vanilla')
const { processPayload } = require('./helpers')

const services = [
  createRocketChatRoom,
  createVanillaGroup
]

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 */
async function handler (messageSet) {
  for (const item of messageSet) {
    const challenge = processPayload(item)
    for (const service of services) {
      await service(challenge)
        .catch(err => {
          logger.error(util.inspect(err))
        })
    }
  }
}

module.exports = handler
