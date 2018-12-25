const { RESTDataSource } = require('apollo-datasource-rest')
const { camelCaseKeys, deCamelCaseArgs } = require('./utils/camelCase')

/**
 * A data source to connect to the TMDB rest API
 */
class MovieDatabaseAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = `https://api.themoviedb.org/3`
  }

  willSendRequest(request) {
    // Attach API key to all outgoing requests
    request.params.set('api_key', process.env.TMDB_API_KEY)
  }

  /**
   * Handles get requests
   * This overrides the `get` method on the parent class to perform some general
   * transformations to the response data that are common to all get methods.
   * @see RESTDataSource.prototype.get
   */
  async get(path, params, init) {
    const response = camelCaseKeys(await super.get(path, params, init))
    // For single item queries => `Item`
    if (!response.results) return response
    // For search/discover queries => `{ results: [Item], meta: QueryMeta }`
    const { results, ...meta } = response
    return { results, meta }
  }

  /** Get details about a single Movie by ID */
  async getMovie({ id }) {
    const params = { append_to_response: 'credits,images,videos,reviews' }
    return this.get(`/movie/${id}`, params)
  }

  /** Get details about a single tv show by ID */
  async getShow({ id }) {
    return this.get(`/tv/${id}`, {
      append_to_response: 'credits,images,videos,reviews,seasons'
    })
  }

  /** Get details about a single person by ID */
  async getPerson({ id }) {
    return this.get(`/person/${id}`, {
      append_to_response: 'combined_credits,images'
    })
  }
  /** Get a genre by ID */
  async getGenre({ mediaType, id }) {
    const { genres } = await this.getGenreList(mediaType)
    return genres.find(item => item.id === id)
  }

  /** Takes a list list of genre IDs and returns a list of genres */
  async getGenres({ mediaType, ids }) {
    return ids.map(async id => this.getGenre({ mediaType, id }))
  }

  /**
   * Get the list of official genres for a specific Media type
   * @param {'movie' | 'tv'} type (also accepts "show" as alias for "tv")
   */
  async getGenreList(mediaType) {
    const endpoint = /tv|show/i.test(mediaType) ? 'tv' : 'movie'
    return this.get(`genre/${endpoint}/list`)
  }

  /** Get a single season of a TV show, including all episodes */
  async getSeason({ showId, seasonNumber }) {
    return this.get(`/tv/${showId}/season/${seasonNumber}`, {
      append_to_response: 'credits,images,videos,reviews'
    })
  }

  /** Get a single season of a TV show, including all episodes */
  async getEpisode({ showId, seasonNumber, episodeNumber }) {
    const base = `/tv/${showId}/season/${seasonNumber}/episode`
    return this.get(`${base}/${episodeNumber}`, {
      append_to_response: 'credits,guest_stars,images,videos,reviews'
    })
  }

  /** Get system configuration information */
  async getConfiguration() {
    return this.get('/configuration')
  }

  /**
   * Find movies/shows using the `/discover/` endpoint
   *
   * @todo
   * Caching doesn't seem to be working on requests to `/discover/tv`.
   * If you run the `movies` query multiple times with the same args, it
   * uses the cached response from `/discover/movie` after the first
   * query. However, with the `shows` query, it looks like its making a
   * new request to `/discover/tv` on every query.
   * 1. Lean more about cache configuration options for 'RestDataSource.'
   * 2. How to get more details about the cache
   *
   * @param {'movie' | 'tv'} endpoint
   * @param {Object} params
   * @param {Object} params.filter supports all filtering options that are
   * available on the `/discover/movie` endpoint. The format of the
   * argument names is slightly different, see schema for details
   * @param {String} params.sortBy Supports all values available for the
   * `sort_by` parameter on the `/discover/movie/` endpoint. See
   * schema for details
   * @param {number} params.page Must be an Int <= 1000
   */
  async discover(endpoint, params = {}) {
    const { filter = {}, ...rest } = params
    return this.get(`/discover${endpoint}`, {
      ...deCamelCaseArgs(filter),
      ...deCamelCaseArgs(rest),
      cacheControl: { ttl: 1000 }
    })
  }

  /**
   * Search for items matching the provided query.
   * @todo Add support for other search endpoints like `company` and `keyword`
   *
   * @param {Object} params
   * @param {'movie' | 'tv' | 'person' | 'company' | 'multi'} params.type
   * @param {String} params.query the query string to search for
   * @param {number} params.page the pagination offset. Must be Int <= 1000
   */
  async search(endpoint = '/multi', params) {
    let { results, meta } = await this.get(`/search${endpoint}`, params)
    if (/multi/.test(endpoint)) {
      results = results.map(item => ({ mediaType: endpoint.slice(1), ...item }))
    }
    return { results, meta }
  }
}
module.exports = MovieDatabaseAPI
