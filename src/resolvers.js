const camelCase = require('lodash/camelCase')
const upperCase = require('lodash/upperCase')
const transforms = require('./utils/transforms')

/**
 * Creates the resolvers for fields on the `Movie`, `Show`, `Season` and
 * `Episode` objects. These objects all share a common set of fields. This
 * function takes a typename and returns the map of resolvers for the fields on
 * that object type.
 *
 * Creates resolvers for the following fields:
 * - cast
 * - crew
 * - videos
 * - posters
 * - backdrops
 * - reviews
 * - genres
 *
 * @param {"Movie" | "Show" | "Season" | "Episode"} typename
 * @return {*} resolver map
 */
function createMediaObjectResolvers(typename) {
  /**
   * A helper function for fetching "detail fields" (aka fields that require a
   * single-item details request (ie `GET /movie/{id}`). Depending on the type
   * of query, the data for this field may or may not already be included in the
   * response object. If its not, this will make the appropriate API call to get
   * the item.
   * @param {string} field
   * @param {any} parent
   * @param {Object} dataSources
   */
  async function _getDetailField(field, parent, dataSources) {
    const { movieDatabaseV3 } = dataSources
    if (parent[field]) return parent[field]
    const data = await movieDatabaseV3[`get${typename}`](parent)
    return data[field]
  }

  const mediaObjectResolvers = {
    cast: async (parent, args, { dataSources }) => {
      const credits = await _getDetailField('credits', parent, dataSources)
      if (!args.first) return credits.cast
      return credits.cast.filter(item => item.order < args.first)
    },
    crew: async (parent, args, { dataSources }) => {
      const credits = await _getDetailField('credits', parent, dataSources)
      if (!args.departments) return credits.crew
      return credits.crew.filter(item => {
        return args.departments.includes(camelCase(item.department))
      })
    },
    videos: async (parent, args, { dataSources }) => {
      const videos = await _getDetailField('videos', parent, dataSources)
      if (!args.type) return videos.results
      return videos.results.filter(item => camelCase(item.type) === args.type)
    },
    posters: async (parent, _, { dataSources }) => {
      const images = await _getDetailField('images', parent, dataSources)
      return images.posters
    },
    backdrops: async (parent, _, { dataSources }) => {
      const images = await _getDetailField('images', parent, dataSources)
      return images.backdrops
    }
  }
  // The following resolvers only apply to `Show` and `Movie` objects
  if (/Show|Movie/.test(typename)) {
    mediaObjectResolvers.reviews = async (parent, _, { dataSources }) => {
      return await _getDetailField('reviews', parent, dataSources)
    }
    // Convert the `genres_ids` property to `genres`. This makes the genres
    // field available on all Movie and Show objects, even when returned from
    // search/list queries. NOTE: This only requires a single API request to
    // get the complete list of genres for each media type (movie/tv). Once the
    // genre list has been cached, its just a matter of mapping the ids to
    // genres.
    mediaObjectResolvers.genres = async (parent, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      if (parent.genres) return parent.genres
      return movieDatabaseV3.getGenresById({
        mediaType: typename,
        ids: parent.genreIds
      })
    }

    mediaObjectResolvers.accountStates = async ({ id }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const mediaType = transforms.toMediaType(typename)
      return movieDatabaseV3.getAccountStates({ mediaType, id })
    }
  }
  return mediaObjectResolvers
}

