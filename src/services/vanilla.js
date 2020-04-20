/*
 * Vanilla services.
 */
const _ = require('lodash')
const logger = require('../utils/logger.util')
const constants = require('../constants')
const { generateAnnouncement } = require('../utils/common.util')
const vanillaClient = require('../utils/vanilla-client.util')

const challengeLinkTemplate = _.template(constants.TEMPLATES.TOPCODER_CHALLENGE_LINK)
const documentsUrlCodeTemplate = _.template(constants.TEMPLATES.CODE_DOCUMENTS_URL_CODE_STRING)
const questionsUrlCodeTemplate = _.template(constants.TEMPLATES.CODE_QUESTIONS_URL_CODE_STRING)

/**
 * Add/Remove a user to/from a category.
 *
 * @param {Object} data the data from message payload
 * @returns {undefined}
 */
async function manageVanillaUser (data) {
  const { challengeId, action, handle: username } = data
  const { body: roles } = await vanillaClient.getAllRoles()
  const topcoderMemberRole = _.find(roles, { name: constants.VANILLA.DEFAULT_USER_ROLE })
  const challengeRole = _.find(roles, { name: challengeId })
  if (!topcoderMemberRole) {
    throw new Error(`${constants.VANILLA.DEFAULT_USER_ROLE} Role is not found`)
  }
  if (!challengeRole) {
    throw new Error(`Role for challenge ${challengeId} not found`)
  }
  const { body: [user] } = await vanillaClient.getUserByName(username)
  if (!user) {
    throw new Error(`User with username ${username} not found`)
  }
  const { body: { roles: currentRoles } } = await vanillaClient.getUser(user.userID)

  const { body: categories } = await vanillaClient.getCategoriesByParentUrlCode(challengeId)
  const challenge = { id: challengeId }
  const questionsUrlCode = questionsUrlCodeTemplate({ challenge })
  const questionCategory = _.find(categories, { urlcode: questionsUrlCode })
  if (!questionCategory) {
    throw new Error(`Category with urlcode ${questionsUrlCode} not found`)
  }
  const documentsUrlCode = documentsUrlCodeTemplate({ challenge })
  const documentCategory = _.find(categories, { urlcode: documentsUrlCode })
  if (!documentCategory) {
    throw new Error(`Category with urlcode ${documentsUrlCode} not found`)
  }
  // Choose action to perform
  switch (action) {
    case constants.USER_ACTIONS.INVITE: {
      await vanillaClient.updateUser(user.userID, {
        roleId: [
          ..._.map(currentRoles, role => role.roleID),
          challengeRole.roleID,
          topcoderMemberRole.roleID
        ]
      })
      logger.info(`The user ${user.name} is added to the category associated with challenge ${challengeId}`)
      await vanillaClient.followCategory(questionCategory.categoryID, user.userID, { followed: true })
      logger.info(`The user ${user.name} follows the category ${questionCategory.categoryID} associated with challenge ${challengeId}`)
      await vanillaClient.followCategory(documentCategory.categoryID, user.userID, { followed: true })
      logger.info(`The user ${user.name} follows the category ${documentCategory.categoryID} associated with challenge ${challengeId}`)
      break
    }
    case constants.USER_ACTIONS.KICK: {
      await vanillaClient.followCategory(questionCategory.categoryID, user.userID, { followed: false })
      logger.info(`The user ${user.name} unfollows the category ${questionCategory.categoryID} associated with challenge ${challengeId}`)
      await vanillaClient.followCategory(documentCategory.categoryID, user.userID, { followed: false })
      logger.info(`The user ${user.name} unfollows the category ${documentCategory.categoryID} associated with challenge ${challengeId}`)
      await vanillaClient.updateUser(user.userID, {
        roleId: _.without(
          _.map(currentRoles, role => role.roleID),
          challengeRole.roleID
        )
      })
      logger.info(`The user ${user.name} is removed from the category associated with challenge ${challengeId}`)
      break
    }
    default:
      // Unrecognized action. Throw error
      throw new Error('Unrecognized action')
  }
}

