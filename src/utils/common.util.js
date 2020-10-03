/*
 * Some shared functions.
 */
const _ = require('lodash')
const moment = require('moment')
const constants = require('../constants')

/**
 * Generate an announcement with summary from a challenge.
 *
 * @param {Object} challenge the challenge data
 * @returns {String} the announcement text
 */
function generateAnnouncement (challenge) {
  let announcement = ''
  if (challenge.prizeSets) {
    const prizes = _.find(challenge.prizeSets, { type: 'Challenge prizes' })
      .prizes

    announcement += `Prizes: ${prizes.map(i => `$${i.value}`).join(', ')}${constants.VANILLA.LINE_BREAKS.HTML}`
    announcement += _.reduce(
      challenge.phases,
      (acc, phase) => {
        const formattedDeadline = moment(phase.dateEnds)
          .utcOffset('-0500')
          .format('YYYY-MM-DD HH:mm Z')
        return `${acc}${phase.description}: ${formattedDeadline}${constants.VANILLA.LINE_BREAKS.HTML}`
      },
      ''
    )
  }
  return announcement
}

function randomValue (length) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

module.exports = {
  generateAnnouncement,
  randomValue
}
