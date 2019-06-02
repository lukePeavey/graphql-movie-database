require('dotenv').config() // Load environment variables
const { ApolloServer } = require('apollo-server')
const path = require('path')
const { importSchema } = require('@lukepeavey/graphql-import')
const MovieDataBaseV3 = require('./datasources/MovieDatabaseV3')
const MovieDataBaseV4 = require('./datasources/MovieDatabaseV4')
const playground = require('./config/playground')
const resolvers = require('./resolvers')

// import schema using graphql-import
const typeDefs = importSchema(path.join(__dirname, 'schema/index.graphql'))

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
  dataSources: () => ({
    movieDatabaseV3: new MovieDataBaseV3(),
    movieDatabaseV4: new MovieDataBaseV4()
  }),
  context: ({ req }) => {
    // Check headers for a user authentication token.
    if (req.headers.authorization) {
      return { userAccessToken: req.headers.authorization }
    }
  },
  formatError: error => {
    if (process.env.NODE_ENV !== 'development') {
      // In production: only return error message and code
      return { message: error.message, code: error.extensions.code }
    } else {
      // In development mode:
      // 1. log errors to the console, including the stacktrace
      /* eslint-disable-next-line no-console */
      console.error(`[GraphQLError: ${error.message}]`, error.extensions)
      // 2. Pass the complete error along to client (without stacktrace)
      delete error.extensions.exception
      return error
    }
  }
})

// Start the web server
server.listen({ port: process.env.PORT }).then(({ url }) => {
  /* eslint-disable-next-line no-console */
  console.log(`🚀 Server ready at ${url}`)
})
