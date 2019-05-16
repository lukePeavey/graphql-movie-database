module.exports = {
  endpoint: `${process.env.ENDPOINT}`,
  headers: {
    authorization: process.env.TMDB_USER_ACCESS_TOKEN
  },
  settings: {
    'editor.theme': 'dark',
    'editor.reuseHeaders': true,
    'editor.hideTracingResponse': false
  }
}
