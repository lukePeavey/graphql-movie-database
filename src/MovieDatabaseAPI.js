const { RESTDataSource } = require('apollo-datasource-rest')
const camelCaseKeys = require('camelcase-keys')

/**
 * A data source to connect to the TMDB rest API
 */
class MovieDatabaseAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = `https://api.themoviedb.org/3/`
  }

  camelCaseKeys(input, opts = {}) {
    return camelCaseKeys(input, { deep: true, ...opts })
  }

  willSendRequest(request) {
    // Attach API key to all outgoing requests
    request.params.set('api_key', process.env.TMDB_API_KEY)
  }

  /** Get details about a single Movie by ID */
  async getMovie(id) {
    const data = await this.get(`movie/${id}`)
    return this.camelCaseKeys(data)
  }
  /** Get details about a single tv show by ID */
  async getShow(id) {
    const data = await this.get(`tv/${id}`)
    return this.camelCaseKeys(data)
  }
  /** Get details about a single person by ID */
  async getPerson(id) {
    const data = await this.get(`person/${id}`)
    return this.camelCaseKeys(data)
  }
}

module.exports = MovieDatabaseAPI
