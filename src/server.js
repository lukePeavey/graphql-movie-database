const dotenv = require('dotenv').config()
const { ApolloServer } = require('apollo-server')
const path = require('path')
const { importSchema } = require('@lukepeavey/graphql-import')
const MovieDataBaseAPI = require('./MovieDatabaseAPI')
const playground = require('./config/playground')
const resolvers = require('./resolvers')

// import schema using graphql-import
const typeDefs = importSchema(path.join(__dirname, 'schema/query.graphql'))

// Create the Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground,
  mocks: false,
  tracing: true,
  cacheControl: true,
  introspection: true,
  engine: { apiKey: process.env.ENGINE_API_KEY },
  dataSources: () => ({ api: new MovieDataBaseAPI() }),
  formatError: error => {
    if (process.env.NODE_ENV === 'production') {
      // In production: only return error message and code
      return { message: error.message, code: error.extensions.code }
    } else {
      // In development mode:
      // 1. log errors to the console, including the stacktrace
      console.error(`[GraphQLError: ${error.message}]`, error.extensions)
      // 2. Pass the complete error along to client (without stacktrace)
      delete error.extensions.exception
      return error
    }
  }
})

// Start the web server
server.listen({ port: process.env.PORT }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
