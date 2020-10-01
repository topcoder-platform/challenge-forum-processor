/*
 * Constants.
 */

const WELCOME_INFOMATION = 'Any questions related to this challenge. The copilot will help answer any questions you might have, usually within 24 hours of a question being asked.'

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
    GROUP_TOPIC_STRING: WELCOME_INFOMATION,
    CODE_DOCUMENTS_URL_CODE_STRING: '${ challenge.id }-documents',
    CODE_QUESTIONS_URL_CODE_STRING: '${ challenge.id }-questions',
    TOPCODER_CHALLENGE_LINK: '<a href="${ challenge.url }">${ challenge.name }</a>'
    /* eslint-enable no-template-curly-in-string */
  },
  // Enum, for use in the user_management module
  USER_ACTIONS: {
    INVITE: 'invite',
    KICK: 'kick'
  },
  VANILLA: {
    CHALLENGES_FORUM: 'Challenges Forums',
    CATEGORY_DISPLAY_STYLE: {
      CATEGORIES: 'categories',
      DISCUSSIONS: 'discussions',
      FLAT: 'flat',
      HEADING: 'heading'
    },
    CHALLENGE_ROLE_PERMISSIONS: {
      'comments.add': true,
      'comments.edit': true,
      'discussions.add': true,
      'discussions.view': true
    },
    DISCUSSION_FORMAT: {
      RICH: 'rich',
      MARKDOWN: 'markdown',
      TEXT: 'text',
      TEXTEX: 'textex',
      WYSIWYG: 'wysiwyg',
      BBCODE: 'bbcode'
    },
    GROUP_PRIVACY: {
      SECRET: 'secret',
      PRIVATE: 'private',
      PUBLIC: 'public'
    },
    GROUP_POST_FORMAT: {
      RICH: 'rich',
      MARKDOWN: 'markdown',
      TEXT: 'text',
      TEXTEX: 'textex',
      WYSIWYG: 'wysiwyg',
      BBCODE: 'bbcode'
    },
    EVENT_POST_FORMAT: {
      RICH: 'rich',
      MARKDOWN: 'markdown',
      TEXT: 'text',
      TEXTEX: 'textex',
      WYSIWYG: 'wysiwyg',
      BBCODE: 'bbcode'
    },
    LINE_BREAKS: {
      HTML: '<br>'
    }
  },
  ERROR_MESSAGES: {
    CATEGORY_ALREADY_EXISTS: 'The specified url code is already in use by another category.'
  }
}
