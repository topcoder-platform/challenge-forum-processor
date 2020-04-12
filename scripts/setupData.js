const util = require('util')
const constants = require('../src/constants')
const logger = require('./../src/utils/logger.util')
const vanillaClient = require('./../src/utils/vanilla-client.util')
const helper = require('./helper')
const data = require('./data')

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
    for (const tcCategory of data.TOPCODER.DEFAULT_CATEGORIES) {
      const { body: vCategory } = await vanillaClient.createCategory({
        name: tcCategory.title,
        urlcode: helper.generateUrlCode(tcCategory.title),
        displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
      })
      logger.debug(`The category '${vCategory.name}' is created.`)
      if (tcCategory.children) {
        for (const tcSubCategory of tcCategory.children) {
          const { body: vSubCategory } = await vanillaClient.createCategory({
            parentCategoryID: vCategory.categoryID,
            name: tcSubCategory.title,
            urlcode: helper.generateUrlCode(tcSubCategory.title),
            displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
          })
          logger.debug(`The category '${vSubCategory.name}' is created.`)
        }
      }
    }
    logger.info('Categories are created.')
  } catch (err) {
    logger.error(util.inspect(err))
  }
}

bootstrap()
