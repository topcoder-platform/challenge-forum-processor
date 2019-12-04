const logger = require('../../utils/logger.util')
const constants = require('../../constants')
const {
  getTopcoderUserHandle: getUserHandle,
  findGroup,
  getRocketUser,
  inviteUserToGroup,
  kickUserFromGroup,
  processPayload
} = require('./helpers')

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 * @param {String} topic
 */
async function handler (messageSet, topic) {
  for (const item of messageSet) {
    const { challengeId, userId, action, handle } = processPayload(item, topic)
    try {
      // Find User
      const userHandle = handle || (await getUserHandle(userId))

      // Find RocketChat Group
      const group = await findGroup(challengeId)

      // Find user
      const user = await getRocketUser(userHandle)

      // Choose action to perform
      switch (action) {
        case constants.USER_ACTIONS.INVITE:
          // Invite user to group
          await inviteUserToGroup(group._id, user._id)
          logger.debug(
            `Added ${userHandle} to group ${
              group.name
            } for challenge ${challengeId}`
          )
          break
        case constants.USER_ACTIONS.KICK:
          // Kick user from group
          await kickUserFromGroup(group._id, user._id)
          logger.debug(
            `Removed ${userHandle} from group ${
              group.name
            } for challenge ${challengeId}`
          )
          break
        default:
          // Unrecognized action. Throw error
          throw new Error('Unrecognized action')
      }
    } catch (err) {
      // Log the error
      logger.error(`[Challenge ID: ${challengeId}] ${err.message}`)
      logger.error(err.stack)
    }
  }
}

module.exports = handler
