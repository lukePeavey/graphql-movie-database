const transforms = require('./utils/transforms')
const capitalize = require('lodash/capitalize')
const camelCase = require('lodash/camelCase')
const get = require('lodash/get')

async function getDetails(objectType, field, obj, dataSources) {
  if (obj[field]) return obj[field]
  return get(await dataSources.api[`get${objectType}`](obj), field)
}

// Resolvers for `Movie`, `Show`, `Season`, and `Episode` objects
function mediaResolvers(objectType) {
  const resolvers = {
    cast: async (obj, args, { dataSources }) => {
      const credits = await getDetails(objectType, 'credits', obj, dataSources)
      if (!args.first) return credits.cast
      return credits.cast.filter(item => item.order < args.first)
    },
    crew: async (obj, args, { dataSources }) => {
      const credits = await getDetails(objectType, 'credits', obj, dataSources)
      if (!args.departments) return credits.crew
      return credits.crew.filter(item => {
        return args.departments.includes(camelCase(item.department))
      })
    },
    videos: async (obj, args, { dataSources }) => {
      const videos = await getDetails(objectType, 'videos', obj, dataSources)
      if (!args.type) return videos.results
      return videos.results.filter(item => camelCase(item.type) === args.type)
    },
    images: async (obj, _, { dataSources }) => {
      return await getDetails(objectType, 'images', obj, dataSources)
    }
  }
  // Resolvers for `Movie` and `Show` objects
  if (/Show|Movie/.test(objectType)) {
    resolvers.reviews = async (obj, _, { dataSources }) => {
      return await getDetails(objectType, 'reviews', obj, dataSources)
    }
    // The `genres` property is only included in single-item endpoints
    // (`/movie/${id}` and `/tv/${id}`). Movies and Shows returned by other
    // endpoints (like search and discover) only have the `genre_ids` property.
    // This resolver converts `genre_ids` to `genres` when necessary so the
    // `genres` field is available on all instances of `Movie` and `Show`
    // @NOTE This only requires a single API request to get the complete list
    // of genres for each media type (movie/tv).
    resolvers.genres = async ({ genreIds, genres }, _, { dataSources }) => {
      if (genres) return genres
      return dataSources.api.getGenres({ mediaType: objectType, ids: genreIds })
    }
  }

  return resolvers
}
module.exports = {
  Query: {
    search: async (_, args, { dataSources }) => {
      return dataSources.api.search('/multi', args)
    },
    movies: (_, args = {}, { dataSources }) => {
      const { query, list, discover, ...rest } = args
      if (query) return dataSources.api.search('/movie', { query, ...rest })
      if (list) return dataSources.api.movies(list, rest)
      return dataSources.api.discover('/movie', { ...discover, ...rest })
    },
    shows: (_, args = {}, { dataSources }) => {
      const { query, list, discover, ...rest } = args
      if (query) return dataSources.api.search('/tv', { query, ...rest })
      if (list) return dataSources.api.shows(list, rest)
      return dataSources.api.discover('/tv', { ...discover, ...rest })
    },
    people: (_, args = {}, { dataSources }) => {
      return dataSources.api.search('/person', args)
    },
    companies: (_, args = {}, { dataSources }) => {
      return dataSources.api.search('/company', args)
    },
    Movie: (_, args, { dataSources }) => {
      return dataSources.api.getMovie(args)
    },
    Show: (_, args, { dataSources }) => {
      return dataSources.api.getShow(args)
    },
    Season: async (_, args, { dataSources }) => {
      return { showId: args.showId, ...(await dataSources.api.getSeason(args)) }
    },
    Episode: async (_, args, { dataSources }) => {
      return { ...args, ...(await dataSources.api.getEpisode(args)) }
    },
    Person: (_, args, { dataSources }) => {
      return dataSources.api.getPerson(args)
    },
    configuration: (_, args, { dataSources }) => {
      return dataSources.api.getConfiguration()
    }
  },
  SearchResult: {
    __resolveType({ mediaType }) {
      if (/tv/i.test(mediaType)) return 'Show'
      return capitalize(mediaType)
    }
  },
  ImagesConfig: {
    // Use HTTPS for the default base URL
    baseUrl: ({ secureBaseUrl }) => secureBaseUrl
  },
  Movie: {
    ...mediaResolvers('Movie'),
    mediaType: () => 'movie'
  },
  Show: {
    ...mediaResolvers('Show'),
    mediaType: () => 'tv',
    title: ({ name }) => name, // make consistent with Movie
    originalTitle: ({ originalName }) => originalName,
    // Get all seasons of a show
    // @todo Figure out a better way to handle querying seasons & episodes
    seasons: async ({ seasons, id }, _, { dataSources }) => {
      seasons = seasons || (await dataSources.api.getShow({ id }))['seasons']
      // Pass down the `showId` prop to the `season` field. This allows it to
      // make an API request to `/tv/${showId}/season/${seasonNumber}` to get
      // episodes when the `episodes` field is present in the query.
      return seasons.map(season => ({ showId: id, ...season }))
    },
    // Gets a single season of the show
    season: async ({ id: showId }, { seasonNumber }, { dataSources }) => {
      const season = await dataSources.api.getSeason({ showId, seasonNumber })
      // Pass down the `showId` prop to the `season` field. This allows it to
      // make an API request to `/tv/${showId}/season/${seasonNumber}` to get
      // episodes when the `episodes` field is present in the query.
      return { showId, ...season }
    }
  },
  Season: {
    ...mediaResolvers('Season'),
    title: ({ name }) => name, // make consistent with Movie
    // Gets all episodes of the season
    // @todo figure out better way to handle querying episodes
    episodes: async ({ showId, seasonNumber }, _, { dataSources }) => {
      const data = await dataSources.api.getSeason({ showId, seasonNumber })
      return data.episodes
    },
    // Gets a single episode of the season
    episode: async (obj, { episodeNumber }, { dataSources }) => {
      const { showId, seasonNumber } = obj
      return await dataSources.api.getEpisode({
        showId,
        seasonNumber,
        episodeNumber
      })
    }
  },
  Episode: {
    ...mediaResolvers('Episode'),
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
    knownForDepartment: async ({ id, ...obj }, _, { dataSources }) => {
      if (obj.knownForDepartment) return obj.knownForDepartment
      return (await dataSources.api.getPerson({ id }))['knownForDepartment']
    },
    // `filmography` is the person's combined movie and tv credits
    // @todo needs work
    filmography: async ({ combinedCredits, id }, _, { dataSources }) => {
      // If the response doesn't already include `combined_credits`, make an
      // API request to `/person/${id}` to fetch it
      if (!combinedCredits) {
        const data = await dataSources.api.getPerson({ id })
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
