const config = require('config')

/**
 * Processes a payload from the topic, to be consumed by the handler
 * @param {Object} payload
 */
function processPayload (payload, topic) {
  // Set the url of the challenge
  payload.url = `${config.TOPCODER.ROOT_URL}/challenges/${payload.id}`
  return payload
}

module.exports = {
  processPayload
}
