/*
 * Constants.
 */

const WELCOME_INFOMATION = 'Any questions related to this challenge. The copilot will help answer any questions you might have, usually within 24 hours of a question being asked.'

module.exports = {
  KAFKA: {
    TOPICS: {
      // For challenge creation
      CHALLENGE_CREATE_TOPIC: 'challenge.notification.create',
      // For challenge update
      CHALLENGE_UPDATE_TOPIC: 'challenge.notification.update',
      // For member registrations and de-registrations, co-pilots,PMs,etc.
      RESOURCE_CREATE_TOPIC: 'challenge.action.resource.create',
      RESOURCE_DELETE_TOPIC: 'challenge.action.resource.delete'
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
  TOPCODER: {
    PROJECT_ROLES: {
      COPILOT: 'copilot',
      MANAGER: 'manager',
      CUSTOMER: 'customer'
    },
    CHALLENGE_ROLES: {
      COPILOT: 'Copilot',
      MANAGER: 'Manager',
      SUBMITTER: 'Submitter',
      CLIENT_MANAGER: 'Client Manager'
    },
    CHALLENGE_STATUSES: {
      NEW: 'New',
      DRAFT: 'Draft',
      CANCELLED: 'Cancelled',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      DELETED: 'Deleted',
      CANCELLED_FAILED_REVIEW: 'Cancelled - Failed Review',
      CANCELLED_FAILED_SCREENING: 'Cancelled - Failed Screening',
      CANCELLED_ZERO_SUBMISSIONS: 'Cancelled - Zero Submissions',
      CANCELLED_WINNER_UNRESPONSIVE: 'Cancelled - Winner Unresponsive',
      CANCELLED_CLIENT_REQUEST: 'Cancelled - Client Request',
      CANCELLED_REQUIREMENTS_INFEASIBLE: 'Cancelled - Requirements Infeasible',
      CANCELLED_ZERO_REGISTRATIONS: 'Cancelled - Zero Registrations'
    }
  },
  VANILLA: {
    DEFAULT_MEMBER_ROLES: ['Vanilla Member'],
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
      RICH: 'Rich',
      MARKDOWN: 'Markdown',
      TEXT: 'Text',
      TEXTEX: 'Textex',
      WYSIWYG: 'Wysiwyg',
      BBCODE: 'Bbcode'
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
