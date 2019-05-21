const get = require('lodash/get')
const snakeCase = require('lodash/snakeCase')
const { deCamelCaseArgs } = require('../utils/camelCase')
const debug = require('../utils/debug')
const MovieDatabase = require('./MovieDatabase')

/**
 * A data source to connect to the TMDB rest API
 */
class MovieDatabaseV3 extends MovieDatabase {
  constructor() {
    super()
    this.baseURL = `https://api.themoviedb.org/3/`
  }

  /**
   * Get details about a single person by ID
   * @see https://developers.themoviedb.org/3/people/get-person-details
   */
  async getPerson({ id }) {
    return this.get(`/person/${id}`, {
      append_to_response: 'combined_credits,images'
    })
  }

  /**
   * Get the details about a single Movie by ID
   * @see https://developers.themoviedb.org/3/movies/get-movie-details
   */
  async getMovie({ id }) {
    // Includes credits, video, images, reviews
    const response = await this.get(`/movie/${id}`, {
      append_to_response: 'credits,images,videos,reviews'
    })
    return { ...response, mediaType: 'MOVIE' }
  }

  /**
   * Get details about a single TV show by ID
   * @see https://developers.themoviedb.org/3/tv/get-tv-details
   */
  async getShow({ id }) {
    const response = await this.get(`/tv/${id}`, {
      append_to_response: 'credits,images,videos,reviews,seasons'
    })
    return { ...response, mediaType: 'TV' }
  }

  /**
   * Get the details about a single season of a TV show
   * Includes the cast, crew, videos, review
   * @see https://developers.themoviedb.org/3/tv-seasons/get-tv-season-details
   */
  async getSeason({ showId, seasonNumber }) {
    return this.get(`/tv/${showId}/season/${seasonNumber}`, {
      append_to_response: 'credits,images,videos,reviews'
    })
  }

  /**
   * Get a single episode of a TV show
   * @see https://developers.themoviedb.org/3/tv-episodes/get-tv-episode-details
   */
  async getEpisode({ showId, seasonNumber, episodeNumber }) {
    const URL = `/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`
    return this.get(URL, {
      append_to_response: 'credits,guest_stars,images,videos,reviews'
    })
  }

  /**
   * Takes a list list of genre IDs and returns a list of genre
   * @param {'MOVIE' | 'TV'} mediaType
   */
  async getGenresById({ mediaType, ids }) {
    const genres = await this.getGenreList(mediaType)
    return ids
      .map(id => genres.find(genre => genre.id === id))
      .filter(genre => genre !== null)
  }

  /**
   * Get the list of official genres for a specific Media type
   * @param {'MOVIE' | 'TV'} mediaType
   */
  async getGenreList(mediaType) {
    const { genres } = await this.get(`genre/${mediaType}/list`)
    return genres
  }

  /** Get system configuration information */
  async getConfiguration() {
    return this.get('/configuration')
  }

  /**
   * Find movies or TV shows using the Discover API. The discover api provides
   * a wide range of filtering and sorting options.
   *
   * @param {'/movie' | '/tv'} endpoint
   * @param {Object} [params] - query parameters for the `discover` endpoints
   * @param {number} [params.page] Must be an Int <= 1000
   * @see https://developers.themoviedb.org/3/discover/movie-discover
   */
  async discover(endpoint, params = {}) {
    return this.get(`/discover${endpoint}`, deCamelCaseArgs(params))
  }

  /**
   * Search for items matching the provided query.
   *
   * @param {'/movie' | '/tv' | '/person' | '/company' | '/multi'} endpoint
   * @param {Object} params
   * @param {String} params.query the query string to search for
   * @param {number} [params.page] the pagination offset. Must be Int <= 1000
   * @see https://developers.themoviedb.org/3/search/multi-search
   */
  async search(endpoint = '/multi', params) {
    let { results, meta } = await this.get(`/search${endpoint}`, params)
    return { results, meta }
  }

