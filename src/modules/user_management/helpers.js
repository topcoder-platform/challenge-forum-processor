const _ = require('lodash')
const constants = require('../../constants')
const topcoderApi = require('../../utils/topcoder-api.util')

/**
 * Processes a payload from the topic, to be consumed by the handler
 * Extract the challengeId, userId, handle and action from the different topics
 * @param {Object} payload
 * @param {String} topic
 */
function processPayload (payload, topic) {
  const eventTypes = constants.KAFKA.CHALLENGE_NOTIFICATION_EVENT_TYPES
  const actionMap = {
    [eventTypes.USER_REGISTRATION]: constants.USER_ACTIONS.INVITE,
    [eventTypes.USER_UNREGISTRATION]: constants.USER_ACTIONS.KICK
  }
  switch (topic) {
    case constants.KAFKA.TOPICS.RESOURCE_CREATE_TOPIC:
      return {
        challengeId: payload.challengeId,
        userId: payload.memberId,
        handle: payload.memberHandle,
        action: constants.USER_ACTIONS.INVITE
      }
    case constants.KAFKA.TOPICS.RESOURCE_DELETE_TOPIC:
      return {
        challengeId: payload.challengeId,
        userId: payload.memberId,
        handle: payload.memberHandle,
        action: constants.USER_ACTIONS.KICK
      }
    case constants.KAFKA.TOPICS.CHALLENGE_NOTIFICATION_TOPIC:
      if (payload.detail && payload.detail.challengeId) {
        // hack due to inconsistent payload from USER_UNREGISTRATION event
        return {
          challengeId: payload.detail.challengeId,
          userId: payload.detail.userId,
          action: actionMap[payload.type]
        }
      }
      return {
        challengeId: payload.data.challengeId,
        userId: payload.data.userId,
        action: actionMap[payload.type]
      }
    default:
      throw new Error(`Received message from unrecognized '${topic}'`)
  }
}

/**
 * Get the Topcoder handle of a user, given the user's Topcoder userId
 * @param {String} userId
 */
async function getTopcoderUserHandle (userId) {
  const userDetails = await topcoderApi.getUserDetailsById(userId)
  const userHandle = _.get(userDetails, 'body.result.content[0].handle')
  if (_.isUndefined(userHandle)) {
    throw new Error('Topcoder user not found')
  }
  return userHandle
}

module.exports = {
  getTopcoderUserHandle,
  processPayload
}
