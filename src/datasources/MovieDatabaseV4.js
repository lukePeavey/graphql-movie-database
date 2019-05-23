const upperCase = require('lodash/upperCase')
const debug = require('../utils/debug')
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
   * Retrieve a list by ID.
   * Private lists can only be accessed by their owners and therefore require a
   * valid user access token.
   * @see https://developers.themoviedb.org/4/list/get-list
   */
  async getList({ id, ...params }) {
    const init = { cacheOptions: { ttl: 0 } }
    const response = await this.get(`/list/${id}`, params, init)
    // Transform sortBy values to match schema
    const sortBy = response.sortBy.replace(
      /(\w+)\.([a-z]+)/,
      (_, m1, m2) => `${upperCase(m1)}__${upperCase(m2)}`
    )
    return { ...response, sortBy }
  }

  /**
   * Create a new list.
   * Requires a valid user access token.
   * @see https://developers.themoviedb.org/4/list/create-list
   */
  async createList({ name, description, iso_639_1 = 'en' }) {
    try {
      const body = { name, description, iso_639_1 }
      const response = await this.post('/list', body)
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
   * @see https://developers.themoviedb.org/4/list/update-list
   */
  async updateList({ id, ...params }) {
    try {
      const response = await this.put(`/list/${id}`, params)
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
      const response = await this.get(`/list/${id}/clear`)
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
    const path = `/account/${accountId}/${mediaType}/watchlist`
    const init = { cacheOptions: { ttl: 0 } }
    return this.get(path, params, init)
  }

  /**
   * Get the user's "favorites" list. This requires a valid user access token.
   */
  async myFavorites({ accountId, mediaType, ...params }) {
    const path = `/account/${accountId}/${mediaType}/favorites`
    const init = { cacheOptions: { ttl: 0 } }
    return this.get(path, params, init)
  }

  /**
   * Gets the list of Movies or Shows that have been rated by the logged in
   * user. Requires a valid user access token
   */
  async myRatings({ mediaType, accountId, ...params }) {
    const typename = /tv/i.test(mediaType) ? 'show' : 'movie'
    const path = `/account/${accountId}/${mediaType}/rated`
    const init = { cacheOptions: { ttl: 0 } }
    let { results, ...pageInfo } = await this.get(path, params, init)
    results = results.map(({ accountRating, ...media }) => ({
      rating: accountRating,
      [typename]: media
    }))
    return { results, ...pageInfo }
  }
}
module.exports = MovieDatabaseV4
