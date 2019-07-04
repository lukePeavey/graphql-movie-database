const { RESTDataSource } = require('apollo-datasource-rest')
const { URL } = require('apollo-server-env')
const lowerCase = require('lodash/lowerCase')
const { camelCaseKeys } = require('../utils/camelCase')
const { snakeCaseKeys } = require('../utils/snakeCase')

/**
 * A dataSource for the Movie Database API.
 */
class MovieDatabase extends RESTDataSource {
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

  get(path, params, init) {
    const formattedParams = snakeCaseKeys(params)
    return super.get(path, formattedParams, init)
  }

  post(path, body, init) {
    const formattedBody = snakeCaseKeys(body)
    return super.post(path, formattedBody, init)
  }

  put(path, body, init) {
    const formattedBody = snakeCaseKeys(body)
    return super.put(path, formattedBody, init)
  }

  getVersionNumber() {
    const match = this.baseURL.match(/api.themoviedb.org\/(\d)/)
    return match && Number(match[1])
  }

  transformListItemInput({ id, mediaType }) {
    return { mediaId: Number(id), mediaType: lowerCase(mediaType) }
  }

  /**
   * Converts `sortBy` arguments to the format for the REST API.
   * GraphQL API: `{ sortBy: 'RELEASE_DATE', sortOrder: 'DESC' }`.
   * REST API: `{ sortBy: 'release_date.desc' }`
   * @param {*} params the parameters
   * @param {"MOVIE"|"TV"} mediaType sortBy arguments
   */
  transformSortByInput(params, mediaType = '') {
    const { sortBy: sortByValue, sortOrder = 'DESC', ...otherParams } = params
    if (sortByValue == null) {
      return otherParams
    }
    const substitutions = {
      // For watchlist and favorites, use DATE_ADDED instead of created at
      DATE_ADDED: 'CREATED_AT',
      // The GraphQL API uses "title" as the title field for both Movie and TV
      // Show (As oppose to "title" for Movie and "name" for TV show).
      TITLE: mediaType === 'TV' ? 'NAME' : 'TITLE',
      // In the GraphQL API, both Movie and TV Show have a "releaseDate" field.
      // SO we use RELEASE_DATE to sort both movie and tv lists.
      RELEASE_DATE: mediaType === 'TV' ? 'FIRST_AIR_DATE' : 'RELEASE_DATE'
    }
    const sortBy = substitutions[sortByValue] || sortByValue
    return { ...otherParams, sortBy: `${sortBy}.${sortOrder}`.toLowerCase() }
  }
}

module.exports = MovieDatabase
