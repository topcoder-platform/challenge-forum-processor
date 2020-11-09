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

  const { text: topcoderProfileResponseStr, status } = await topcoderApi.getUserDetailsByHandle(username)

  const topcoderProfileResponse = JSON.parse(topcoderProfileResponseStr).result
  if (status !== 200) {
    throw new Error('Couldn\'t load Topcoder profile', topcoderProfileResponse.content)
  }
  const topcoderProfile = JSON.parse(topcoderProfileResponseStr).result.content[0]

  const { text: topcoderRolesResponseStr } = await topcoderApi.getRoles(topcoderProfile.id)
  const topcoderRolesResponse = JSON.parse(topcoderRolesResponseStr).result.content
  const topcoderRoleNames = _.map(topcoderRolesResponse, 'roleName')

  const { body: allVanillaRoles } = await vanillaClient.getAllRoles()

  // Add all missing Topcoder roles
  await addTopcoderRoles(allVanillaRoles, topcoderRoleNames)

  const { body: allNewVanillaRoles } = await vanillaClient.getAllRoles()

  const allTopcoderRoles = _.filter(allNewVanillaRoles, { type: 'topcoder' })

  const nonTopcoderRoles = _.filter(allNewVanillaRoles, role => role.type !== 'topcoder')
  const nonTopcoderRoleIDs = _.map(nonTopcoderRoles, 'roleID')

  const userTopcoderRoles = _.filter(allTopcoderRoles, role => topcoderRoleNames.includes(role.name))
  const userTopcoderRoleIDs = _.map(userTopcoderRoles, 'roleID')

  if (!vanillaUser) {
    logger.info(`The '${username}' user wasn't found in Vanilla`)

    const defaultVanillaRoles = _.filter(allNewVanillaRoles, { type: 'member' })
    const defaultVanillaRoleIDs = _.map(defaultVanillaRoles, 'roleID')

    const userData = {
      bypassSpam: true,
      email: topcoderProfile.email,
      emailConfirmed: true,
      name: username,
      password: utils.randomValue(8),
      photo: null,
      roleID: [...defaultVanillaRoleIDs, ...userTopcoderRoleIDs]
    }

    const { body: user } = await vanillaClient.addUser(userData)
    vanillaUser = user
    logger.info(`New user with UserID=${vanillaUser.userID} was added.`)
  } else {
    // Get a full user profile with roles
    const { body: user } = await vanillaClient.getUser(vanillaUser.userID)
    vanillaUser = user

    // Sync Topcoder roles
    const allCurrentUserRoleIDs = _.map(vanillaUser.roles, 'roleID')
    const currentVanillaRoleIDs = _.intersection(allCurrentUserRoleIDs, nonTopcoderRoleIDs)
    const userData = {
      roleID: [...currentVanillaRoleIDs, ...userTopcoderRoleIDs]
    }
    await vanillaClient.updateUser(vanillaUser.userID, userData)
  }

  let categories = []
  const { body: nestedCategories } = await vanillaClient.getCategoriesByParentUrlCode(challengeId)
  categories = nestedCategories

  // Some group might not have nested categories
  if (categories.length === 0) {
    const { body: parentCategory } = await vanillaClient.getCategoryByUrlcode(challengeId)
    categories.push(parentCategory)
  }

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
        await vanillaClient.followCategory(category.categoryID, { followed: true, userID: vanillaUser.userID })
        logger.info(`The user ${vanillaUser.name} follows categoryID=${category.categoryID} associated with challenge ${challengeId}`)
      }
      break
    }
    case constants.USER_ACTIONS.KICK: {
      // if User is removed => don't watch the category
      for (const category of categories) {
        await vanillaClient.watchCategory(category.categoryID, vanillaUser.userID, { watched: false })
        logger.info(`The user ${vanillaUser.name} stopped watching categoryID=${category.categoryID} associated with challenge ${challengeId}`)
        await vanillaClient.followCategory(category.categoryID, { followed: false, userID: vanillaUser.userID })
        logger.info(`The user ${vanillaUser.name} unfollows categoryID=${category.categoryID} associated with challenge ${challengeId}`)
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

async function addTopcoderRoles (allVanillaRoles, topcoderRoleNames) {
  const allTopcoderRoles = _.filter(allVanillaRoles, { type: 'topcoder' })
  const userTopcoderRoles = _.filter(allTopcoderRoles, role => topcoderRoleNames.includes(role.name))
  const userTopcoderRoleIDs = _.map(userTopcoderRoles, 'roleID')

  if (topcoderRoleNames.length !== userTopcoderRoleIDs.length) {
    const missingRoles = _.difference(topcoderRoleNames, _.map(userTopcoderRoles, 'name'))
    logger.info('Missing roles:' + JSON.stringify(missingRoles))
    for (const missingRole of missingRoles) {
      await vanillaClient.createRole({
        canSession: 1,
        description: 'Added by Challenge Forum Processor',
        name: missingRole,
        type: 'topcoder'
      })
      logger.info(`Missing roles ${missingRole} was added`)
    }
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

  const { body: project } = await topcoderApi.getProject(challenge.projectId)
  const allProjectRoles = _.values(constants.TOPCODER.PROJECT_ROLES)
  const members = _.filter(project.members, member => {
    return _.includes(allProjectRoles, member.role)
  })

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
        name: challenge.name,
        urlcode: `${challenge.id}`,
        parentCategoryID: parentCategory[0].categoryID,
        displayAs: groupTemplate.categories ? constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES : constants.VANILLA.CATEGORY_DISPLAY_STYLE.DISCUSSIONS
      })

      logger.info(`The '${challengeCategory.name}' category was created`)

      if (groupTemplate.categories) {
        for (const item of groupTemplate.categories) {
          const urlCodeTemplate = _.template(item.urlcode)
          const { body: childCategory } = await vanillaClient.createCategory({
            name: item.name,
            urlcode: `${urlCodeTemplate({ challenge })}`,
            parentCategoryID: challengeCategory.categoryID
          })
          logger.info(`The '${item.name}' category was created`)
          await createDiscussions(group, challenge, item.discussions, childCategory)
        }
      }

      if (groupTemplate.discussions) {
        await createDiscussions(group, challenge, groupTemplate.discussions, challengeCategory)
      }

      for (const member of members) {
        await manageVanillaUser({ challengeId: challenge.id, action: constants.USER_ACTIONS.INVITE, handle: member.handle })
      }

      challengeDetailsDiscussion.url = `${challengeCategory.url}`
      logger.info(`The challenge's discussion url is ${challengeDetailsDiscussion.url}`)
      await topcoderApi.updateChallenge(challenge.id, { discussions: challengeDetails.discussions })
      logger.info('The challenge was updated')
    }
  }
}

