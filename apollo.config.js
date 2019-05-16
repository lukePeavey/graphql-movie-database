require('dotenv').config()
/**
 * Apollo config
 * https://www.apollographql.com/docs/references/apollo-config.html
 */
module.exports = {
  service: {
    name: process.env.ENGINE_SERVICE_ID,
    endpoint: {
      url: process.env.ENDPOINT
    }
  }
}
