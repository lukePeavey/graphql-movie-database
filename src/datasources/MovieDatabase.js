const { RESTDataSource } = require('apollo-datasource-rest')
const { URL } = require('apollo-server-env')
const { InMemoryLRUCache } = require('apollo-server-caching')
const { AuthenticationError } = require('apollo-server')
const lowerCase = require('lodash/lowerCase')
const { deCamelCaseArgs, camelCaseKeys } = require('../utils/camelCase')

// Create a custom cache for storing specific key/value pairs
const keyValueCache = new InMemoryLRUCache()

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
      if (this.sessionId) {
        request.params.set('session_id', this.sessionId)
      }
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

  get(path, params, init) {
    return super.get(path, deCamelCaseArgs(params), init)
  }

  post(path, body, init) {
    return super.post(path, deCamelCaseArgs(body), init)
  }

  put(path, body, init) {
    return super.put(path, deCamelCaseArgs(body), init)
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
      this.sessionId = await keyValueCache.get(this.context.userAccessToken)
      if (!this.sessionId) {
        // If not, try to create a session ID from the access token
        const URL = `/authentication/session/convert/4`
        const body = { access_token: this.context.userAccessToken }
        const response = await this.post(URL, body)
        this.sessionId = response.sessionId
        // Cache the session ID for subsequent requests
        await keyValueCache.set(this.context.userAccessToken, this.sessionId)
      }
    } catch (error) {
      throw new AuthenticationError('Invalid token.')
    }
  }

  getVersionNumber() {
    const match = this.baseURL.match(/api.themoviedb.org\/(\d)/)
    return match && Number(match[1])
  }

  transformListItemInput({ id, mediaType }) {
    return { media_id: Number(id), media_type: lowerCase(mediaType) }
  }
}

module.exports = MovieDatabase
