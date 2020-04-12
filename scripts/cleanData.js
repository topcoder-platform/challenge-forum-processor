const util = require('util')
const logger = require('./../src/utils/logger.util')
const vanillaClient = require('./../src/utils/vanilla-client.util')
const data = require('./data')
/**
 * Start the app
 */
async function bootstrap () {
  await deleteCategories()
  await deleteRoles()
}

/**
 * Delete categories
 * @return {Promise<void>}
 */
async function deleteCategories () {
  try {
    logger.info('Deleting categories ...')
    const { body: categories } = await vanillaClient.getCategories()
    for (const category of categories) {
      logger.debug(`Deleting the category '${category.name}' ...`)
      await deleteCategoryWithNestedCategories(category.categoryID)
    }
    logger.info('Categories are deleted.')
  } catch (err) {
    logger.error(util.inspect(err))
  }
}

/**
 * Delete roles
 * @return {Promise<void>}
 */
async function deleteRoles () {
  try {
    logger.info('Deleting roles ...')
    const { body: roles } = await vanillaClient.getAllRoles()
    for (const role of roles) {
      if (data.VANILLA.ROLE_NAMES.includes(role.name) === false) {
        logger.debug(`Deleting the role '${role.name}' ...`)
        await vanillaClient.deleteRole(role.roleID)
      }
    }
    logger.info('Roles are deleted.')
  } catch (err) {
    logger.error(util.inspect(err))
  }
}

/**
 * Delete a category with the nested categories
 * @param categoryId
 * @return {Promise<void>}
 */
async function deleteCategoryWithNestedCategories (categoryId) {
  const { body: nestedCategories } = await vanillaClient.getCategories(categoryId)
  for (const nestedCategory of nestedCategories) {
    logger.debug(`Deleting the category ${nestedCategory.name} ...`)
    if (nestedCategory.children) {
      await deleteCategoryWithNestedCategories(nestedCategory.categoryID)
    }
  }
  await vanillaClient.deleteCategory(categoryId)
}

bootstrap()
