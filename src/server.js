const dotenv = require('dotenv').config()
const { ApolloServer } = require('apollo-server')
const path = require('path')
const importSchema = require('./utils/importSchema')
const typeDefs = importSchema(path.join(__dirname, 'schema'))
const MovieDataBaseAPI = require('./MovieDatabaseAPI')

// Configure Apollo Server
const server = new ApolloServer({
  typeDefs,
  mocks: true,
  tracing: false,
  cacheControl: false,
  engine: { apiKey: process.env.ENGINE_API_KEY },
  dataSources: () => ({ MovieDataBaseAPI: new MovieDataBaseAPI() }),
  formatError: error => {
    /* eslint-disable-next-line no-console */
    console.log(error)
    return new Error('Internal server error')
    // Or, you can delete the exception information
    // delete error.extensions.exception;
    // return error;
  }
})

// This `listen` method launches a web-server.
server.listen({ port: process.env.PORT }).then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
