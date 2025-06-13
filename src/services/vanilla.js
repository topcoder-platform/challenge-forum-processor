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
 * Add/Remove a user to/from a group.
 * @param {Object} data the data from message payload
 * @returns {undefined}
 */
async function manageVanillaUser (data) {
  const { challengeId, action, handle: username, projectRole, challengeRoles } = data
  if(!username){
    return
  }
  const isRegular = await isRegularChallenge({id: challengeId});
  if(!isRegular){
    logger.info(`Ignore managing users for RMD/MM challenge with challengeID=${challengeId}.`)
    return
  }

  logger.info(`Managing user for challengeID=${challengeId} [action=${action}, handle=${username}, projectRole=${JSON.stringify(projectRole)}, challengeRoles=${JSON.stringify(challengeRoles)}]...`)
  const { body: groups } = await vanillaClient.searchGroups(challengeId)
  const group = groups.length > 0 ? groups[0] : null

  const watch = shouldWatchCategories(projectRole, challengeRoles)

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

    const defaultVanillaRoles = _.filter(allNewVanillaRoles, function (role) {
      return role.type === 'member' && constants.VANILLA.DEFAULT_MEMBER_ROLES.includes(role.name)
    })

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
    logger.info(`New user [UserID=${vanillaUser.userID}, Name=${vanillaUser.name}] was added.`)
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
    // logger.info(`Roles were synchronized for User [UserID=${vanillaUser.userID}, Name=${vanillaUser.name}].`)
  }

  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE: {
      await vanillaClient.addUserToGroup(group.groupID, {
        userID: vanillaUser.userID,
        watch: watch
      })
      logger.info(`User [UserID=${vanillaUser.userID}, Name=${vanillaUser.name} was added to Group [GroupID=${group.groupID}, Name=${group.name}, Watch=${watch}]`)
      break
    }
    case constants.USER_ACTIONS.KICK: {
      await vanillaClient.removeUserFromGroup(group.groupID, vanillaUser.userID)
      logger.info(`User [UserID=${vanillaUser.userID}, Name =${vanillaUser.name} was removed from Group [GroupID=${group.groupID}, Name=${group.name}]`)
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
async function createVanillaEntities (challenge) {
  logger.info(`Create: challengeID=${challenge.id}, status=${challenge.status}, selfService=${challenge.legacy?challenge.legacy.selfService: null}:`)
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

  const isSelfService = challenge.legacy && challenge.legacy.selfService && challenge.legacy.selfService === true ? true: false
  if(isSelfService && challenge.status !== constants.TOPCODER.CHALLENGE_STATUSES.ACTIVE) {
    logger.info(`The forums are created only for the active self-service challenges.`)
    return
  }

  const { body: project } = await topcoderApi.getProject(challenge.projectId)
  const allProjectRoles = _.values(constants.TOPCODER.PROJECT_ROLES)
  const members = _.filter(project.members, member => {
    return _.includes(allProjectRoles, member.role)
  })

  const isMM = (challengeDetails.tags &&  _.includes(challengeDetails.tags,constants.TOPCODER.CHALLENGE_TAGS.MM))
   || (challengeDetails.type.toLowerCase() === constants.TOPCODER.CHALLENGE_TYPES.MM.toLowerCase())
  const isRDM = (challengeDetails.tags &&  _.includes(challengeDetails.tags,constants.TOPCODER.CHALLENGE_TAGS.RDM)
   || challengeDetails.type.toLowerCase() === constants.TOPCODER.CHALLENGE_TYPES.RDM.toLowerCase())

  let vanillaForumsName;
  if (isMM) {
    vanillaForumsName = constants.VANILLA.MMS_FORUM;
  } else if (isRDM) {
    vanillaForumsName = constants.VANILLA.RDMS_FORUM;
  } else {
    vanillaForumsName = constants.VANILLA.CHALLENGES_FORUM;
  }

  const isRegular = !(isMM || isRDM)
  const archived = isRegular;

  logger.info(`Vanilla template for the '${challengeDetails.name}' is '${vanillaForumsName}'`)

  let forums = _.filter(template.categories, ['name', vanillaForumsName])

  if (!forums) {
    throw new Error(`The '${vanillaForumsName}' category wasn't found in the template json file`)
  }

  const forumTemplate = _.find(forums[0].categories, { categories: [{ track: `${challenge.track}` }] })
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

      logger.info(`Creating Vanilla entities for the '${challengeDetailsDiscussion.name}' discussion using ${vanillaForumsName}`)

      let group;

      // Create a group for regular challenges
      if (isRegular) {
        const groupNameTemplate = _.template(groupTemplate.group.name)
        const groupDescriptionTemplate = challenge.legacy && challenge.legacy.selfService ? _.template(groupTemplate.group.selfServiceDescription)
            : _.template(groupTemplate.group.description)
        const shorterGroupName = groupNameTemplate({challenge: challengeDetailsDiscussion}).substring(0, config.FORUM_TITLE_LENGTH_LIMIT)

        const {body: groupData} = await vanillaClient.createGroup({
          name: groupNameTemplate({challenge: challengeDetailsDiscussion}).length >= config.FORUM_TITLE_LENGTH_LIMIT ? `${shorterGroupName}...` : groupNameTemplate({challenge: challengeDetailsDiscussion}),
          privacy: groupTemplate.group.privacy,
          type: groupTemplate.group.type,
          description: groupDescriptionTemplate({challenge}),
          challengeID: `${challenge.id}`,
          challengeUrl: `${challenge.url}`,
          archived: archived
        })

        group = groupData;
        if (!group.groupID) {
          throw Error('Couldn\'t create a group', JSON.stringify(group))
        }

        logger.info(`The group with groupID=${group.groupID} was created. ${JSON.stringify(group)}`)
      }

      const parentCategoryName = forumTemplate.urlcode
      
      logger.info(`Looking for parent category for ${forumTemplate.urlcode}`)
      const {body: parentCategory} = await vanillaClient.getCategoryByUrlcode(parentCategoryName)
      logger.info(`Found parent category: ${JSON.stringify(body)}`)
      
      if (!parentCategory.categoryID) {
        throw new Error(`The '${parentCategoryName}' category wasn't found in Vanilla`)
      }

      logger.info(`Creating category: ${JSON.stringify({
        name: challenge.name,
        urlcode: `${challenge.id}`,
        parentCategoryID: parentCategory.categoryID,
        displayAs: groupTemplate.categories ? constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES : constants.VANILLA.CATEGORY_DISPLAY_STYLE.DISCUSSIONS,
        groupID: group? group.groupID: null,
        archived: archived
      })}`)
      
      // Create the root challenge category
      const { body: challengeCategory } = await vanillaClient.createCategory({
        name: challenge.name,
        urlcode: `${challenge.id}`,
        parentCategoryID: parentCategory.categoryID,
        displayAs: groupTemplate.categories ? constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES : constants.VANILLA.CATEGORY_DISPLAY_STYLE.DISCUSSIONS,
        groupID: group? group.groupID: null,
        archived: archived
      })

      logger.info(`The '${challengeCategory.name}' category was created.`)

      if (groupTemplate.categories) {
        const categories = _.filter(groupTemplate.categories, ['selfService', isSelfService])
        for (const item of categories) {
          const urlCodeTemplate = _.template(item.urlcode)
          const { body: childCategory } = await vanillaClient.createCategory({
            name: item.name,
            urlcode: `${urlCodeTemplate({ challenge })}`,
            parentCategoryID: challengeCategory.categoryID,
            groupID: group? group.groupID: null,
            archived: archived
          })
          logger.info(`The '${item.name}' category was created`)
          await createDiscussions(group, challenge, item.discussions, childCategory)
        }
      }

      if (groupTemplate.discussions) {
        const groupDiscussions = _.filter(groupTemplate.discussions, ['selfService', isSelfService])
        await createDiscussions(group, challenge, groupDiscussions, challengeCategory)
      }

      // Create a group for regular challenges
      if (isRegular) {
        for (const member of members) {
          await manageVanillaUser({
            challengeId: challenge.id,
            action: constants.USER_ACTIONS.INVITE,
            handle: member.handle,
            projectRole: member.role
          })
        }
      }

      challengeDetailsDiscussion.url = `${challengeCategory.url}`
      logger.info(`The challenge's discussion url is ${challengeDetailsDiscussion.url}`)
      await topcoderApi.updateChallenge(challenge.id, { discussions: challengeDetails.discussions })
      logger.info('The challenge was updated')
    }
  }
}

