const config = require('config')
const util = require('util')
const logger = require('../../utils/logger.util')
const { updateVanillaEntities } = require('../../services/vanilla')
const { processPayload } = require('./helpers')

const services = []

if (config.VANILLA_ENABLED) {
  services.push(updateVanillaEntities)
}

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 * @param {String} topic
 */
async function handler (messageSet, topic) {
  if (services.length === 0) {
    logger.warn('No enabled services to handle messages')
    return
  }
  for (const item of messageSet) {
    const challenge = processPayload(item, topic)
    for (const service of services) {
      await service(challenge)
        .catch(err => {
          logger.error(util.inspect(err))
        })
    }
  }
}

module.exports = handler
