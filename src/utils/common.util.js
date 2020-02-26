/*
 * Some shared functions.
 */
const _ = require('lodash')
const moment = require('moment')

/**
 * Generate an announcement with summary from a challenge.
 *
 * @param {Object} challenge the challenge data
 * @returns {String} the announcement text
 */
function generateAnnouncement (challenge) {
  const prizes = _.find(challenge.prizeSets, { type: 'Challenge prizes' })
    .prizes
  let announcement = ''
  announcement += `Prizes: ${prizes.map(i => `$${i.value}`).join(', ')}\r\n`
  announcement += _.reduce(
    challenge.phases,
    (acc, phase) => {
      const formattedDeadline = moment(phase.deadline)
        .utcOffset('-0500')
        .format('YYYY-MM-DD HH:mm Z')
      return `${acc}${phase.description}: ${formattedDeadline}\r\n`
    },
    ''
  )
  return announcement
}

module.exports = {
  generateAnnouncement
}
