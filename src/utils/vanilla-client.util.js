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
    updateCategory: (categoryId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/categories/${categoryId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    getCategories: (parentCategoryID) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      if (_.isNumber(parentCategoryID)) {
        queryParams.parentCategoryID = parentCategoryID
      }
      return request.get(`${config.VANILLA.API_URL}/categories`)
        .query(queryParams)
    },
    getCategoriesByParentUrlCode: (parentUrlCode) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      queryParams.parentCategoryCode = parentUrlCode
      queryParams.maxDepth = 1
      return request.get(`${config.VANILLA.API_URL}/categories`)
        .query(queryParams)
    },
    getCategoryByUrlcode: (urlcode) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      return request.get(`${config.VANILLA.API_URL}/categories/urlcode/${urlcode}`)
        .query(queryParams)
    },
    getCategoryForEdit: (categoryId) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      return request.get(`${config.VANILLA.API_URL}/categories/${categoryId}/edit`)
        .query(queryParams)
    },
    watchCategory: (categoryId, userId, data) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      return request.put(`${config.VANILLA.API_URL}/topcoder/${userId}/watch/${categoryId}`)
        .query(queryParams)
        .send(data)
    },
    searchCategories: (categoryName, page = 1, limit = 30, expand = 'all') => {
      return request.get(`${config.VANILLA.API_URL}/categories/search`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN, query: categoryName, page: page, limit: limit, expand: expand })
    },
    deleteCategory: (categoryId) => {
      return request.delete(`${config.VANILLA.API_URL}/categories/${categoryId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
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
    deleteRole: (roleId) => {
      return request.delete(`${config.VANILLA.API_URL}/roles/${roleId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
    },
    getUserByName: (username) => {
      return request.get(`${config.VANILLA.API_URL}/users/by-names`)
        .query({
          access_token: config.VANILLA.ADMIN_ACCESS_TOKEN,
          name: username
        })
    },
    addUser: (data) => {
      return request.post(`${config.VANILLA.API_URL}/users`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    getUser: (userId) => {
      return request.get(`${config.VANILLA.API_URL}/users/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
    },
    updateUser: (userId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/users/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    createGroup: (data) => {
      return request.post(`${config.VANILLA.API_URL}/groups`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    updateGroup: (groupId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/groups/${groupId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    searchGroups: (query) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      queryParams.challengeID = query
      queryParams.page = 1
      return request.get(`${config.VANILLA.API_URL}/groups`)
        .query(queryParams)
    },
    addUserToGroup: (groupId, data) => {
      return request.post(`${config.VANILLA.API_URL}/groups/${groupId}/members`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
    },
    removeUserFromGroup: (groupId, userId) => {
      return request.delete(`${config.VANILLA.API_URL}/groups/${groupId}/member/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
    }
  }
}

const vanillaClient = getVanillaClient()

module.exports = vanillaClient
