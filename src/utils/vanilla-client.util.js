/*
 * Get vanilla client.
 */
const request = require('superagent')
const config = require('config')
const _ = require('lodash')
const constants = require('../constants')

/**
 * Get vanilla client.
 *
 * @returns {Object} a set of wrapper functions upon the vanilla APIs.
 */
function getVanillaClient () {
  return {
    createCategory: (data) => {
      return request.post(`${config.VANILLA.API_URL}/categories`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .catch(err => {
          if (_.get(err, 'response.body.errors[0].message') === constants.ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS) {
            throw new Error('The requested category already exists')
          }
          throw err
        })
    },
    createRole: (data) => {
      return request.post(`${config.VANILLA.API_URL}/roles`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    updateRolePermission: (roleId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/roles/${roleId}/permissions`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    createDiscussion: (data) => {
      return request.post(`${config.VANILLA.API_URL}/discussions`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    getAllRoles: () => {
      return request.get(`${config.VANILLA.API_URL}/roles`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
    },
    getUserByName: (username) => {
      return request.get(`${config.VANILLA.API_URL}/users/by-names`)
        .query({
          access_token: config.VANILLA.ADMIN_ACCESS_TOKEN,
          name: username
        })
    },
    getUser: (userId) => {
      return request.get(`${config.VANILLA.API_URL}/users/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
    },
    updateUser: (userId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/users/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    }
  }
}

const vanillaClient = getVanillaClient()

module.exports = vanillaClient
