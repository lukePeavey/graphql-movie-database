const util = require('util')

const debug = {
  error: error => {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.error(util.inspect(error, { depth: 4, color: true }))
    }
  },
  info: (...message) => {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable-next-line no-console */
      console.log(...message)
    }
  }
}

module.exports = debug
