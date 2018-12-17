const capitalize = require('lodash/capitalize')

module.exports = {
  Query: {
    movie: (_, { id }, { dataSources }) => {
      return dataSources.MovieDataBaseAPI.getMovie(id)
    },
    show: (_, { id }, { dataSources }) => {
      return dataSources.MovieDataBaseAPI.getShow(id)
    },
    person: async (_, { id }, { dataSources }) => {
      return dataSources.MovieDataBaseAPI.getPerson(id)
    }
  },
  Media: {
    __resolveType({ mediaType }) {
      return /(tv|movie)/i.test(mediaType) ? capitalize(mediaType) : null
    }
  },
  Movie: {
    mediaType: () => 'MOVIE'
  },
  Show: {
    mediaType: () => 'TV',
    // make title field consistent with Movie
    title: ({ name }) => name,
    originalTitle: ({ originalName }) => originalName
  },
  Person: {
    mediaType: () => 'PERSON'
  },
  Credit: {
    __resolveType({ job, department, creditType }) {
      return !job || /^act/i.test(job || department) ? 'CAST' : 'CREW'
    }
  }
}
