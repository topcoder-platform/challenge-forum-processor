module.exports = {
  TOPCODER: {
    DEFAULT_CATEGORIES: [
      { title: 'Round Tables' },
      { title: 'New Member Discussions' },
      { title: 'New Discussions' },
      { title: 'Algorithm Matches' },
      { title: 'Marathon Matches' },
      { title: 'NASA Tournament Lab' },
      { title: 'TopCoder Cookbook' },
      { title: 'High School Matches' },
      { title: 'Sponsor Discussions' },
      {
        title: 'Challenges Forum',
        children: [
          { title: 'Development Forums' },
          { title: 'Design Forums' },
          { title: 'Data Science Forums' }
        ]
      }
    ]
  },
  VANILLA: {
    ROLE_NAMES: [
      'Guest',
      'Applicant',
      'Member',
      'Moderator',
      'Administrator',
      'Unconfirmed',
      'Topcoder Member'
    ]
  }
}
