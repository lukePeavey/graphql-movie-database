const dotenv = require('dotenv').config()
const { ApolloServer } = require('apollo-server')
const path = require('path')
const { importSchema } = require('@lukepeavey/graphql-import')
const MovieDataBaseV3 = require('./datasources/MovieDatabaseV3')
const MovieDataBaseV4 = require('./datasources/MovieDataBaseV4')
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
    /* eslint-disable-next-line no-console */
    console.log(error)
    return new Error('Internal server error')
    // Or, you can delete the exception information
    // delete error.extensions.exception;
    // return error;
  }
})

// Start the web server
server.listen({ port: process.env.PORT }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
