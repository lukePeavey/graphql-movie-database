const transforms = require('./utils/transforms')
const capitalize = require('lodash/capitalize')

module.exports = {
  Query: {
    search: async (_, args, { dataSources }) => {
      return dataSources.api.search('multi/', args)
    },
    movies: (_, args, { dataSources }) => {
      const method = args.query ? 'search' : 'discover'
      return dataSources.api[method]('/movie', args)
    },
    shows: (_, args = {}, { dataSources }) => {
      const method = args.query ? 'search' : 'discover'
      return dataSources.api[method]('/tv', args)
    },
    people: (_, args = {}, { dataSources }) => {
      return dataSources.api.search('/person', args)
    },
    companies: (_, args = {}, { dataSources }) => {
      return dataSources.api.search('/company', args)
    },
    Movie: (_, args, { dataSources }) => {
      return dataSources.api.getMovie(args.id)
    },
    Show: (_, args, { dataSources }) => {
      return dataSources.api.getShow(args.id)
    },
    Person: (_, args, { dataSources }) => {
      return dataSources.api.getPerson(args.id)
    },
    Configuration: (_, args, { dataSources }) => {
      return dataSources.api.getConfiguration()
    }
  },
  SearchResult: {
    __resolveType({ mediaType }) {
      if (/tv/i.test(mediaType)) return 'Show'
      return capitalize(mediaType)
    }
  },
  Movie: {
    mediaType: () => 'movie',
    // If the response doesn't already include the `credits` property, make an
    // API request to `/movie/${id}` to get the credits.
    credits: async ({ credits, id }, _, { dataSources }) => {
      if (credits) return credits
      const data = await dataSources.movieDataBaseAPI.getShowById(id)
      return data.credits
    },
    // By default, the `genres` property not included in results from the
    // `/search` and '/discover' endpoints. It is also not included in
    // properties that contain a list of references to movies (such as
    // `peron->movie_credits`). To make 'genres' available on all instances of
    // the Movie object, we just convert `genreIds` to a list of  genres when
    // necessary. This only requires one additional API request per query,
    // to get the complete list of movie genres.
    genres: async ({ genreIds, genres }, _, { dataSources }) => {
      return genres || transforms.getGenres('movie', genreIds, dataSources)
    },
    videos: async ({ videos, id }, _, { dataSources }) => {
      if (!videos) videos = (await dataSources.api.getMovie(id))['videos']
      return videos.results
    },
    images: async ({ images, id }, { dataSources }) => {
      return images || (await dataSources.api.getMovie(id))['images']
    },
    reviews: async ({ reviews, id }, { dataSources }) => {
      return reviews || (await dataSources.api.getMovie(id))['reviews']
    }
  },
  Show: {
    mediaType: () => 'tv',
    title: ({ name }) => name, // make consistent with Movie
    originalTitle: ({ originalName }) => originalName,
    // If the response doesn't already include the `credits` property, make an
    // request to `/tv/${id}` to get the credits.
    credits: async function({ credits, id }, _, { dataSources }) {
      if (credits) return credits
      const data = await dataSources.movieDataBaseAPI.getShowById(id)
      return data.credits
    },
    // See comment above `Movie.genres` for more information
    genres: async ({ genreIds, genres }, _, { dataSources }) => {
      return genres || transforms.getGenres('tv', genreIds, dataSources)
    },
    videos: async ({ id, ...obj }, _, { dataSources }) => {
      const videos = obj.videos || (await dataSources.api.getShow(id))['videos']
      return videos.results
    },
    images: async ({ id, images }, { dataSources }) => {
      return images || (await dataSources.api.getShow(id))['images']
    },
    reviews: async ({ reviews, id }, { dataSources }) => {
      return reviews || (await dataSources.api.getShow(id))['reviews']
    },
    // @todo Figure out a better way to handle querying seasons & episodes
    allSeasons: ({ id, seasons }) => {
      // Pass down the `showId` prop to the `season` field. This allows it to
      // make an API request to `/tv/${showId}/season/${seasonNumber}` to get
      // episodes when the `episodes` field is present in the query.
      return seasons.map(season => ({ showId: id, ...season }))
    },
    // Get a single season by `seasonNumber.`
    season: ({ seasons = [], id }, { seasonNumber }) => {
      const season = seasons.find(el => el.seasonNumber === seasonNumber)
      return season ? { ...season, showId: id } : null
    }
  },
  Season: {
    title: ({ name }) => name, // make consistent with Movie
    episodes: async function({ showId, seasonNumber }, _, { dataSources }) {
      const data = await dataSources.api.getSeason({ showId, seasonNumber })
      return data.episodes
    },
    videos: async ({ videos, ...obj }, _, { dataSources }) => {
      if (!videos) videos = (await dataSources.api.getSeason(obj))['videos']
      return videos.results
    },
    images: async ({ images, ...obj }, _, { dataSources }) => {
      return images || (await dataSources.api.getSeason(obj))['images']
    },
    reviews: async ({ reviews, ...obj }, _, { dataSources }) => {
      return reviews || (await dataSources.api.getSeason(obj))['reviews']
    }
  },
  Episode: {
    title: ({ name }) => name // make consistent with Movie
  },
  Person: {
    mediaType: () => 'person',
    knownFor: async ({ name, id, knownFor }, _, { dataSources }) => {
      if (knownFor) return knownFor
      // @todo find a better solution for the following issue:
      // For some reason the  "known_for" property is only included in search
      // results via  (`/search/person`); its not included in a details request
      // for single person. As a workaround, when this field is requested in a
      // `Person` query, make a second API request to the search endpoint
      // using the name and ID obtained from the `/person/{id}` request.
      const { results } = await dataSources.api.search('/person', {
        query: name
      })
      const match = results.find(person => String(person.id) === String(id))
      return match ? match.knownFor : []
    },
    // `filmography` is the person's combined movie and tv credits
    filmography: async ({ combinedCredits, id }, _, { dataSources }) => {
      // If the response doesn't already include `combined_credits`, make an
      // API request to `/person/${id}` to fetch it
      if (!combinedCredits) {
        const data = await dataSources.api.getPerson(id)
        combinedCredits = data.combinedCredits
      }
      return {
        cast: combinedCredits.cast.map(transforms.filmographyCredit),
        crew: combinedCredits.crew.map(transforms.filmographyCredit)
      }
    }
  },
  Media: {
    __resolveType({ mediaType }) {
      return /tv/i.test(mediaType) ? 'Show' : 'Movie'
    }
  },
  Credit: {
    __resolveType({ job, department }) {
      return !job || /^act/i.test(job || department) ? 'cast' : 'crew'
    }
  },
  CastCredit: {
    creditType: () => 'cast'
  },
  CrewCredit: {
    creditType: () => 'crew'
  }
}
