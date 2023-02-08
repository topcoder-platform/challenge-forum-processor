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
        .disableTLSCerts()
        .catch(err => {
          if (_.get(err, 'response.body.errors[0].message') === constants.ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS) {
            console.log("Category:",response.body)
            throw new Error('The requested category already exists')
          }
          throw err
        })
    },
    updateCategory: (categoryId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/categories/${categoryId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    getCategories: (parentCategoryID) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      if (_.isNumber(parentCategoryID)) {
        queryParams.parentCategoryID = parentCategoryID
      }
      return request.get(`${config.VANILLA.API_URL}/categories`)
        .query(queryParams)
        .disableTLSCerts()
    },
    getCategoriesByParentUrlCode: (parentUrlCode) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      queryParams.parentCategoryCode = parentUrlCode
      queryParams.maxDepth = 1
      return request.get(`${config.VANILLA.API_URL}/categories`)
        .query(queryParams)
        .disableTLSCerts()
    },
    getCategoryByUrlcode: (urlcode) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      return request.get(`${config.VANILLA.API_URL}/categories/urlcode/${urlcode}`)
        .query(queryParams)
        .disableTLSCerts()
    },
    getCategoryForEdit: (categoryId) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      return request.get(`${config.VANILLA.API_URL}/categories/${categoryId}/edit`)
        .query(queryParams)
        .disableTLSCerts()
    },
    watchCategory: (categoryId, userId, data) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      return request.put(`${config.VANILLA.API_URL}/topcoder/${userId}/watch/${categoryId}`)
        .query(queryParams)
        .send(data)
        .disableTLSCerts()
    },
    searchCategories: (categoryName, page = 1, limit = 30, expand = 'all') => {
      return request.get(`${config.VANILLA.API_URL}/categories/search`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN, query: categoryName, page: page, limit: limit, expand: expand })
        .disableTLSCerts()
    },
    deleteCategory: (categoryId) => {
      return request.delete(`${config.VANILLA.API_URL}/categories/${categoryId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    },
    createRole: (data) => {
      return request.post(`${config.VANILLA.API_URL}/roles`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    updateRolePermission: (roleId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/roles/${roleId}/permissions`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    createDiscussion: (data) => {
      return request.post(`${config.VANILLA.API_URL}/discussions`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    getAllRoles: () => {
      return request.get(`${config.VANILLA.API_URL}/roles`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    },
    deleteRole: (roleId) => {
      return request.delete(`${config.VANILLA.API_URL}/roles/${roleId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    },
    getUserByName: (username) => {
      return request.get(`${config.VANILLA.API_URL}/users/by-names`)
        .query({
          access_token: config.VANILLA.ADMIN_ACCESS_TOKEN,
          name: username
        })
        .disableTLSCerts()
    },
    addUser: (data) => {
      return request.post(`${config.VANILLA.API_URL}/users`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    getUser: (userId) => {
      return request.get(`${config.VANILLA.API_URL}/users/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    },
    updateUser: (userId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/users/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    createGroup: (data) => {
      return request.post(`${config.VANILLA.API_URL}/groups`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    updateGroup: (groupId, data) => {
      return request.patch(`${config.VANILLA.API_URL}/groups/${groupId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    archiveGroup: (groupId) => {
      return request.put(`${config.VANILLA.API_URL}/groups/${groupId}/archive`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    },
    unarchiveGroup: (groupId) => {
      return request.put(`${config.VANILLA.API_URL}/groups/${groupId}/unarchive`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    },
    searchGroups: (query) => {
      const queryParams = { access_token: config.VANILLA.ADMIN_ACCESS_TOKEN }
      queryParams.challengeID = query
      queryParams.page = 1
      return request.get(`${config.VANILLA.API_URL}/groups`)
        .query(queryParams)
        .disableTLSCerts()
    },
    addUserToGroup: (groupId, data) => {
      return request.post(`${config.VANILLA.API_URL}/groups/${groupId}/members`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .send(data)
        .disableTLSCerts()
    },
    removeUserFromGroup: (groupId, userId) => {
      return request.delete(`${config.VANILLA.API_URL}/groups/${groupId}/member/${userId}`)
        .query({ access_token: config.VANILLA.ADMIN_ACCESS_TOKEN })
        .disableTLSCerts()
    }
  }
}

const vanillaClient = getVanillaClient()

module.exports = vanillaClient
