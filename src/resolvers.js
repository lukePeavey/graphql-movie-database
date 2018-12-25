const transforms = require('./utils/transforms')
const capitalize = require('lodash/capitalize')
const camelCase = require('lodash/camelCase')

// @TODO Refactor to reduce code repetition!

module.exports = {
  Query: {
    search: async (_, args, { dataSources }) => {
      return dataSources.api.search('/multi', args)
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
    Season: async (_, args, { dataSources }) => {
      return { showId: args.showId, ...(await dataSources.api.getSeason(args)) }
    },
    Episode: async (_, args, { dataSources }) => {
      return { ...args, ...(await dataSources.api.getEpisode(args)) }
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
    // Get cast credits for Movie object
    cast: async ({ credits, id }, { first }, { dataSources }) => {
      credits = credits || (await dataSources.api.getMovie(id))['credits']
      return !first ? credits.cast : credits.cast.slice(0, first)
    },
    // Get crew credits for Movie object
    crew: async ({ credits, id }, { departments }, { dataSources }) => {
      credits = credits || (await dataSources.api.getMovie(id))['credits']
      if (!departments) return credits.crew
      return credits.crew.filter(item => {
        return departments.includes(camelCase(item.department))
      })
    },
    videos: async ({ videos, id }, { type }, { dataSources }) => {
      if (!videos) videos = (await dataSources.api.getMovie(id))['videos']
      if (!type) return videos.results
      return videos.results.filter(item => camelCase(item.type) === type)
    },
    images: async ({ images, id }, { dataSources }) => {
      return images || (await dataSources.api.getMovie(id))['images']
    },
    reviews: async ({ reviews, id }, { dataSources }) => {
      return reviews || (await dataSources.api.getMovie(id))['reviews']
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
    }
  },
  Show: {
    mediaType: () => 'tv',
    title: ({ name }) => name, // make consistent with Movie
    originalTitle: ({ originalName }) => originalName,
    // Get cast credits for TV Show
    cast: async ({ credits, id }, { first }, { dataSources }) => {
      credits = credits || (await dataSources.api.getShow(id))['credits']
      return !first ? credits.cast : credits.cast.slice(0, first)
    },
    // Get crew credits for TV Show
    crew: async ({ credits, id }, { departments }, { dataSources }) => {
      credits = credits || (await dataSources.api.getShow(id))['credits']
      if (!departments) return credits.crew
      return credits.crew.filter(item => {
        return departments.includes(camelCase(item.department))
      })
    },
    videos: async ({ videos, id }, { type }, { dataSources }) => {
      videos = videos || (await dataSources.api.getShow(id))['videos']
      if (!type) return videos.results
      return videos.results.filter(item => camelCase(item.type) === type)
    },
    images: async ({ id, images }, { dataSources }) => {
      return images || (await dataSources.api.getShow(id))['images']
    },
    reviews: async ({ reviews, id }, { dataSources }) => {
      return reviews || (await dataSources.api.getShow(id))['reviews']
    },
    // See comment above `Movie.genres` for more information
    genres: async ({ genreIds, genres }, _, { dataSources }) => {
      return genres || transforms.getGenres('tv', genreIds, dataSources)
    },
    // Get all seasons of a show
    // @todo Figure out a better way to handle querying seasons & episodes
    seasons: async ({ seasons, id }, _, { dataSources }) => {
      seasons = seasons || (await dataSources.api.getShow(id))['seasons']
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
    title: ({ name }) => name, // make consistent with Movie
    // Get the cast credits for the season
    // @note this requires an API call to `/tv/${id}/season/${seasonNumber}`
    cast: async ({ credits, ...obj }, { first }, { dataSources }) => {
      credits = credits || (await dataSources.api.getSeason(obj))['credits']
      return !first ? credits.cast : credits.cast.slice(0, first)
    },
    // Get the crew credits for the season
    // @note this requires an API call to `/tv/${id}/season/${seasonNumber}`
    crew: async ({ credits, ...obj }, { departments }, { dataSources }) => {
      credits = credits || (await dataSources.api.getSeason(obj))['credits']
      if (!departments) return credits.crew
      return credits.crew.filter(item => {
        return departments.includes(camelCase(item.department))
      })
    },
    // Get the crew credits for the season
    videos: async ({ videos, ...obj }, { type }, { dataSources }) => {
      if (!videos) videos = (await dataSources.api.getSeason(obj))['videos']
      if (!type) return videos.results
      return videos.results.filter(item => camelCase(item.type) === type)
    },
    images: async ({ images, ...obj }, _, { dataSources }) => {
      return images || (await dataSources.api.getSeason(obj))['images']
    },
    reviews: async ({ reviews, ...obj }, _, { dataSources }) => {
      return reviews || (await dataSources.api.getSeason(obj))['reviews']
    },
    // Gets all episodes of the season
    // @todo figure out better way to handle querying episodes
    episodes: async ({ showId, seasonNumber }, _, { dataSources }) => {
      const data = await dataSources.api.getSeason({ showId, seasonNumber })
      return data.episodes
    },
    // Gets a single episode of the season
    episode: async (obj, { episodeNumber }, { dataSources }) => {
      return await dataSources.api.getEpisode({ ...obj, episodeNumber })
    }
  },
  Episode: {
    title: ({ name }) => name, // make consistent with Movie
    images: async ({ images, ...obj }, _, { dataSources }) => {
      return images || (await dataSources.api.getEpisode(obj))['images']
    },
    videos: async ({ videos, ...obj }, { type }, { dataSources }) => {
      if (!videos) videos = (await dataSources.api.getEpisode(obj))['videos']
      if (!type) return videos.results
      return videos.results.filter(item => camelCase(item.type) === type)
    },
    cast: async ({ credits, ...obj }, { first }, { dataSources }) => {
      credits = credits || (await dataSources.api.getMovie(obj))['credits']
      return !first ? credits.cast : credits.cast.slice(0, first)
    },
    crew: async ({ crew, ...obj }, { departments }, { dataSources }) => {
      crew = crew || (await dataSources.api.getSeason(obj))['credits']
      if (!departments) return crew
      return crew.filter(item => {
        return departments.includes(camelCase(item.department))
      })
    }
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
