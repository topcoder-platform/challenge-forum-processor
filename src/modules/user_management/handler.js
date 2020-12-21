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

function canProcessEvent (payload, topic) {
  if (topic === constants.KAFKA.TOPICS.CHALLENGE_NOTIFICATION_TOPIC) {
    const eventTypes = constants.KAFKA.CHALLENGE_NOTIFICATION_EVENT_TYPES
    const actionMap = {
      [eventTypes.USER_REGISTRATION]: constants.USER_ACTIONS.INVITE,
      [eventTypes.USER_UNREGISTRATION]: constants.USER_ACTIONS.KICK
    }
    if (!(payload.type in actionMap)) {
      logger.debug(`Not supported ${payload.type}. Only message types ${JSON.stringify(Object.keys(eventTypes))} are processed from '${topic}'`)
      return false
    }
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
    logger.warn('No enabled services to handle messages')
    return
  }
  for (const item of messageSet) {
    if (!canProcessEvent(item, topic)) {
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
