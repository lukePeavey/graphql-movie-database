# GraphQL API for The Movie Database

A compete GraphQL API for the Movie Database.

**Table of Contents:**

- [GraphQL API for The Movie Database](#graphql-api-for-the-movie-database)
  - [API Reference](#api-reference)
    - [search()](#search)
    - [movies()](#movies)
    - [shows()](#shows)
    - [People()](#people)
    - [Movie()](#movie)
    - [Show()](#show)
    - [Person()](#person)
    - [configuration()](#configuration)

## API Reference

### search()

Search the database for objects matching the query string. This uses the `/search/multi` endpoint by default. Search results will include Movies, Shows, and People.

<details>

<summary>More details</summary>

<br>

```graphql
search(query: String!, page: Int = 1): SearchResponse
```

</details>

### movies()

Find movies using a search query or various filtering and sorting options. This query encompasses multiple api endpoints.

<details>

<summary>More Details</summary>
<br>

There are three ways to use the `movies()` query:

1. **Search Movies**

```graphql
movies(query: String!, page: Int = 1): MovieList
```

This will search the database to find movies matching the given string.

Example:

```graphql
movies(query: "Last Tango") {
  results {
    title
    id
  }
}
```

2. **Discover Movies**

```graphql
movies(discover: DiscoverMovieOptions, page: Int = 1): MovieList
```

The `discover` argument provides a wide range of filtering and sorting options. It supports all of the options that are available on the TMDB [`discover/movie`][discover/movie] endpoint.

Example:

```graphql
movies(discover: { sortBy: RELEASE_DATE_DESC, withCast: "8447" }) {
  results {
    title
    id
  }
}
```

1. **Movie Lists**

```graphql
movies(list: MoviesListName = POPULAR, page: Int = 1): MovieList
```

The `list` argument provides support for additional `movie` endpoints that return lists of movies.

- [now_playing][movie/now-playing]
- [upcoming][movie/upcoming]
- [latest][movie/latest]
- [popular][movie/popular]
- [top_rated][movie/top-rated]

Example:

```graphql
movies(filter: NOW_PLAYING) {
  results {
    title
    id
    popularity
  }
}
```

</details>

### shows()

Find TV shows — either using a search query or a variety of filters and sorting options.

<details>

<summary>More details</summary>
<br>

There are three ways to use the `shows` query:

1. **Search Shows**

```graphql
shows(query: String!, page: Int = 1): ShowList
```

When a `query` argument is provided, this will use the `search/tv` API to find shows matching the given query string.

2. **Discover shows**

```graphql
shows(discover: DiscoverTVOptions, page: Int = 1): ShowList
```

The `discover` argument provides a wide range of filtering and sorting options. It supports all options that are available in the [`discover/tv`][discover/tv] API.

Example

```graphql
shows(
  discover: {
    sortBy: firstAirDate_DESC
    voteAverage_GTE: 8.5
    voteCount_GTE: 25
  }
) {
  results {
    title
    firstAirDate
    voteCount
    voteAverage
  }
}
```

3. **TV Show Lists**

```graphql
shows(list: ShowsListName, page: Int = 1): ShowList
```

The `list` argument provides support for the `tv` endpoints that return specific lists of TV shows. The following values are supported:

- [on_air][tv/on-air]
- [airing_today][tv/airing-today]
- [popular][tv/popular]
- [top_rated][tv/top-rated]
- [latest][tv/latest]

```graphql
shows(list: TOP_RATED) {
  results {
    title
    id
  }
}
```

</details>

### People()

Search the database for people

TODO: Add documentation

### Movie()

Get details about a single movie by ID

TODO: Add documentation

### Show()

Get details about a single TV Show by ID

TODO: Add documentation

### Person()

Get details about a single person by ID

TODO: Add documentation

### configuration()

Get TMDB system configuration

TODO: Add documentation

[discover/movie]: (https://developers.themoviedb.org/3/discover/movie-discover)
[discover/tv]: (https://developers.themoviedb.org/3/discover/movie-tv)
[movie/latest]: (https://developers.themoviedb.org/3/movies/get-latest-movie)
[movie/now-playing]: (https://developers.themoviedb.org/3/movies/get-now-playing)
[movie/popular]: (https://developers.themoviedb.org/3/movies/get-popular-movies)
[movie/top-rated]: (https://developers.themoviedb.org/3/movies/get-top-rated-movies)
[movie/upcoming]: (https://developers.themoviedb.org/3/movies/get-upcoming)
[tv/latest]: (https://developers.themoviedb.org/3/tv/get-latest-tv)
[tv/airing-today]: (https://developers.themoviedb.org/3/tv/get-tv-airing-today)
[tv/on-air]: (https://developers.themoviedb.org/3/tv/get-tv-on-the-air)
[tv/popular]: (https://developers.themoviedb.org/3/tv/get-popular-tv-shows)
[tv/top-rated]: (https://developers.themoviedb.org/3/tv/get-top-rated-tv)
