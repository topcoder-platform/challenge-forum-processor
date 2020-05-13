const config = require('config')
const util = require('util')
const logger = require('../../utils/logger.util')
const { createRocketChatRoom } = require('../../services/rokect')
const { createVanillaCategory } = require('../../services/vanilla')
const { processPayload } = require('./helpers')

const services = []

if (config.ROCKETCHAT_ENABLED) {
  services.push(createRocketChatRoom)
}

if (config.VANILLA_ENABLED) {
  services.push(createVanillaCategory)
}

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 */
async function handler (messageSet) {
  if (services.length === 0) {
    logger.warn('No enabled services to handle messages')
    return
  }
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
