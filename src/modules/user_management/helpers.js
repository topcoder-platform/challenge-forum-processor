const _ = require('lodash')
const constants = require('../../constants')
const { rocketChatClient } = require('../../utils/rocket-client.util')
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
      return {
        challengeId: payload.data.challengeId,
        userId: payload.data.userId,
        action: actionMap[payload.type]
      }
    default:
      throw new Error('Received message from unrecognized topic')
  }
}

/**
 * Get the Topcoder handle of a user, given the user's Topcoder userId
 * @param {String} userId
 */
async function getTopcoderUserHandle (userId) {
  const userDetails = await topcoderApi.getUserDetails(userId)
  const userHandle = _.get(userDetails, 'body.result.content[0].handle')
  if (_.isUndefined(userHandle)) {
    throw new Error('Topcoder user not found')
  }
  return userHandle
}

/**
 * Finds the RocketChat group corresponding to a Topcoder challenge
 * @param {String} challengeId
 */
async function findGroup (challengeId) {
  const groupData = await rocketChatClient.groups.listAll({
    query: {
      customFields: { challengeId }
    },
    count: 1
  })
  const group = _.get(groupData, 'groups[0]')
  if (_.isUndefined(group)) {
    throw new Error('Group not found for challenge.')
  }
  return group
}

/**
 * Gets a RocketChat user details of a user, given the Topcoder handle
 * @param {String} handle
 */
async function getRocketUser (handle) {
  const userInfo = await rocketChatClient.users.info({
    username: handle
  })
  const user = _.get(userInfo, 'user')
  if (_.isUndefined(user)) {
    throw new Error('Rocketchat user not found')
  }
  return user
}

/**
 * Invites a RocketChat user to a RocketChat Group
 * @param {String} groupId
 * @param {String} userId
 */
async function inviteUserToGroup (groupId, userId) {
  const data = await rocketChatClient.groups.invite(groupId, userId)
  const success = _.isEqual(_.get(data, 'success'), true)
  if (_.isUndefined(success || !success)) {
    throw new Error("Couldn't add user to group")
  }
  return success
}

/**
 * Kicks a RocketChat user from a RocketChat group
 * @param {String} groupId
 * @param {String} userId
 */
async function kickUserFromGroup (groupId, userId) {
  const data = await rocketChatClient.groups.kick(groupId, userId)
  const success = _.isEqual(_.get(data, 'success'), true)
  if (_.isUndefined(success || !success)) {
    throw new Error("Couldn't remove user from group")
  }
  return success
}

module.exports = {
  getTopcoderUserHandle,
  getRocketUser,
  findGroup,
  inviteUserToGroup,
  kickUserFromGroup,
  processPayload
}
