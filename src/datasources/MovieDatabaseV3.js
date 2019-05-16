const { AuthenticationError } = require('apollo-server')
const { deCamelCaseArgs } = require('../utils/camelCase')
const snakeCase = require('lodash/snakeCase')
const { InMemoryLRUCache } = require('apollo-server-caching')
const MovieDatabase = require('./MovieDatabase')

// Create a custom cache for storing specific key/value pairs
const keyValueCache = new InMemoryLRUCache()

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
    return this.get(`/movie/${id}`, {
      append_to_response: 'credits,images,videos,reviews'
    })
  }

  /**
   * Get details about a single TV show by ID
   * @see https://developers.themoviedb.org/3/tv/get-tv-details
   */
  async getShow({ id }) {
    return this.get(`/tv/${id}`, {
      append_to_response: 'credits,images,videos,reviews,seasons'
    })
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
   * Converts a user access token (V4 authentication) to a sessionID.
   * The session ID is used to authenticate V3 endpoints that require user
   * authorization.
   *
   * TODO: Find a secure way to cache session IDs
   *
   * @throws {AuthenticationError}
   * @returns {string} sessionID
   */
  async convertV4TokenToSessionID() {
    if (!this.context.userAccessToken) {
      throw new AuthenticationError('No token.')
    }
    try {
      // See if a session ID has already been created for this token
      let sessionId = await keyValueCache.get(this.context.userAccessToken)
      if (!sessionId) {
        // If not, try to create a session ID from the access token
        const URL = `/authentication/session/convert/4`
        const body = { access_token: this.context.userAccessToken }
        const response = await this.post(URL, body)
        sessionId = response.sessionId
        // Cache the session ID for subsequent requests
        await keyValueCache.set(this.context.userAccessToken, sessionId)
      }
      return sessionId
    } catch (error) {
      throw new AuthenticationError('Invalid token.')
    }
  }

  /**
   * Gets account details for the logged in user.
   */
  async getAccount() {
    let sessionId = await this.convertV4TokenToSessionID()
    return this.get('/account', { session_id: sessionId })
  }
}
module.exports = MovieDatabaseV3
