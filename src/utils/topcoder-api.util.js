const config = require('config')
const _ = require('lodash')
const m2mAuth = require('tc-core-library-js').auth.m2m
const request = require('superagent')
const logger = require('./logger.util')

let m2m = null

/**
 * Function to get M2M token
 */
async function getM2MToken () {
  if (_.isNull(m2m)) {
    m2m = m2mAuth(
      _.pick(config.TOPCODER, [
        'AUTH0_URL',
        'AUTH0_AUDIENCE',
        'TOKEN_CACHE_TIME',
        'AUTH0_PROXY_SERVER_URL'
      ])
    )
  }
  logger.info(
    `Getting M2M token for client ID=${config.TOPCODER.AUTH0_CLIENT_ID}`
  )

  return m2m.getMachineToken(
    config.TOPCODER.AUTH0_CLIENT_ID,
    config.TOPCODER.AUTH0_CLIENT_SECRET
  )
}

/**
 * Function to send request to V5 API
 * @param {String} reqType Type of the request POST / PATCH / PUT / GET / DELETE / HEAD
 * @param {String} path Complete path of the API URL
 * @param {Object} reqBody Body of the request
 */
async function reqToAPI (reqType, path, reqBody) {
  const token = await getM2MToken()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  const validReqTypes = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE']
  const hasBody = ['POST', 'PUT', 'PATCH']

  if (_.indexOf(validReqTypes, _.upperCase(reqType)) === -1) {
    throw new Error('Invalid request type')
  }
  const reqMethod = request[_.lowerCase(reqType)]

  if (_.indexOf(hasBody, _.upperCase(reqType)) === -1) {
    return reqMethod(path)
      .set(authHeader)
      .set('Content-Type', 'application/json')
  } else {
    return reqMethod(path)
      .set(authHeader)
      .set('Content-Type', 'application/json')
      .send(reqBody)
  }
}

/**
 * Gets the user's handle given the user's ID
 * @param {String} userId User's ID (6-digit numeric)
 */
async function getUserDetailsById (userId) {
  const path = `${config.TOPCODER.API_URL}/v3/users?filter=id%3D${userId}`
  return reqToAPI('GET', path)
}

/**
 * Gets the user by Topcoder's handle
 * @param {String} handle
 */
async function getUserDetailsByHandle (handle) {
  const path = `${config.TOPCODER.API_URL}/v3/users?filter=handle%3D${handle}`
  return reqToAPI('GET', path)
}

/**
 * Gets the challenge
 * @param {String} challengeId Challenge's ID (uuid)
 */
async function getChallenge (challengeId) {
  const path = `${config.TOPCODER.API_URL}/v5/challenges/${challengeId}`
  return reqToAPI('GET', path)
}

/**
 * Update the challenge
 * @param {String} challengeId Challenge's ID (uuid)
 */
async function updateChallenge (challengeId, data) {
  const path = `${config.TOPCODER.API_URL}/v5/challenges/${challengeId}`
  return reqToAPI('PATCH', path, data)
}

/**
 * Gets the roles for an user
 * @param {int} userId User's ID
 */
async function getRoles (userId) {
  const path = `${config.TOPCODER.API_URL}/v3/roles?filter=subjectID%3D${userId}`
  return reqToAPI('GET', path)
}

/**
 * Gets the project
 * @param {int} projectId Project's Id (int)
 */
async function getProject (projectId) {
  const path = `${config.TOPCODER.API_URL}/v5/projects/${projectId}`
  return reqToAPI('GET', path)
}

module.exports = {
  getUserDetailsById,
  getUserDetailsByHandle,
  getChallenge,
  updateChallenge,
  getRoles,
  getProject
}
