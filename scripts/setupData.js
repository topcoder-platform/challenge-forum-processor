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
    for (const title of data.TOPCODER.DEFAULT_CATEGORIES) {
      const { body: category } = await vanillaClient.createCategory({
        name: title,
        urlcode: helper.generateUrlCode(title),
        displayAs: constants.VANILLA.CATEGORY_DISPLAY_STYLE.CATEGORIES
      })
      logger.debug(`The category '${category.name}' is created.`)
    }
    logger.info('Categories are created.')
  } catch (err) {
    logger.error(util.inspect(err))
  }
}

bootstrap()
