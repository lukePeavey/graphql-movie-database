const { RESTDataSource } = require('apollo-datasource-rest')
const { camelCaseKeys } = require('../utils/camelCase')
const { URL } = require('apollo-server-env')

/**
 * A dataSource for the Movie Database API.
 */
class MovieDatabase extends RESTDataSource {
  /**
   * Add authentication
   * @override
   */
  willSendRequest(request) {
    const API_VERSION = this.getVersionNumber()
    if (API_VERSION === 3) {
      // V3 Authentication...
      request.params.set('api_key', process.env.TMDB_API_KEY)
    } else if (API_VERSION === 4) {
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

  /**
   * Resolves URL
   * @override
   */
  resolveURL({ path = '' }) {
    return new URL(
      path.replace(/^\//, '').toLowerCase(),
      this.baseURL.endsWith('/') ? this.baseURL : `${this.baseURL}/`
    )
  }

  /**
   * Sets the default cache options for partial query caching.
   * @override
   */
  cacheOptionsFor(response, request) {
    if (request.method === 'GET') {
      return { ttl: 10000 }
    } else {
      return { ttl: 0 }
    }
  }

  /**
   * Parses the response body. JSON data is transformed so all property names
   * are camelcase.
   * @override
   */
  async parseBody(response) {
    const contentType = response.headers.get('Content-Type')
    if (/^application\/(hal\+)?json/.test(contentType)) {
      return camelCaseKeys(await response.json())
    } else {
      return response.text()
    }
  }

  getVersionNumber() {
    const match = this.baseURL.match(/api.themoviedb.org\/(\d)/)
    return match && Number(match[1])
  }
}

module.exports = MovieDatabase
