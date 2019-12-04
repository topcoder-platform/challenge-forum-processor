const createChallenge = require('./create_challenge')
const userManagement = require('./user_management')

module.exports = {
  kafkaModules: [createChallenge, userManagement]
}
