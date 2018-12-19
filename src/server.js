const dotenv = require('dotenv').config()
const { ApolloServer } = require('apollo-server')
const path = require('path')
const importSchema = require('./utils/importSchema')
const MovieDataBaseAPI = require('./MovieDatabaseAPI')
const resolvers = require('./resolvers')
const schema = importSchema(path.join(__dirname, 'schema'))

// Create the Apollo Server instance
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  mocks: false,
  tracing: false,
  cacheControl: true,
  introspection: true,
  playground: {
    endpoint: `${process.env.DOMAIN}${process.env.ENDPOINT}`,
    settings: {
      'editor.theme': 'light',
      'editor.fontSize': '16',
      'editor.fontFamily': `'Fira Code', 'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`
    }
  },
  engine: { apiKey: process.env.ENGINE_API_KEY },
  dataSources: () => ({ movieDataBaseAPI: new MovieDataBaseAPI() }),
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
