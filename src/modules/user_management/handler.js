const config = require('config')
const _ = require('lodash')
const util = require('util')
const constants = require('../../constants')
const logger = require('../../utils/logger.util')
const { manageRocketUser } = require('../../services/rokect')
const { manageVanillaUser } = require('../../services/vanilla')
const {
  getTopcoderUserHandle: getUserHandle,
  getAllChallengeRolesForUser,
  getProjectRoleForUser,
  processPayload
} = require('./helpers')

const services = []

if (config.ROCKETCHAT_ENABLED) {
  services.push(manageRocketUser)
}

if (config.VANILLA_ENABLED) {
  services.push(manageVanillaUser)
}

function canProcessEvent (topic) {
  if (!_.includes([constants.KAFKA.TOPICS.RESOURCE_CREATE_TOPIC, constants.KAFKA.TOPICS.RESOURCE_DELETE_TOPIC], topic)) {
    logger.debug('Not supported topic.')
    return false
  }
  return true
}

async function processPayloadItem (item, topic) {
  const data = processPayload(item, topic)
  try {
    data.handle = data.handle || (await getUserHandle(data.userId))
    data.projectRole = (await getProjectRoleForUser(data.challengeId, data.userId))
    data.challengeRoles = (await getAllChallengeRolesForUser(data.challengeId, data.userId))
  } catch (err) {
    logger.error(util.inspect(err))
  }
  for (const service of services) {
    await service(data)
      .catch(err => {
        logger.error(util.inspect(err))
      })
  }
}

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 * @param {String} topic
 */
async function handler (messageSet, topic) {
  if (services.length === 0) {
    logger.warn('3 No enabled services to handle messages')
    return
  }
  for (const item of messageSet) {
    if (!canProcessEvent(topic)) {
      continue
    }
    if (_.isArray(item)) {
      for (const i of item) {
        await processPayloadItem(i, topic)
      }
    } else {
      await processPayloadItem(item, topic)
    }
  }
}
module.exports = handler
