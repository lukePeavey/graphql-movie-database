require('dotenv').config()
/**
 * Apollo config
 * https://www.apollographql.com/docs/references/apollo-config.html
 */
module.exports = {
  service: {
    endpoint: {
      url: `http://localhost:${process.env.PORT}`
    }
  }
}