const resolvers = {
  Query: {
    // --------------------------------------------------
    // Single Item Queries
    // --------------------------------------------------
    person: (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.getPerson(args)
    },
    movie: (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.getMovie(args)
    },
    show: (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.getShow(args)
    },
    season: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return { showId: args.showId, ...(await movieDatabaseV3.getSeason(args)) }
    },
    episode: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return { ...args, ...(await movieDatabaseV3.getEpisode(args)) }
    },
    list: async (_parent, { id, ...args }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      return movieDatabaseV4.getList({ id, ...args })
    },
    configuration: (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.getConfiguration()
    },
    myAccount: async (_, args) => args,
    myLists: async (_parent, { accountId }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      return movieDatabaseV4.myLists({ accountId })
    },
    // --------------------------------------------------
    //  Plural Queries
    // --------------------------------------------------
    people: (_, args = {}, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.search('/person', args)
    },
    movies: (_, args = {}, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const { query, list, discover, ...rest } = args
      // The movies query has three mutually exclusive arguments:
      // A. If a `query` argument was provided, use search API to find movies
      if (query) return movieDatabaseV3.search('/movie', { query, ...rest })
      // B. If the `list` argument was provided, get movies from the specified
      // movie list endpoint
      if (list) return movieDatabaseV3.movies(list, rest)
      // C. Otherwise, default to the discover API
      return movieDatabaseV3.discover('/movie', { ...discover, ...rest })
    },
    shows: (_, args = {}, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const { query, list, discover, ...rest } = args
      if (query) return movieDatabaseV3.search('/tv', { query, ...rest })
      if (list) return movieDatabaseV3.shows(list, rest)
      return movieDatabaseV3.discover('/tv', { ...discover, ...rest })
    },
    companies: (_, args = {}, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.search('/company', args)
    },
    search: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.search('/multi', args)
    }
  },
  // --------------------------------------------------
  //  Mutations
  // --------------------------------------------------
  Mutation: {
    createList: (_, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      return movieDatabaseV4.createList(args)
    },
    updateList: async (_, { id, ...args }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const response = await movieDatabaseV4.updateList({ id, ...args })
      // Return the list `id` with the API response, this allows the
      // `ListMutationResponse` resolver to fetch the updated list if requested
      return { id, ...response }
    },
    deleteList: (_, { id }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      return movieDatabaseV4.deleteList({ id })
    },
    addListItems: async (_, { id, items }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const data = await movieDatabaseV4.addListItems({ id, items })
      // Return the list `id` with the API response, this allows the
      // `ListItemsMutationResponse` resolver to fetch the updated list if
      // requested
      return { id, ...data }
    },
    removeListItems: async (_, { id, items }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const data = await movieDatabaseV4.removeListItems({ id, items })

      return { id, ...data }
    },
    clearListItems: (_, { id }, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      return movieDatabaseV4.clearListItems({ id })
    },
    // TODO: DRY
    addToWatchlist: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const response = await movieDatabaseV3.addToWatchlist(args)
      // the `args` are passed down with the response as they are needed by
      // field resolvers on `WatchlistMutationResponse`
      return { ...response, ...args }
    },
    // TODO: DRY
    addToFavorites: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const response = await movieDatabaseV3.addToFavorites(args)
      // the `args` are passed down with the response as they are needed by
      // field resolvers on `FavoriteMutationResponse`
      return { ...response, ...args }
    },
    rateMovie: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const mediaType = 'MOVIE'
      const response = await movieDatabaseV3.updateRating({
        mediaType,
        ...args
      })
      return { ...response, mediaType, ...args }
    },
    rateShow: async (_, args, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const mediaType = 'TV'
      const response = await movieDatabaseV3.updateRating({
        mediaType,
        ...args
      })
      return { ...response, mediaType, ...args }
    }
  },
  // --------------------------------------------------
  // Object Resolvers
  // --------------------------------------------------
  Account: {
    profile: async ({ accountId }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3.getAccount(accountId)
    },
    lists: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      return movieDatabaseV4.myLists({ accountId, ...args })
    },
    watchlist: parent => parent,
    favorites: parent => parent,
    ratings: parent => parent
  },
  Profile: {
    // Accounts for different formats of the avatar property
    gravatar: ({ avatar, gravatarHash }) => {
      const hash = avatar ? avatar.gravatar.hash : gravatarHash
      return hash ? { hash } : null
    }
  },
  // TODO: DRY
  Watchlist: {
    movies: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const mediaType = 'MOVIE'
      return movieDatabaseV4.myWatchlist({ accountId, mediaType, ...args })
    },
    shows: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const mediaType = 'TV'
      return movieDatabaseV4.myWatchlist({ accountId, mediaType, ...args })
    }
  },
  // TODO: DRY
  Favorites: {
    movies: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const mediaType = 'MOVIE'
      return movieDatabaseV4.myFavorites({ accountId, mediaType, ...args })
    },
    shows: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const mediaType = 'TV'
      return movieDatabaseV4.myFavorites({ accountId, mediaType, ...args })
    }
  },
  Ratings: {
    movies: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const mediaType = 'MOVIE'
      return movieDatabaseV4.myRatings({ accountId, mediaType, ...args })
    },
    shows: async ({ accountId }, args, { dataSources }) => {
      const { movieDatabaseV4 } = dataSources
      const mediaType = 'TV'
      return movieDatabaseV4.myRatings({ accountId, mediaType, ...args })
    }
  },
  AccountStates: {
    rating: ({ rated }) => (rated ? rated.value : null)
  },
  List: {
    numberOfItems: ({ totalResults, numberOfItems }) => {
      return Number.isFinite(numberOfItems) ? numberOfItems : totalResults
    }
  },
  SearchResult: {
    __resolveType: ({ mediaType }) => transforms.toTypename(mediaType)
  },
  ImageConfiguration: {
    // Use HTTPS for the default base URL
    baseUrl: ({ secureBaseUrl }) => secureBaseUrl
  },
  Movie: {
    ...createMediaObjectResolvers('Movie'),
    mediaType: () => 'MOVIE'
  },
  Show: {
    ...createMediaObjectResolvers('Show'),
    mediaType: () => 'TV',
    title: ({ name }) => name, // make consistent with Movie
    originalTitle: ({ originalName }) => originalName,
    releaseDate: ({ firstAirDate }) => firstAirDate,
    // Get all seasons of a show
    seasons: async ({ seasons, id }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      seasons = seasons || (await movieDatabaseV3.getShow({ id }))['seasons']
      // Pass down the `showId` prop to the `season` field. This allows it to
      // make an API request to `/tv/${showId}/season/${seasonNumber}` to get
      // episodes when the `episodes` field is present in the query.
      return seasons.map(season => ({ showId: id, ...season }))
    },
    // Gets a single season of the show
    season: async ({ id: showId }, { seasonNumber }, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const season = await movieDatabaseV3.getSeason({ showId, seasonNumber })
      // Pass down the `showId` prop to the `season` field. This allows it to
      // make an API request to `/tv/${showId}/season/${seasonNumber}` to get
      // episodes when the `episodes` field is present in the query.
      return { showId, ...season }
    }
  },
  Season: {
    ...createMediaObjectResolvers('Season'),
    title: ({ name }) => name, // make consistent with Movie
    // Gets all episodes of the season
    episodes: async ({ showId, seasonNumber }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const data = await movieDatabaseV3.getSeason({ showId, seasonNumber })
      return data.episodes
    },
    // Gets a single episode of the season
    episode: async (parent, { episodeNumber }, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      const { showId, seasonNumber } = parent
      return await movieDatabaseV3.getEpisode({
        showId,
        seasonNumber,
        episodeNumber
      })
    }
  },
  Episode: {
    ...createMediaObjectResolvers('Episode'),
    title: ({ name }) => name // make consistent with Movie
  },
  Person: {
    knownFor: async ({ name, id, knownFor }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      // @TODO: find a better solution for the following issue:
      // The "known_for" property is only included in the results from the
      //  (`/search/person`) endpoint; its not included in a details request
      // for single person (this might be a bug?). As a workaround, when this
      // field is requested in a singular `person` query, we make a second API
      // request to the search endpoint using the name/id.
      if (knownFor) return knownFor
      const { results } = await movieDatabaseV3.search('/person', {
        query: name
      })
      const match = results.find(person => String(person.id) === String(id))
      return match ? match.knownFor : []
    },
    knownForDepartment: async ({ id, ...parent }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      if (parent.knownForDepartment) return parent.knownForDepartment
      return (await movieDatabaseV3.getPerson({ id }))['knownForDepartment']
    },
    // `filmography` is the person's combined movie and tv credits
    filmography: async ({ combinedCredits, id }, _, { dataSources }) => {
      const { movieDatabaseV3 } = dataSources
      // If the response doesn't already include `combined_credits`, make an
      // API request to `/person/${id}` to fetch it
      if (!combinedCredits) {
        const data = await movieDatabaseV3.getPerson({ id })
        combinedCredits = data.combinedCredits
      }
      return {
        cast: combinedCredits.cast.map(transforms.filmographyCredit),
        crew: combinedCredits.crew.map(transforms.filmographyCredit)
      }
    }
  },
  Media: {
    __resolveType: ({ mediaType }) => transforms.toTypename(mediaType)
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
  },
  MutationResponse: {
    __resolveType: parent => {
      if (parent.list && parent.results) return 'ListItemsMutationResponse'
      if (parent.list) return 'ListMutationResponse'
    }
  },
  ListMutationResponse: {
    success: ({ success }) => !!success,
    // Gets the `List` that was modified by the mutation (if successful)
    list: async ({ id, success }, args, { dataSources }) => {
      if (id && success) {
        // Don't attempt to get the List if the mutation failed.
        return dataSources.movieDatabaseV4.getList({ id, ...args })
      }
    }
  },
  ListItemsMutationResponse: {
    success: ({ success }) => !!success,
    // Gets the `List` that was modified by the mutation.
    list: async (parent, args, { dataSources }) => {
      const { id, success } = parent
      if (id && success !== false) {
        return dataSources.movieDatabaseV4.getList({ id, ...args })
      }
    },
    // Array of `ListItemResults`
    results: ({ results = [] }) => {
      return results.map(({ mediaType, ...rest }) => {
        return { ...rest, mediaType: upperCase(mediaType) }
      })
    }
  },
  // TODO: DRY
  WatchlistMutationResponse: {
    success: ({ success }) => !!success,
    // Gets the updated watchlist
    watchlist: parent => (parent.success ? parent : null),
    // Gets the updated Media object that was added/removed by mutation
    media: (parent, _, { dataSources }) => {
      if (!parent.success) return null
      const { movieDatabaseV3 } = dataSources
      const { mediaType, id } = parent.item
      return movieDatabaseV3[`get${transforms.toTypename(mediaType)}`]({ id })
    }
  },
  // TODO: DRY
  FavoriteMutationResponse: {
    success: ({ success }) => !!success,
    // Gets the updated favorites list
    favorites: parent => (parent.success ? parent : null),
    // Gets the Media object that was added/removed by mutation
    media: (parent, _, { dataSources }) => {
      if (!parent.success) return null
      const { movieDatabaseV3 } = dataSources
      const { mediaType, id } = parent.item
      return movieDatabaseV3[`get${transforms.toTypename(mediaType)}}`]({ id })
    }
  },
  RatingMutationResponse: {
    success: ({ success }) => !!success,
    media: ({ success, mediaType, id }, _, { dataSources }) => {
      if (!success) return null
      const { movieDatabaseV3 } = dataSources
      return movieDatabaseV3[`get${transforms.toTypename(mediaType)}`]({ id })
    }
  },
  ListItemResult: {
    id: ({ mediaId }) => mediaId
  }
}

module.exports = resolvers
