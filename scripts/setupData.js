const util = require('util')
const constants = require('../src/constants')
const logger = require('./../src/utils/logger.util')
const vanillaClient = require('./../src/utils/vanilla-client.util')
const helper = require('./helper')
const template = require('./../config/template.json')
/**
 * Start the app
 */
async function bootstrap () {
  await createDefaultCategories()
}

/**
 * Create categories
 * @return {Promise<void>}
 */
async function createDefaultCategories () {
  try {
    logger.info('Creating categories...')
    for (const templateCategory of template.categories) {
      const { body: parent } = await vanillaClient.createCategory({
        name: templateCategory.name,
        urlcode: helper.generateUrlCode(templateCategory.name),
        displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
      })
      if (!parent.categoryID) {
        throw new Error('Category wasn\'t created: ' + JSON.stringify(parent))
      }
      logger.debug(`The category '${parent.name}' was created.`)
      if (templateCategory.categories) {
        for (const item of templateCategory.categories) {
          const { body: child } = await vanillaClient.createCategory({
            parentCategoryID: parent.categoryID,
            name: item.name,
            urlcode: helper.generateUrlCode(item.name),
            displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
          })
          logger.debug(`The category '${child.name}' was created.`)
        }
      }
    }
    logger.info('Categories were created.')
  } catch (err) {
    logger.error(util.inspect(err))
  }
}

bootstrap()
