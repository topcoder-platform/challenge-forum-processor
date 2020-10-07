/*
 * Vanilla services.
 */
const config = require('config')
const _ = require('lodash')
const logger = require('../utils/logger.util')
const constants = require('../constants')
const vanillaClient = require('../utils/vanilla-client.util')
const topcoderApi = require('../utils/topcoder-api.util')
const utils = require('../utils/common.util')
const template = require(config.TEMPLATES.TEMPLATE_FILE_PATH)

/**
 * Add/Remove a user to/from a category.
 *
 * @param {Object} data the data from message payload
 * @returns {undefined}
 */
async function manageVanillaUser (data) {
  const { challengeId, action, handle: username } = data
  logger.info(`Managing users for challengeID=${challengeId} ...`)
  const { body: groups } = await vanillaClient.searchGroups(challengeId)
  const group = groups.length > 0 ? groups[0] : null
  if (!group) {
    throw new Error('The group wasn\'t not found by challengeID')
  }
  let { body: [vanillaUser] } = await vanillaClient.getUserByName(username)
  if (!vanillaUser) {
    logger.info(`The '${username}' user wasn't found in Vanilla`)
    const { text: topcoderProfileResponseStr, status } = await topcoderApi.getUserDetailsByHandle(username)

    const topcoderProfileResponse = JSON.parse(topcoderProfileResponseStr).result
    if (status !== 200) {
      throw new Error('Couldn\'t load Topcoder profile', topcoderProfileResponse.content)
    }
    const topcoderProfile = JSON.parse(topcoderProfileResponseStr).result.content[0]
    const { body: roles } = await vanillaClient.getAllRoles()
    const defaultRoles = _.filter(roles, { type: 'member' })
    const roleIDs = _.map(defaultRoles, 'roleID')
    const userData = {
      bypassSpam: true,
      email: topcoderProfile.email + '2',
      emailConfirmed: true,
      name: username,
      password: utils.randomValue(8),
      photo: null,
      roleID: roleIDs
    }
    const { body: user } = await vanillaClient.addUser(userData)
    vanillaUser = user
    logger.info(`New user with UserID=${vanillaUser.userID} was added.`)
  }

  const { body: categories } = await vanillaClient.getCategoriesByParentUrlCode(challengeId)

  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE: {
      await vanillaClient.addUserToGroup(group.groupID, {
        userID: vanillaUser.userID
      })
      logger.info(`The user '${vanillaUser.name}' was added to the group '${group.name}'`)
      // if User is added => watch the category
      for (const category of categories) {
        await vanillaClient.watchCategory(category.categoryID, vanillaUser.userID, { watched: true })
        logger.info(`The user ${vanillaUser.name} watches categoryID=${category.categoryID} associated with challenge ${challengeId}`)
      }
      break
    }
    case constants.USER_ACTIONS.KICK: {
      // if User is removed => don't watch the category
      for (const category of categories) {
        await vanillaClient.watchCategory(category.categoryID, vanillaUser.userID, { watched: false })
        logger.info(`The user ${vanillaUser.name} stopped watching categoryID=${category.categoryID} associated with challenge ${challengeId}`)
      }
      await vanillaClient.removeUserFromGroup(group.groupID, vanillaUser.userID)
      logger.info(`The user '${vanillaUser.name}' was removed from the group '${group.name}'`)
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
  logger.info(`The challenge with challengeID=${challenge.id}:`)
  const { text: challengeDetailsData, status: responseStatus } = await topcoderApi.getChallenge(challenge.id)
  const challengeDetails = JSON.parse(challengeDetailsData)

  if (responseStatus !== 200) {
    throw new Error(`Couldn't load challenge data from Topcoder API: ${challengeDetails}`)
  }

  if (!challengeDetails.discussions) {
    logger.info('The challenge without discussions.')
    return
  }

  const challengeDiscussions = _.filter(challengeDetails.discussions, { provider: 'vanilla', type: 'challenge' })
  if (challengeDiscussions.length === 0) {
    logger.info('The challenge doesn\'t have discussions with type=\'challenge\' and provider=\'vanilla\'.')
    return
  }

  if (challengeDiscussions.length > 1) {
    throw new Error('Multiple discussions with type=\'challenge\' and provider=\'vanilla\' are not supported.')
  }

  const challengesForums = _.filter(template.categories, ['name', constants.VANILLA.CHALLENGES_FORUM])
  if (!challengesForums) {
    throw new Error(`The '${constants.VANILLA.CHALLENGES_FORUM}' category wasn't found in the template json file`)
  }

  const forumTemplate = _.find(challengesForums[0].categories, { categories: [{ track: `${challenge.track}` }] })
  if (!forumTemplate) {
    throw new Error(`The category template for the '${challenge.track}' track wasn't found in the template json file`)
  }

  const groupTemplate = _.find(forumTemplate.categories, { track: `${challenge.track}` })
  if (!groupTemplate) {
    throw new Error(`The group template for the '${challenge.track}' track wasn't found in the template json file`)
  }

  for (let i = 0; i < challengeDetails.discussions.length; i++) {
    const challengeDetailsDiscussion = challengeDetails.discussions[i]
    if (challengeDetailsDiscussion.type === 'challenge' && challengeDetailsDiscussion.provider === 'vanilla') {
      if (challengeDetailsDiscussion.url && challengeDetailsDiscussion.url !== '') {
        logger.info(`The url has been set for the ${challengeDetailsDiscussion.name} discussion with type='challenge' and provider='vanilla'`)
        continue
      }

      const { body: groups } = await vanillaClient.searchGroups(challenge.id)
      if (groups.length > 0) {
        throw new Error('The group has been created for this challenge')
      }

      logger.info(`Creating Vanilla entities for the '${challengeDetailsDiscussion.name}' discussion ....`)

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
        throw Error('Couldn\'t create a group', JSON.stringify(group))
      }

      logger.info(`The group with groupID=${group.groupID} was created`)

      const parentCategoryName = forumTemplate.name
      const { body: parentCategory } = await vanillaClient.searchCategories(parentCategoryName)
      if (parentCategory.length === 0) {
        throw new Error(`The '${parentCategoryName}' category wasn't found in Vanilla`)
      }

      if (parentCategory.length > 1) {
        throw new Error(`The multiple categories with the '${parentCategoryName}' name were found in Vanilla`)
      }

      // Create the root challenge category
      const { body: challengeCategory } = await vanillaClient.createCategory({
        name: challengeDetailsDiscussion.name,
        urlcode: `${challenge.id}`,
        parentCategoryID: parentCategory[0].categoryID,
        displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
      })

      logger.info(`The '${challengeCategory.name}' category was created`)

      for (const item of groupTemplate.categories) {
        const urlCodeTemplate = _.template(item.urlcode)
        const { body: childCategory } = await vanillaClient.createCategory({
          name: item.name,
          urlcode: `${urlCodeTemplate({ challenge })}`,
          parentCategoryID: challengeCategory.categoryID
        })
        logger.info(`The '${item.name}' category was created`)

        for (const discussion of item.discussions) {
          // create a code documents discussion
          const bodyTemplate = _.template(discussion.body)
          await vanillaClient.createDiscussion({
            body: bodyTemplate({ challenge: challenge }),
            name: discussion.title,
            groupID: group.groupID,
            categoryID: childCategory.categoryID,
            format: constants.VANILLA.DISCUSSION_FORMAT.WYSIWYG,
            closed: discussion.closed,
            pinned: discussion.announce
          })
          logger.info(`The '${discussion.title}' discussion/announcement was created`)
        }
      }

      challengeDetailsDiscussion.url = `${challengeCategory.url}`
      logger.info(`The challenge's discussion url is ${challengeDetailsDiscussion.url}`)
      await topcoderApi.updateChallenge(challenge.id, { discussions: challengeDetails.discussions })
      logger.info('The challenge was updated')
    }
  }
}

module.exports = {
  manageVanillaUser,
  createVanillaGroup
}
