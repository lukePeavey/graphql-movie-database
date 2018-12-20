# Examples

## Search Queries

### Multi-Search

```graphql
query multiSearch {
  search(query: "West") {
    results {
      ... on Movie {
        title
        id
      }
      ... on Show {
        title
        id
      }
    }
  }
}
```

### Search People

Search for a person by name and get the name, biography, and complete filmography

```graphql
query searchPeople {
  people(query: "Bryan Cranston") {
    results {
      name
      biography
      id
      filmography {
        cast {
          character
          media {
            title
            mediaType
          }
        }
      }
    }
  }
}
```

### Search TV Shows

This examples includes genres and cast in the query

```graphql
query searchShows {
  shows(query: "Better Call Saul") {
    results {
      title
      genres {
        name
        id
      }
      credits {
        cast {
          name
          character
        }
      }
    }
  }
}
```

### Search Movies

```graphql
query searchMovies {
  movies(query: "Last Tango") {
    results {
      title
      releaseDate
      posterPath
      id
    }
  }
}
```

### Search Companies

```graphql
query searchCompanies {
  companies(query: "DC Comics") {
    results {
      name
      id
    }
  }
}
```

### Show

Get information about the seasons and episodes of a show. This gets the title and season number of all seasons. It also gets the episodes for a single season.

```graphql
query getShow {
  Show(id: "60059") {
    title
    allSeasons {
      title
      seasonNumber
    }
    season(seasonNumber: 1) {
      episodes {
        title
        overview
        guestStars {
          name
        }
      }
    }
  }
}
```
