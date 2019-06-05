const debug = require('../utils/debug')
const toUpper = require('lodash/toUpper')
const MovieDatabase = require('./MovieDatabase')

/**
 * A data source for the TMDB API (V4)
 */
class MovieDatabaseV4 extends MovieDatabase {
  constructor() {
    super()
    this.baseURL = `https://api.themoviedb.org/4`
  }

  /**
   * Retrieves a custom user-created List by ID.
   * Private lists can only be accessed by their owners and therefore require a
   * valid user access token.
   * @see https://developers.themoviedb.org/4/list/get-list
   */
  async getList({ id, ...params }) {
    params = this.transformSortByInput(params)
    const init = { cacheOptions: { ttl: 0 } }
    const response = await this.get(`/list/${id}`, params, init)
    // Format the sortBy field to match schema style:
    // REST API: `sortBy: release_date.desc"`
    // GraphQL schema: `{ sortBy: "RELEASE_DATE, sortOrder: "DESC" }`
    const [sortBy, sortOrder] = (params.sortBy || response.sortBy)
      .split('.')
      .map(toUpper)
    return { ...response, sortBy, sortOrder }
  }

  /**
   * Create a new custom list.
   * Requires a valid user access token.
   * @see https://developers.themoviedb.org/4/list/create-list
   */
  async createList({ input }) {
    try {
      const response = await this.post('/list', input)
      if (response.success) {
        return { ...response, message: 'List was created successfully.' }
      }
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Update list metadata and settings.
   * Can only be performed by list owner. Requires user access token.
   *
   * TODO: The REST API occasionally returns a 500 error when updating the
   * sort_by setting of a list to a supported value. This occurs even when
   * making REST requests directly in Postman, so its not an issue w
   * the graphQL API. If problem continues, report issue to TMDB
   * @see https://developers.themoviedb.org/4/list/update-list
   */
  async updateList({ id, input }) {
    try {
      const body = this.transformSortByInput(input)
      const response = await this.put(`/list/${id}`, body)
      if (response.success) {
        return { ...response, message: 'List was updated successfully.' }
      }
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Delete a list by ID.
   * Can only be performed by list owner. Requires user access token.
   */
  async deleteList({ id }) {
    try {
      const response = await this.delete(`/list/${id}`)
      if (response.success) {
        return { ...response, message: 'List was deleted successfully.' }
      }
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Clears all of the items from a list in a single request.
   * Requires user access token. Can only be performed by list owner.
   * @see https://developers.themoviedb.org/4/list/clear-list
   */
  async clearListItems({ id }) {
    try {
      const init = { cacheOptions: { ttl: 0 } }
      const response = await this.get(`/list/${id}/clear`, null, init)
      if (response.success) {
        return { ...response, message: 'List items were cleared successfully.' }
      }
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Adds items to a list. Items can include both movie or TV shows.
   * Supports adding an unlimited number of items in a single request
   *
   * The results of this query will return a results array. Each result
   * includes a success field. If a result is false this will usually indicate
   * that the item already exists on the list. It may also indicate that the
   * item could not be found.
   *
   * Can only be performed by list owner. Requires user access token.
   * @see https://developers.themoviedb.org/4/list/add-items
   * @param {string} id
   * @param {Array<{mediaType, mediaId}>} items
   */
  async addListItems({ id, items }) {
    try {
      const body = { items: items.map(this.transformListItemInput) }
      const response = await this.post(`/list/${id}/items`, body)
      if (response.success) {
        return { ...response, message: 'List items added.' }
      }
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Remove items from a list.
   * Can only be performed by list owner. Requires user access token.
   * @see https://developers.themoviedb.org/4/list/remove-items
   */
  async removeListItems({ id, items }) {
    try {
      const body = { items: items.map(this.transformListItemInput) }
      const response = await this.delete(`/list/${id}/items`, null, { body })
      if (response.success) {
        return { ...response, message: 'List items removed.' }
      }
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Quickly check if the item is already added to the list.
   * Can only be performed by list owner. Requires user access token.
   */
  async checkListItemStatus({ listId, mediaType, id }) {
    try {
      const params = { mediaType, mediaId: id }
      const response = await this.get(`/list/${listId}/item_status`, params)
      if (response.success) return response
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Get all lists created by the given user.
   * This requires a valid user access token.
   */
  async myLists({ accountId }) {
    try {
      const init = { cacheOptions: { ttl: 0 } }
      return this.get(`/account/${accountId}/lists`, null, init)
    } catch (error) {
      debug.error(error)
      return { success: false, message: error.message }
    }
  }

  /**
   * Get the user watchlist. This requires a valid user access token.
   */
  async myWatchlist({ accountId, mediaType, ...params }) {
    params = this.transformSortByInput(params)
    const path = `/account/${accountId}/${mediaType}/watchlist`
    const init = { cacheOptions: { ttl: 0 } }
    return this.get(path, params, init)
  }

  /**
   * Get the user's "favorites" list. This requires a valid user access token.
   */
  async myFavorites({ accountId, mediaType, ...params }) {
    params = this.transformSortByInput(params)
    const path = `/account/${accountId}/${mediaType}/favorites`
    const init = { cacheOptions: { ttl: 0 } }
    return this.get(path, params, init)
  }

  /**
   * Gets the list of Movies or Shows that have been rated by the logged in
   * user. Requires a valid user access token
   */
  async myRatings({ mediaType, accountId, ...params }) {
    params = this.transformSortByInput(params)
    const path = `/account/${accountId}/${mediaType}/rated`
    const init = { cacheOptions: { ttl: 0 } }
    return this.get(path, params, init)
  }

  /**
   * Get movie and tv recommendations based on the user's ratings and
   * favorites. Requires a valid user access token & accountId
   */
  async myRecommendations({ mediaType, accountId, ...params }) {
    params = this.transformSortByInput(params)
    const path = `/account/${accountId}/${mediaType}/recommendations`
    const init = { cacheOptions: { ttl: 0 } }
    return this.get(path, params, init)
  }
}
module.exports = MovieDatabaseV4
