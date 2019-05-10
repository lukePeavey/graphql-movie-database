const { RESTDataSource } = require('apollo-datasource-rest')
const { camelCaseKeys } = require('../utils/camelCase')

/**
 * A data source for the TMDB API (V4)
 */
class MovieDatabaseV4 extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = `https://api.themoviedb.org/4`
  }

  async get(path, params, init) {
    if (init === undefined) {
      // Set cache options for partial query caching.
      init = { cacheOptions: { ttl: 10000 } }
    }
    return camelCaseKeys(await super.get(path, params, init))
  }

  willSendRequest(request) {
    // V4 Authentication...
    // Application based authentication
    let token = process.env.TMDB_API_READ_ACCESS_TOKEN

    // User based authentication
    if (this.context.userAccessToken) {
      token = this.context.userAccessToken
    }
    request.headers.set('authorization', `Bearer ${token}`)
  }
}
module.exports = MovieDatabaseV4
