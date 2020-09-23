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
  const group = groups.length > 0 ? groups[0] : null
  if (!group) {
    throw new Error(`The Group for challengeId '${challengeId}' not found`)
  }

  const { body: groupsCategory } = await vanillaClient.getGroupCategory()

  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE: {
      await vanillaClient.addUserToGroup(group.groupID, {
        userID: user.userID
      })
      logger.info(`The user '${user.name}' is added to the group '${group.name}'`)
      // if User is added => watch the category
      await vanillaClient.watchCategory(groupsCategory.categoryID, user.userID, { watched: true })
      logger.info(`The user ${user.name} watches the category ${groupsCategory.categoryID} associated with challenge ${challengeId}`)
      break
    }
    case constants.USER_ACTIONS.KICK: {
      // if User is added => watch the category
      await vanillaClient.watchCategory(groupsCategory.categoryID, user.userID, { watched: false })
      logger.info(`The user ${user.name} stops watching the category ${groupsCategory.categoryID} associated with challenge ${challengeId}`)
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
  const challengeLink = challengeLinkTemplate({ challenge })
  const { body: group } = await vanillaClient.createGroup({
    name: `${challenge.name}`,
    type: constants.VANILLA.GROUP_PRIVACY.SECRET,
    description: groupDescription,
    challengeID: `${challenge.id}`,
    challengeUrl: `${challenge.url}`
  })

  logger.info(`The group with GroupID='${group.groupID}' for the challenge '${challenge.id}' is created`)

  const { body: groupsCategory } = await vanillaClient.getGroupCategory()
  if (groupsCategory) {
    logger.info(`The Group Category is '${groupsCategory.categoryID}'`)
  } else {
    throw new Error('The Groups category should be specified')
  }
  // create a read-only discussion to present the challenge summary.
  const announcement = generateAnnouncement(challenge)
  await vanillaClient.createDiscussion({
    body: `${challengeLink}${constants.VANILLA.LINE_BREAKS.HTML}${announcement}`,
    name: constants.VANILLA.CHALLENGE_OVERVIEW_TITLE,
    categoryID: groupsCategory.categoryID,
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
    categoryID: groupsCategory.categoryID,
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
