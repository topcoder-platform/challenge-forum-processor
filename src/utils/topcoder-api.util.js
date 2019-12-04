const config = require('config')
const _ = require('lodash')
const m2mAuth = require('tc-core-library-js').auth.m2m
const request = require('superagent')

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
async function getUserDetails (userId) {
  const path = `${config.TOPCODER.API_URL}/v3/users?filter=id%3D${userId}`
  return reqToAPI('GET', path)
}

module.exports = {
  getUserDetails
}
