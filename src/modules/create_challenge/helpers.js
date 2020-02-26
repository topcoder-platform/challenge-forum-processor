const config = require('config')
const moment = require('moment')
const _ = require('lodash')

/**
 * Processes a payload from the topic, to be consumed by the handler
 * @param {Object} payload
 */
function processPayload (payload) {
  // Set the url of the challenge
  payload.url = `${config.TOPCODER.ROOT_URL}/challenges/${payload.id}`
  // Derive deadlines from the duration of phases
  const deadline = {}
  _.each(payload.phases, (phase, idx) => {
    // Set the value of deadline to the value of the start date
    deadline[phase.id] = payload.startDate
    // If the phase has a predecessor, set the deadline to the value of the
    // deadline to the value of the deadline of the predecessor
    if (phase.predecessor) {
      deadline[phase.id] = deadline[phase.predecessor]
    }
    // Convert the phase deadline to a moment object
    deadline[phase.id] = moment(deadline[phase.id])
    // Add the duration of the phase to get the final deadline
    deadline[phase.id] = deadline[phase.id]
      .add(phase.duration, 'hours')
      .utc()
      .format()
    // Set the deadline of the phase
    payload.phases[idx].deadline = deadline[phase.id]
  })
  // Return the payload, with the added information
  return payload
}

module.exports = {
  processPayload
}
