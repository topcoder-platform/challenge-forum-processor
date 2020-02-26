/*
 * RocketChat services.
 */
const _ = require('lodash')
const logger = require('../utils/logger.util')
const constants = require('../constants')
const { generateAnnouncement } = require('../utils/common.util')
const { rocketChatClient } = require('../utils/rocket-client.util')

// Templates used to generate messages to post in the group
const introductoryMessageTemplate = _.template(
  constants.TEMPLATES.GROUP_INTRODUCTION_STRING
)
const descriptionTemplate = _.template(constants.TEMPLATES.GROUP_DESCRIPTION_STRING)
const topicTemplate = _.template(constants.TEMPLATES.GROUP_TOPIC_STRING)

/**
 * Finds an unused room name (RocketChat doesn't allow duplicates)
 * @param {String} roomName
 */
async function findUnusedRoomName (roomName) {
  let nextRoomName = roomName
  let groupNumber = 0
  while (true) {
    try {
      await rocketChatClient.groups.info(null, nextRoomName)
      groupNumber += 1
      nextRoomName = `${roomName}_${groupNumber}`
    } catch (err) {
      roomName = nextRoomName
      break
    }
  }
  return nextRoomName
}

/**
 * Creates a room in rocketchat with the specifies room name
 * @param {String} roomName
 */
async function createRoom (roomName) {
  try {
    const roomCreationResponse = await rocketChatClient.groups.create(roomName)
    logger.info(
      `Private group / room created: ${roomName} (${
        roomCreationResponse.group._id
      })`
    )
    return roomCreationResponse
  } catch (err) {
    logger.error('Private group / room creation error: ', err)
    throw err
  }
}

/**
 * Posts the introductory message to the group
 * @param {String} groupId
 * @param {String} message
 */
async function postIntroductoryMessage (groupId, message) {
  try {
    await rocketChatClient.chat.postMessage({
      roomId: groupId,
      text: message
    })
    logger.info('Chat message posted')
  } catch (err) {
    logger.error(`Couldn't post message: ${err.stack}`)
    throw err
  }
}

/**
 * Sets the Description of the RocketChat group
 * @param {String} groupId
 * @param {String} description
 */
async function setGroupDescription (groupId, description) {
  try {
    await rocketChatClient.groups.setDescription(groupId, description)
    logger.info('Group description set')
  } catch (err) {
    logger.error(`Couldn't set description: ${err.message}`)
    throw err
  }
}

/**
 * Sets the "challengeId" custom field for a RocketChat group
 * @param {String} groupId
 * @param {String} challengeId
 */
async function setGroupChallengeId (groupId, challengeId) {
  try {
    await rocketChatClient.groups.setCustomFields(groupId, { challengeId })
    logger.info('Group Challenge ID set')
  } catch (err) {
    logger.error(`Couldn't set group challenge Id: ${err.message}`)
    throw err
  }
}

/**
 * Sets the Announcement for a RocketChat group
 * @param {String} groupId
 * @param {String} announcement
 */
async function setGroupAnnouncement (groupId, announcement) {
  try {
    await rocketChatClient.groups.setAnnouncement(groupId, announcement)
    logger.info('Group announcement set')
  } catch (err) {
    logger.error(`Couldn't set announcement: ${err.message}`)
    throw err
  }
}

/**
 * Sets the topic for a RocketChat group
 * @param {String} groupId
 * @param {String} topic
 */
async function setGroupTopic (groupId, topic) {
  try {
    await rocketChatClient.groups.setTopic(groupId, topic)
    logger.info('Group topic set')
  } catch (err) {
    logger.error(`Couldn't set topic: ${err.message}`)
    throw err
  }
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

/**
 * Invite/Remove a user to/from a group.
 *
 * @param {Object} data the data from message payload
 * @returns {undefined}
 */
async function manageRocketUser (data) {
  const { challengeId, action, handle } = data
  // Find RocketChat Group
  const group = await findGroup(challengeId)

  // Find user
  const user = await getRocketUser(handle)

  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE:
      // Invite user to group
      await inviteUserToGroup(group._id, user._id)
      logger.info(
        `Added ${handle} to group ${
          group.name
        } for challenge ${challengeId}`
      )
      break
    case constants.USER_ACTIONS.KICK:
      // Kick user from group
      await kickUserFromGroup(group._id, user._id)
      logger.info(
        `Removed ${handle} from group ${
          group.name
        } for challenge ${challengeId}`
      )
      break
    default:
      // Unrecognized action. Throw error
      throw new Error('Unrecognized action')
  }
}

/**
 * Create a RocketChat room for a challenge.
 *
 * @param {Object} challenge the challenge data
 */
async function createRocketChatRoom (challenge) {
  let roomName = challenge.track + '_' + challenge.name.replace(/ /g, '_')

  // Find an unused group name
  roomName = await findUnusedRoomName(roomName)

  // Create group
  const { group } = await createRoom(roomName)

  // Post Introductory Message
  const message = introductoryMessageTemplate({ challenge })
  await postIntroductoryMessage(group.name, message)

  // Set description
  const description = descriptionTemplate({ challenge })
  await setGroupDescription(group._id, description)

  const announcement = generateAnnouncement(challenge)
  await setGroupAnnouncement(group._id, announcement)

  // Set the challengeId as a custom field
  await setGroupChallengeId(group._id, challenge.id)

  // Set Topic
  const topic = topicTemplate({ challenge })
  await setGroupTopic(group._id, topic)
}

module.exports = {
  manageRocketUser,
  createRocketChatRoom
}
