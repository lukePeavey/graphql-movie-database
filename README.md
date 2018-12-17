# GraphQL API for The Movie Database

A graphQL layer built on top of the TMDB REST API.

## Outline

- **configuration(): Configuration**

  Get the system wide configuration information

  [TMDB Endpoints](https://developers.themoviedb.org/3/configuration/get-api-configuration):

  - `/configuration/`

<br>

- **movies(filters, sortBy): [Movie]**

  Get movies based on various types of data such as average rating, genres, cast members, etc. Ideally, this will support all of the filtering and sorting options that are available on the discover/movie api.

  [TMDB Endpoints](https://developers.themoviedb.org/3/discover/movie-discover):

  - `discover/movie`

<br>

- **movie(id): Movie**

  Get details about a single movie by ID This query will support all of the additional fields that can be requested on this endpoint, such as credits, photos, reviews, etc.

  [TMDB Endpoints](https://developers.themoviedb.org/3/movies/get-movie-details):

  - `/movie/${id}`
  - `/movie/{movie_id}/credits`
  - `/movie/{movie_id}/images`
  - `/movie/{movie_id}/keywords`
  - `/movie/{movie_id}/reviews`

<br>

- **shows(filter, sortBy): [Show]**

  Get tv shows based on various types of data such as average rating, genres, cast members, etc. This would support all of the filtering/sorting oTMDBdpoints][1]
  endpoint

  [TMDB Endpoints](https://developers.themoviedb.org/3/discover/tv-discover):

  - `discover/tv`

<br>

- **show(id): Show**

  Get information about a single TV show by ID. This query will allow users to get additional info like season, and episodes as well.

  [TMDB-Endpoints](https://developers.themoviedb.org/3/tv/get-tv-details):

  - `/tv/${id}/`
  - `/tv/{id}/credits`
  - `/tv/{id}/images`
  - `/tv/{id}/keywords`
  - `/tv/{id}/reviews`
  - `/tv/{id}/season/{season_number}`
  - `/tv/{id}/season/{season_number}/episode/{episode_number}`

<br>

- **person(id): Person**

  Get details about a single person by ID.

  [TMDB endpoints](https://developers.themoviedb.org/3/people/get-person-details):

  - `/person/{person_id}`
  - `/person/{person_id}/combined_credits`
  - `/person/{person_id}/images`

<br>

- **search(query, page): [SearchResult]**

  A single search query that lets users search the entire database (multi-search), or search a specific object type. (Another option would be to have multiple queries such as searchMovies, etc).

  [API Endpoints](https://developers.themoviedb.org/3/search/search-companies):

  - `/search/multi`
  - `/search/movie`
  - `/search/tv`
  - `/search/person`
  - `/search/company`

<br>

[1]: https://developers.themoviedb.org/3/discover/movie-discover
[2]: https://developers.themoviedb.org/3/discover/tv-discovermovie-discover
[3]: https://developers.themoviedb.org/3/movies/get-movie-details
