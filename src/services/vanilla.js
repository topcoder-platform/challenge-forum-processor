/*
 * Vanilla services.
 */
const config = require('config')
const _ = require('lodash')
const logger = require('../utils/logger.util')
const constants = require('../constants')
const vanillaClient = require('../utils/vanilla-client.util')
const template = require(config.TEMPLATES.TEMPLATE_FILE_PATH)

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

  const { body: categories } = await vanillaClient.getCategoriesByParentUrlCode(challengeId)

  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE: {
      await vanillaClient.addUserToGroup(group.groupID, {
        userID: user.userID
      })
      logger.info(`The user '${user.name}' was added to the group '${group.name}'`)
      // if User is added => watch the category
      logger.info(`The user ${user.name} was added to the category associated with challenge ${challengeId}`)
      for (const category of categories) {
        await vanillaClient.watchCategory(category.categoryID, user.userID, { watched: true })
        logger.info(`The user ${user.name} watches categoryID=${category.categoryID} associated with challenge ${challengeId}`)
      }
      break
    }
    case constants.USER_ACTIONS.KICK: {
      // if User is removed => don't watch the category
      for (const category of categories) {
        await vanillaClient.watchCategory(category.categoryID, user.userID, { watched: false })
        logger.info(`The user ${user.name} stopped watching categoryID=${category.categoryID} associated with challenge ${challengeId}`)
      }
      await vanillaClient.removeUserFromGroup(group.groupID, user.userID)
      logger.info(`The user '${user.name}' was removed from the group '${group.name}'`)
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
  const challengesForums = _.filter(template.categories, ['name', constants.VANILLA.CHALLENGES_FORUM])
  if (!challengesForums) {
    throw new Error('The \'Challenges Forums\' category wasn\'t found')
  }

  const forumTemplate = _.find(challengesForums[0].categories, { categories: [{ track: `${challenge.track}` }] })
  if (!forumTemplate) {
    throw new Error(`The category template for the challenge track '${challenge.track}' wasn't found`)
  }

  const groupTemplate = _.find(forumTemplate.categories, { track: `${challenge.track}` })
  if (!groupTemplate) {
    throw new Error(`The group template for the challenge track '${challenge.track}' wasn't found`)
  }
  const groupNameTemplate = _.template(groupTemplate.group.name)
  const groupDescriptionTemplate = _.template(groupTemplate.group.description)

  const { body: group } = await vanillaClient.createGroup({
    name: groupNameTemplate({ challenge }),
    type: groupTemplate.group.type,
    description: groupDescriptionTemplate({ challenge }),
    challengeID: `${challenge.id}`,
    challengeUrl: `${challenge.url}`
  })

  if (!group.groupID) {
    throw Error(`Group wasn't created: ${JSON.stringify(group)}`)
  }

  logger.info(`The group with GroupID='${group.groupID}' for the challenge '${challenge.id}' was created`)

  const parentCategoryName = forumTemplate.name
  const { body: parentCategory } = await vanillaClient.searchCategories(parentCategoryName)
  if (parentCategory.length === 0) {
    throw new Error(`The default parent category with name '${parentCategoryName}' wasn't found`)
  }

  if (parentCategory.length > 1) {
    throw new Error(`Multiple categories with the name '${parentCategoryName}' are found`)
  }

  // Create the root challenge category
  const { body: challengeCategory } = await vanillaClient.createCategory({
    name: challenge.name,
    urlcode: challenge.id,
    parentCategoryID: parentCategory[0].categoryID,
    displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
  })

  for (const item of groupTemplate.categories) {
    const urlCodeTemplate = _.template(item.urlcode)
    const { body: childCategory } = await vanillaClient.createCategory({
      name: item.name,
      urlcode: urlCodeTemplate({ challenge }),
      parentCategoryID: challengeCategory.categoryID
    })
    logger.info(`Category for the group '${item.name}' was created`)

    for (const discussion of item.discussions) {
      // create a code documents discussion
      const bodyTemplate = _.template(discussion.body)
      await vanillaClient.createDiscussion({
        body: bodyTemplate({ challenge: challenge, prizeSets: groupTemplate.prizeSets }),
        name: discussion.title,
        groupID: group.groupID,
        categoryID: childCategory.categoryID,
        format: constants.VANILLA.DISCUSSION_FORMAT.WYSIWYG,
        closed: discussion.closed,
        pinned: discussion.announce
      })
      logger.info(`Discussion for the group '${discussion.title}' was created`)
    }
  }
}

module.exports = {
  manageVanillaUser,
  createVanillaGroup
}
