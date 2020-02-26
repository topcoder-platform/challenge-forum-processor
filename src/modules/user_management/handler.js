const util = require('util')
const logger = require('../../utils/logger.util')
const { manageRocketUser } = require('../../services/rokect')
const { manageVanillaUser } = require('../../services/vanilla')
const {
  getTopcoderUserHandle: getUserHandle,
  processPayload
} = require('./helpers')

const services = [
  manageRocketUser,
  manageVanillaUser
]

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 * @param {String} topic
 */
async function handler (messageSet, topic) {
  for (const item of messageSet) {
    const data = processPayload(item, topic)
    try {
      data.handle = data.handle || (await getUserHandle(data.userId))
    } catch (err) {
      logger.error(util.inspect(err))
      continue
    }
    for (const service of services) {
      await service(data)
        .catch(err => {
          logger.error(util.inspect(err))
        })
    }
  }
}
module.exports = handler