/**
 * Update a vanilla forum group.
 *
 * @param {Object} challenge the challenge data
 */
async function updateVanillaGroup (challenge) {
  logger.info(`The challenge with challengeID=${challenge.id}:`)

  const { body: groups } = await vanillaClient.searchGroups(challenge.id)
  if (groups.length === 0) {
    throw new Error('The group wasn\'t found for this challenge')
  }

  if (groups.length > 1) {
    throw new Error('Multiple groups were found for this challenge')
  }

  const { body: updatedGroup } = await vanillaClient.updateGroup(groups[0].groupID, { name: challenge.name })
  logger.info(`The group was updated: ${JSON.stringify(updatedGroup)}`)

  const { body: groupCategory } = await vanillaClient.getCategoryByUrlcode(`${challenge.id}`)
  if (!groupCategory) {
    throw new Error('Group category wasn\'t found for this challenge')
  }

  const { body: groupCategoryForEdit } = await vanillaClient.getCategoryForEdit(groupCategory.categoryID)
  if (!groupCategoryForEdit) {
    throw new Error('Group category wasn\'t found for this challenge')
  }
  groupCategoryForEdit.name = challenge.name

  const { body: updatedGroupCategory } = await vanillaClient.updateCategory(groupCategoryForEdit.categoryID, groupCategoryForEdit)
  logger.info(`The group category was updated: ${JSON.stringify(updatedGroupCategory)}`)
}

async function createDiscussions (group, challenge, templateDiscussions, vanillaCategory) {
  for (const discussion of templateDiscussions) {
    // create a discussion
    const bodyTemplate = _.template(discussion.body)
    await vanillaClient.createDiscussion({
      body: bodyTemplate({ challenge: challenge }),
      name: discussion.title,
      groupID: group.groupID,
      categoryID: vanillaCategory.categoryID,
      format: constants.VANILLA.DISCUSSION_FORMAT.WYSIWYG,
      closed: discussion.closed,
      pinned: discussion.announce
    })
    logger.info(`The '${discussion.title}' discussion/announcement was created`)
  }
}

module.exports = {
  manageVanillaUser,
  createVanillaGroup,
  updateVanillaGroup
}