/**
 * Create a vanilla forum category for a challenge.
 *
 * @param {Object} challenge the challenge data
 */
async function createVanillaCategory (challenge) {
  let parentCategoryName
  switch (challenge.track) {
    case constants.VANILLA.CHALLENGE_TYPE.DEVELOP:
      parentCategoryName = constants.VANILLA.DEVELOPMENT_FORUMS_TITLE
      break
    case constants.VANILLA.CHALLENGE_TYPE.DESIGN:
      parentCategoryName = constants.VANILLA.DESIGN_FORUMS_TITLE
      break
    case constants.VANILLA.CHALLENGE_TYPE.DATA_SCIENCE:
      parentCategoryName = constants.VANILLA.DATA_SCIENCE_FORUMS_TITLE
      break
    default:
      throw new Error(`The default parent category for the challenge track '${challenge.track}' is not found`)
  }

  const { body: parentCategory } = await vanillaClient.searchCategories(parentCategoryName)
  if (parentCategory.length === 0) {
    throw new Error(`The default parent category with name '${parentCategoryName}' is not found`)
  }

  if (parentCategory.length > 1) {
    throw new Error(`Multiple categories with the name '${parentCategoryName}' are found`)
  }

  const { body: challengeCategory } = await vanillaClient.createCategory({
    name: challenge.name,
    urlcode: challenge.id,
    parentCategoryID: parentCategory[0].categoryID,
    displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.HEADING
  })
  const { body: questionCategory } = await vanillaClient.createCategory({
    name: constants.VANILLA.QUESTION_CATEGORY_NAME,
    urlcode: questionsUrlCodeTemplate({ challenge }),
    parentCategoryID: challengeCategory.categoryID
  })
  const { body: documentCategory } = await vanillaClient.createCategory({
    name: constants.VANILLA.DOCUMENT_CATEGORY_NAME,
    urlcode: documentsUrlCodeTemplate({ challenge }),
    parentCategoryID: challengeCategory.categoryID
  })
  // create a read-only discussion to present the challenge summary.
  const challengeLink = challengeLinkTemplate({ challenge })
  const announcement = generateAnnouncement(challenge)
  await vanillaClient.createDiscussion({
    body: `${challengeLink}\r\n${announcement}`,
    name: constants.VANILLA.CHALLENGE_OVERVIEW_TITLE,
    categoryID: documentCategory.categoryID,
    format: constants.VANILLA.DISCUSSION_FORMAT.HTML,
    closed: true,
    pinned: true
  })
  // create a read-only discussion to show welcome information.
  await vanillaClient.createDiscussion({
    body: constants.VANILLA.CHALLENGE_WELCOME_CONTENT,
    name: constants.VANILLA.CHALLENGE_WELCOME_TITLE,
    categoryID: questionCategory.categoryID,
    format: constants.VANILLA.DISCUSSION_FORMAT.NONE,
    closed: true,
    pinned: true
  })
  logger.info(`New category for challenge ${challenge.id} is created`)
  // create a dedicated role for the category
  const roleName = challenge.id
  const roleDescription = challenge.name
  const { body: roles } = await vanillaClient.getAllRoles()
  if (_.map(roles, role => role.name).includes(roleName)) {
    throw new Error(`The role with name ${roleName} already exists`)
  }
  const { body: role } = await vanillaClient.createRole({ name: roleName, description: roleDescription })
  await vanillaClient.updateRolePermission(role.roleID, [{
    id: challengeCategory.categoryID,
    permissions: constants.VANILLA.CHALLENGE_ROLE_PERMISSIONS,
    type: constants.VANILLA.PERMISSION_TYPE.CATEGORY
  }])
  logger.info(`New role for challenge ${challenge.id} is created`)
}

module.exports = {
  manageVanillaUser,
  createVanillaCategory
}
