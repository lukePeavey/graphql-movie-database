module.exports = {
  endpoint:
    process.env.NODE_ENV === 'development'
      ? `http://localhost:${process.env.PORT}`
      : process.env.ENDPOINT,
  headers: {
    authorization: process.env.TMDB_USER_ACCESS_TOKEN
  },
  settings: {
    'editor.theme': 'dark',
    'editor.reuseHeaders': true,
    'editor.hideTracingResponse': false,
    'tracing.hideTracingResponse': false
  }
}
