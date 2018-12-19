const uppercase = require('lodash/upperCase')

// By default, each item consists of a movie or tv show combined with the
// credit properties (ie `character`, `job`, `credit_id`, etc). TO match
// the schema, the Movie\Show fields are moved to Credit.media
module.exports.filmographyCredit = credit => ({
  ...credit,
  media: Object.assign({}, credit)
})

/**
 * Convert a list of genre IDs to a list of genres with name and ID
 * @param {'tv' | 'movie'} mediaType
 * @param {number[]} genreIds
 * @param {Object} dataSources
 * @param {MovieDataBaseAPI} dataSources.movieDataBaseAPI
 */
module.exports.getGenres = async function(mediaType, genreIds, dataSources) {
  return genreIds.map(async id => {
    return await dataSources.movieDataBaseAPI.getGenreById(mediaType, id)
  })
}