async function isRegularChallenge(challenge) {
  const { text: challengeDetailsData} = await topcoderApi.getChallenge(challenge.id)
  const challengeDetails = JSON.parse(challengeDetailsData)
  const isMarathons = (challengeDetails.tags &&
      (_.includes(challengeDetails.tags,constants.TOPCODER.CHALLENGE_TAGS.MM) ||
          _.includes(challengeDetails.tags,constants.TOPCODER.CHALLENGE_TAGS.RDM)))
    || challengeDetails.type.toLowerCase() === constants.TOPCODER.CHALLENGE_TYPES.MM.toLowerCase()
    || challengeDetails.type.toLowerCase() === constants.TOPCODER.CHALLENGE_TYPES.RDM.toLowerCase()
  return !isMarathons;
}
/**
 * Update a vanilla forum group.
 *
 * @param {Object} challenge the challenge data
 */
async function updateVanillaEntities (challenge) {
  logger.info(`Update: challengeID=${challenge.id}, status=${challenge.status}, selService=${challenge.legacy.selfService}:`)

  const isRegular = await isRegularChallenge(challenge);
  if(!isRegular) {
    logger.info(`No updating for RMD/MM challenge with challengeID=${challenge.id}.`)
    return
  }

  const { body: groups } = await vanillaClient.searchGroups(challenge.id)
  if (groups.length === 0) {
    // Create the forums for all challenges with the Active status
    if(challenge.status === constants.TOPCODER.CHALLENGE_STATUSES.ACTIVE) {
      await createVanillaEntities(challenge)
      return
    } else {
      throw new Error('The group wasn\'t found for this challenge')
    }
  }

  if (groups.length > 1) {
    throw new Error('Multiple groups were found for this challenge')
  }

  if (challenge.status === constants.TOPCODER.CHALLENGE_STATUSES.ACTIVE) {
    await vanillaClient.unarchiveGroup(groups[0].groupID)
    logger.info(`The group with groupID=${groups[0].groupID} was unarchived.`)
  } else if (_.includes([constants.TOPCODER.CHALLENGE_STATUSES.COMPLETED,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_FAILED_REVIEW,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_FAILED_SCREENING,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_ZERO_SUBMISSIONS,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_WINNER_UNRESPONSIVE,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_CLIENT_REQUEST,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_REQUIREMENTS_INFEASIBLE,
    constants.TOPCODER.CHALLENGE_STATUSES.CANCELLED_ZERO_REGISTRATIONS,
    constants.TOPCODER.CHALLENGE_STATUSES.DELETED], challenge.status)) {
    await vanillaClient.archiveGroup(groups[0].groupID)
    logger.info(`The group with groupID=${groups[0].groupID} was archived.`)
  }

  const shorterName = challenge.name.substring(0,config.FORUM_TITLE_LENGTH_LIMIT)
  const { body: updatedGroup } = await vanillaClient.updateGroup(groups[0].groupID, { name: shorterName })
  logger.info(`The group with groupID=${groups[0].groupID} was updated: ${JSON.stringify(updatedGroup)}`)

  const { body: groupCategory } = await vanillaClient.getCategoryByUrlcode(`${challenge.id}`)
  if (!groupCategory) {
    throw new Error('Group category wasn\'t found for this challenge')
  }

  const { body: groupCategoryForEdit } = await vanillaClient.getCategoryForEdit(groupCategory.categoryID)
  if (!groupCategoryForEdit) {
    throw new Error('Group category wasn\'t found for this challenge')
  }
  // Update group's name
  groupCategoryForEdit.name = challenge.name
  // Delete a category's parent so as not to rebuild the category tree again
  delete groupCategoryForEdit.parentCategoryID

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
      groupID: group? group.groupID: null,
      categoryID: vanillaCategory.categoryID,
      format: constants.VANILLA.DISCUSSION_FORMAT.MARKDOWN,
      closed: discussion.closed,
      pinned: discussion.announce
    })
    logger.info(`The '${discussion.title}' discussion/announcement was created`)
  }
}

/**
 * Auto-watch categories
 * @param projectRole string
 * @param challengeRoles array
 * @returns {boolean}
 */
function shouldWatchCategories (projectRole, challengeRoles) {
  // New user
  if (!projectRole && _.isEmpty(challengeRoles)) {
    return true
  }

  // Project Copilots / Challenge Copilots and Submitters
  return (projectRole === constants.TOPCODER.PROJECT_ROLES.COPILOT ||
    (_.isArray(challengeRoles) && (_.includes(challengeRoles, constants.TOPCODER.CHALLENGE_ROLES.COPILOT) ||
      _.includes(challengeRoles, constants.TOPCODER.CHALLENGE_ROLES.SUBMITTER) ||
        _.includes(challengeRoles, constants.TOPCODER.CHALLENGE_ROLES.CLIENT_MANAGER)))
  )
}

module.exports = {
  manageVanillaUser,
  createVanillaEntities,
  updateVanillaEntities
}
