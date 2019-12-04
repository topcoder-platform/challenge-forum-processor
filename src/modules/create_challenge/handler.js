const _ = require('lodash')
const constants = require('../../constants')
const moment = require('moment')
const {
  processPayload,
  findUnusedRoomName,
  createRoom,
  postIntroductoryMessage,
  setGroupDescription,
  setGroupChallengeId,
  setGroupAnnouncement,
  setGroupTopic
} = require('./helpers')

// Templates used to generate messages to post in the group
const introductoryMessageTemplate = _.template(
  constants.TEMPLATES.GROUP_INTRODUCTION_STRING
)
const descriptionTemplate = _.template(constants.TEMPLATES.GROUP_DESCRIPTION_STRING)
const topicTemplate = _.template(constants.TEMPLATES.GROUP_TOPIC_STRING)

/**
 * Handle a set of messages from the Kafka topic
 * @param {Array} messageSet
 */
async function handler (messageSet) {
  messageSet.forEach(async item => {
    const challenge = processPayload(item)
    let roomName = challenge.track + '_' + challenge.name.replace(/ /g, '_')

    // Find an unused group name
    roomName = await findUnusedRoomName(roomName)

    // Create group
    const { group } = await createRoom(roomName)

    // Post Introductory Message
    const message = introductoryMessageTemplate({ challenge })
    await postIntroductoryMessage(group.name, message)

    // Set description
    const description = descriptionTemplate({ challenge })
    await setGroupDescription(group._id, description)

    // Set Announcement
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
    await setGroupAnnouncement(group._id, announcement)

    // Set the challengeId as a custom field
    await setGroupChallengeId(group._id, challenge.id)

    // Set Topic
    const topic = topicTemplate({ challenge })
    await setGroupTopic(group._id, topic)
  })
}

module.exports = handler