  /**
   * This method gets movies using the various `/movie/<endpoint>` methods that
   * return specific lists of movies. This includes the following API endpoints:
   * - `/movie/latest`
   * - `/movie/now_playing`
   * - `/movie/now_playing`
   * - `/movie/popular`
   * - `/movie/top_rated`
   * - `/movie/upcoming`
   *
   * @param {String} endpoint
   * @param {Object} params
   * @param {number} params.page
   */
  async movies(endpoint, { page }) {
    return this.get(`/movie/${snakeCase(endpoint)}`, { page })
  }

  /**
   * Gets TV shows using the various `/tv/{endpoint}` methods. These return
   * specific lists of TV shows. It includes the following endpoints:
   *
   * - `/tv/latest`
   * - `/tv/airing_today`
   * - `/tv/on_the_air`
   * - `/tv/popular`
   * - `/tv/top_rated`
   *
   * @param {String} endpoint
   * @param {Object} params
   * @param {number} params.page
   */
  async shows(endpoint, { page }) {
    return this.get(`/tv/${snakeCase(endpoint)}`, { page })
  }

  /**
   * Gets account details for the logged in user.
   */
  async getAccount() {
    await this.convertV4TokenToSessionID()
    const init = { cacheOptions: { ttl: 0 } }
    return this.get('/account', null, init)
  }

  /**
   * Adds/removes an item from watchlist or favorites.
   *
   * @param {'favorite' | 'watchlist'} listType
   * @param {Object} params
   * @see https://developers.themoviedb.org/3/account/add-to-watchlist
   * @see https://developers.themoviedb.org/3/account/mark-as-favorite
   */
  async addToWatchlistOrFavorites(listType, params) {
    try {
      await this.convertV4TokenToSessionID()
      const URL = `/account/${params.accountId}/${listType}`
      const body = {
        ...this.transformListItemInput(params.item),
        [listType]: params[listType]
      }
      const { statusMessage } = await this.post(URL, body)
      return { success: true, message: statusMessage }
    } catch (error) {
      return { message: error.message }
    }
  }

  /**
   * Adds or removes an item from the user's watchlist.
   * Requires a valid user access token.
   *
   * @param {Object} params
   * @param {string} params.accountId
   * @param {{ id: string, mediaType: 'MOVIE' | 'TV' }} params.item
   * @param {boolean} params.watchlist If true, the item will be added to
   *     watchlist. Otherwise, it will be removed
   */
  addToWatchlist(params) {
    return this.addToWatchlistOrFavorites('watchlist', params)
  }

  /**
   * Adds or removes an item from the user's favorites lists.
   * Requires a valid user access token.
   *
   * @param {Object} params
   * @param {string} params.accountId The account ID for the user
   * @param {{ id: string, mediaType: 'MOVIE' | 'TV' }} params.item
   * @param {boolean} params.favorite If true, the item will be added to
   *     favorites. Otherwise, it will be removed.
   */
  addToFavorites(params) {
    return this.addToWatchlistOrFavorites('favorite', params)
  }

  /**
   * Submit a user rating for a Movie or TV Show. Rating should be a number
   * between 0.5 and 10.0 (must be a multiple of 0.5). Setting the rating
   * to `null` will remove the user rating on this item (if there is one).
   *
   * Can only be performed by a logged in user; requires a valid user access
   * token.
   *
   * @param {Object} params
   * @param {'MOVIE' | 'TV'} params.mediaType
   * @param {string} params.id
   * @param {number | null} params.value number between 0.5 and 10.0 or `null`
   * @see https://developers.themoviedb.org/3/movies/rate-movie
   * @see https://developers.themoviedb.org/3/movies/delete-movie-rating
   */
  async updateRating({ mediaType, id, value }) {
    try {
      await this.convertV4TokenToSessionID()
      const URL = `/${mediaType}/${id}/rating`
      // If value is `null`, delete the rating from this item
      const method = value === null ? 'delete' : 'post'
      const body = method === 'post' ? { value } : null
      const { statusMessage } = await this[method](URL, body)
      return { success: true, message: statusMessage }
    } catch (error) {
      debug.error(error)
      const message = get(error, 'extensions.response.body.statusMessage')
      return { message: message || error.message }
    }
  }
}
module.exports = MovieDatabaseV3
