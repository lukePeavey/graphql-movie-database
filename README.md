# GraphQL API for The Movie Database

A graphQL layer built on top of the TMDB REST API.

## Queries

1. [search](#search)
2. [movies](#movies)
3. [shows](#shows)
4. [people](#people)
5. [companies](#companies)
6. [Movie](#Movie)
7. [Show](#Show)
8. [Person](#Show)
9. [configuration](#configuration)

### search()

This query searches all database models simultaneously, via the `/search/multi` endpoint. The results will be a list of mixed types that can include Movie | Show | Person | Company objects. If you want to search for a specific type of object, the multi-item query for that object, ie `movies` | `people`

**Signature:**

```graphql
search(query: String!, page: Int = 1): [SearchResponse]
```

**Response:**

```graphql
type SearchResponse {
  meta: QueryMeta!
  results: [Result]!
}

union Result = Movie | Show | Person
```

### movies()

Find movies — using a search query or a variety of filters and sorting options. If the `query` argument is provided, this will use the `/search/movie` endpoint, and the filter and sortBy options will be ignored.

If query is not provided, this will use the `/discover/movie` endpoint using the provided filters and sortBy options. It supports all of the filter parameters and sort_by options that are available on the `/discover/movie/` endpoint.

**Signature:**

```graphql
movies(
  query: String
  filter: MediaFilter
  sortBy: MediaSortBy = popularity_DESC
  page: Int = 1
): [MovieList]
```

**Response:**

```graphql
type MovieList {
  meta: QueryMeta!
  results: [Movie]!
}
```

### shows()

Find TV shows — either using a search query or a variety of filters and sorting options. If the `query` argument is provided, this will use the `/search/tv` endpoint, and the filter and sortBy options will be ignored.

If query is not provided, this will use the `/discover/tv` endpoint using the provided filters and sortBy options. It supports all of the filter parameters and sort_by options that are available on the `/discover/tv/` endpoint. See schema for complete documentation

**Signature:**

```graphql
shows(
  query: String
  filter: MediaFilter
  sortBy: MediaSortBy = popularity_DESC
  page: Int = 1
): [ShowList]
```

**Response:**

```graphql
type ShowList {
  meta: QueryMeta!
  results: [Show]!
}
```

### people()

Search the database for people that match a given search query.

**Signature:**

```graphql
people(query: String! page: Int = 1): PersonList
```

**Response:**

```graphql
type PersonList {
  meta: QueryMeta!
  results: [Person]!
}
```

### Movie()

Get detailed information about a specific movie.

**Signature:**

```graphql
Movie(id: ID!): Movie
```

**Response:**

```graphql
type Movie implements Media {
  backdropPath: String
  budget: Int!
  genres: [Genre]
  genreIds: [Int]!
  homepage: String
  id: ID!
  mediaType: String!
  originalLanguage: String!
  originalTitle: String!
  overview: String
  popularity: Float!
  posterPath: String
  productionCompanies: [Company]!
  productionCountries: [Country]!
  releaseDate: String!
  revenue: Int!
  runtime: Int
  status: String!
  tagline: String
  title: String!
  voteAverage: Float!
  voteCount: Int!
  credits: Credits!
}
```

### Show()

Get detailed information about a specific TV show.

You can use this query to get any of the information that can be requested on the `/tv/${id}` endpoint, including seasons, episodes, cast, etc.

Currently, the `Show` object has two fields, `allSeasons` and `season(seasonNumber).` Getting the episodes for all seasons at once requires an API request for each season. So this makes it possible to get episodes for a single season

**Signature:**

```graphql
Show(id: ID!): Movie
```

Response :

```graphql
type Show implements Media @cacheControl(maxAge: 10000) {
  backdropPath: String
  episodeRunTime: [Int]!
  genres: [Genre]
  genreIds: [Int]!
  homepage: String
  id: ID!
  inProduction: Boolean!
  lastAirDate: String!
  mediaType: String!
  numberOfEpisodes: Int!
  numberOfSeasons: Int!
  originalLanguage: String!
  originalTitle: String!
  originCountry: [String]!
  overview: String!
  popularity: Float!
  posterPath: String!
  productionCompanies: [Company]!
  allSeasons: [Season]!
  season(seasonNumber: Int!): Season
  status: String!
  title: String!
  voteAverage: Float!
  voteCount: Int!
  credits: Credits!
}
```

### Person()

Get details information about a specific person.

**Signature:**

```graphql
Person(id: ID!): Person
```

**Response:**

```graphql
type Person {
  alsoKnownAs: [String]
  biography: String
  birthday: String!
  deathday: String
  gender: Int!
  homepage: String
  id: ID!
  knownForDepartment: String
  mediaType: String!
  name: String!
  placeOfBirth: String
  popularity: Float!
  profilePath: String
  knownFor: [Media]!
  filmography: Filmography!
}
```

### Configuration()

Todo
