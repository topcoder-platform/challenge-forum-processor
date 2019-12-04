const config = require('config')
const moment = require('moment')
const _ = require('lodash')
const { rocketChatClient } = require('../../utils/rocket-client.util')
const logger = require('../../utils/logger.util')

/**
 * Processes a payload from the topic, to be consumed by the handler
 * @param {Object} payload
 */
function processPayload (payload) {
  // Set the url of the challenge
  payload.url = `${config.TOPCODER.ROOT_URL}/challenges/${payload.id}`
  // Derive deadlines from the duration of phases
  const deadline = {}
  _.each(payload.phases, (phase, idx) => {
    // Set the value of deadline to the value of the start date
    deadline[phase.id] = payload.startDate
    // If the phase has a predecessor, set the deadline to the value of the
    // deadline to the value of the deadline of the predecessor
    if (phase.predecessor) {
      deadline[phase.id] = deadline[phase.predecessor]
    }
    // Convert the phase deadline to a moment object
    deadline[phase.id] = moment(deadline[phase.id])
    // Add the duration of the phase to get the final deadline
    deadline[phase.id] = deadline[phase.id]
      .add(phase.duration, 'hours')
      .utc()
      .format()
    // Set the deadline of the phase
    payload.phases[idx].deadline = deadline[phase.id]
  })
  // Return the payload, with the added information
  return payload
}

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

module.exports = {
  processPayload,
  findUnusedRoomName,
  createRoom,
  postIntroductoryMessage,
  setGroupDescription,
  setGroupChallengeId,
  setGroupAnnouncement,
  setGroupTopic
}
