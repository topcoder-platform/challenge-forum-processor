module.exports = {
  KAFKA: {
    TOPICS: {
      // For challenge creation
      CHALLENGE_CREATE_TOPIC: 'challenge.notification.create',
      // For member registrations and de-registrations
      CHALLENGE_NOTIFICATION_TOPIC: 'challenge.notification.events',
      // For co-pilots,PMs,etc.
      RESOURCE_CREATE_TOPIC: 'challenge.action.resource.create',
      RESOURCE_DELETE_TOPIC: 'challenge.action.resource.delete'
    },
    // Values of `type` in payload of challenge.notification.events
    CHALLENGE_NOTIFICATION_EVENT_TYPES: {
      USER_REGISTRATION: 'USER_REGISTRATION',
      USER_UNREGISTRATION: 'USER_UNREGISTRATION'
    }
  },
  TEMPLATES: {
    /* eslint-disable no-template-curly-in-string */
    GROUP_INTRODUCTION_STRING:
      'Welcome to Topcoder ${ challenge.track } challenge!\r\nPlease post your questions in this chat group, thanks!',
    GROUP_DESCRIPTION_STRING: '${ challenge.name }: ${ challenge.url }',
    GROUP_TOPIC_STRING:
      'Any questions related to this challenge. The copilot will help answer any questions you might have, usually within 24 hours of a question being asked.'
    /* eslint-enable no-template-curly-in-string */
  },
  // Enum, for use in the user_management module
  USER_ACTIONS: {
    INVITE: 'invite',
    KICK: 'kick'
  }
}
