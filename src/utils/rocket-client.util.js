const config = require('config')
const RocketChat = require('rocketchat-api')
const logger = require('../utils/logger.util')
console.log(config.ROCKETCHAT.PROTOCOL,
  config.ROCKETCHAT.HOST,
  config.ROCKETCHAT.PORT)
// Rocket chat client
const rocketChatClient = new RocketChat(
  config.ROCKETCHAT.PROTOCOL,
  config.ROCKETCHAT.HOST,
  config.ROCKETCHAT.PORT
)

/**
 * Initialize the RocketChat client
 */
async function initializeRocketClient () {
  console.log(config.ROCKETCHAT.USERNAME,config.ROCKETCHAT.PASSWORD)
  try {
    await rocketChatClient.login(
      config.ROCKETCHAT.USERNAME,
      config.ROCKETCHAT.PASSWORD
    )
  } catch (err) {
    logger.error('Rocket chat connect failed.')
    logger.error(err)
    return
  }

  logger.info('Rocket chat is ready')
}

module.exports = {
  initializeRocketClient,
  rocketChatClient
}
