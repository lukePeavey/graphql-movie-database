require('dotenv').config()
/**
 * Apollo config
 * https://www.apollographql.com/docs/references/apollo-config.html#service-config
 */
module.exports = {
  service: {
    name: process.env.ENGINE_SERVICE_ID,
    endpoint: process.env.ENDPOINT
  }
}
