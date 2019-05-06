const { RESTDataSource } = require('apollo-datasource-rest')
const { camelCaseKeys } = require('../utils/camelCase')
const snakeCase = require('lodash/snakeCase')

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
}
module.exports = MovieDatabaseV4
