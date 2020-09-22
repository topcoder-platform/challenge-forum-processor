/*
 * Vanilla services.
 */
const _ = require('lodash')
const logger = require('../utils/logger.util')
const constants = require('../constants')
const { generateAnnouncement } = require('../utils/common.util')
const vanillaClient = require('../utils/vanilla-client.util')

const challengeLinkTemplate = _.template(constants.TEMPLATES.TOPCODER_CHALLENGE_LINK)
const groupDescriptionTemplate = _.template(constants.TEMPLATES.GROUP_TOPIC_STRING)
/**
 * Add/Remove a user to/from a category.
 *
 * @param {Object} data the data from message payload
 * @returns {undefined}
 */
async function manageVanillaUser (data) {
  const { challengeId, action, handle: username } = data
  logger.info(`Trying to find '${username}'`)
  const { body: [user] } = await vanillaClient.getUserByName(username)
  if (!user) {
    throw new Error(`User with username ${username} not found`)
  }
  const { body: groups } = await vanillaClient.searchGroups(challengeId)
  const group = _.find(groups, function (e) { return e.name.includes(challengeId) })
  if (!group) {
    throw new Error(`Group for challengeId '${challengeId}' not found`)
  }

  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE: {
       await vanillaClient.addUserToGroup(group.groupID, {
          userID: user.userID
       })
      logger.info(`The user '${user.name}' is added to the group '${group.name}'`)
      //TODO: if User is added => watch the category
      /**
      await vanillaClient.watchCategory(questionCategory.categoryID, user.userID, { watched: true })
      logger.info(`The user ${user.name} watches the category ${questionCategory.categoryID} associated with challenge ${challengeId}`)
      await vanillaClient.watchCategory(documentCategory.categoryID, user.userID, { watched: true })
      logger.info(`The user ${user.name} watches the category ${documentCategory.categoryID} associated with challenge ${challengeId}`)
      **/
      break
    }
    case constants.USER_ACTIONS.KICK: {
      //TODO: if User is added => watch the category
      /**
      await vanillaClient.watchCategory(questionCategory.categoryID, user.userID, { watched: false })
      logger.info(`The user ${user.name} stops watching the category ${questionCategory.categoryID} associated with challenge ${challengeId}`)
      await vanillaClient.watchCategory(documentCategory.categoryID, user.userID, { watched: false })
      logger.info(`The user ${user.name} stop watching the category ${documentCategory.categoryID} associated with challenge ${challengeId}`)
      **/
      await vanillaClient.removeUserFromGroup(group.groupID, user.userID)
      logger.info(`The user '${user.name}' is removed from the group '${group.name}'`)
      break
    }
    default:
      // Unrecognized action. Throw error
      throw new Error('Unrecognized action')
  }
}

/**
 * Create a vanilla forum group for a challenge.
 *
 * @param {Object} challenge the challenge data
 */
async function createVanillaGroup (challenge) {
  const groupDescription = groupDescriptionTemplate({ challenge })
  const { body: group } = await vanillaClient.createGroup({
    description: groupDescription,
   // format: constants.VANILLA.GROUP_POST_FORMAT.TEXT,
    name: `${challenge.name}`,
    challengeID: `${challenge.id}`,
    challengeLink: `${challenge.url}`,
    type: constants.VANILLA.GROUP_PRIVACY.SECRET
  })

  logger.info(`New group for the challenge '${challenge.id}' is created`)

  const challengeLink = challengeLinkTemplate({ challenge })
  // create a read-only discussion to present the challenge summary.
  const announcement = generateAnnouncement(challenge)
  await vanillaClient.createDiscussion({
    body: `${challengeLink}${constants.VANILLA.LINE_BREAKS.HTML}${announcement}`,
    name: constants.VANILLA.CHALLENGE_OVERVIEW_TITLE,
    groupID: group.groupID,
    format: constants.VANILLA.DISCUSSION_FORMAT.WYSIWYG,
    closed: true,
    pinned: true
  })

  logger.info(`Announcement for the group '${group.name}' is created`)

  // create a code documents discussion
  await vanillaClient.createDiscussion({
    body: constants.VANILLA.DOCUMENT_CATEGORY_NAME,
    name: constants.VANILLA.DOCUMENT_CATEGORY_NAME,
    groupID: group.groupID,
    format: constants.VANILLA.DISCUSSION_FORMAT.WYSIWYG,
    closed: true,
    pinned: false
  })

  logger.info(`Discussion for the group '${group.name}' is created`)
}

module.exports = {
  manageVanillaUser,
  createVanillaGroup
}
