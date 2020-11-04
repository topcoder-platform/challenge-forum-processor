const createChallenge = require('./create_challenge')
const updateChallenge = require('./update_challenge')
const userManagement = require('./user_management')

module.exports = {
  kafkaModules: [createChallenge, updateChallenge, userManagement]
}
