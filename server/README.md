## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Reference

**Base Path:** `/v1/api/story`  (Controller version: `1`)

- **GET:** `/api/story/top-stories`
  - **Description:** Returns paginated list of top stories.
  - **Query Parameters:** `page` (number, default: 0), `size` (number, default: 10, max: 100)

- **GET:** `/api/story/best-stories`
  - **Description:** Returns paginated list of best stories.
  - **Query Parameters:** `page` (number, default: 0), `size` (number, default: 10, max: 100)

- **GET:** `/api/story/new-stories`
  - **Description:** Returns paginated list of new stories.
  - **Query Parameters:** `page` (number, default: 0), `size` (number, default: 10, max: 100)

- **GET:** `/api/story/top-story-details/:id`
  - **Description:** Returns details for a specific top story by `id`.
  - **Route Parameters:** `id` (number)

- **GET:** `/api/story/best-story-details/:id`
  - **Description:** Returns details for a specific best story by `id`.
  - **Route Parameters:** `id` (number)

- **GET:** `/api/story/new-story-details/:id`
  - **Description:** Returns details for a specific new story by `id`.
  - **Route Parameters:** `id` (number)

Notes:
- Pagination query params are handled by the `SearchPaginationParams` decorator. It parses `page` and `size` and exposes `{ page, size, limit, offset }` to services.
- Invalid pagination values or sizes > 100 will return `400 Bad Request`.

Examples:

Fetch first page of top stories (10 items):

```bash
curl "http://localhost:3000/api/story/top-stories?page=0&size=10"
```

Fetch details for story with id 123:

```bash
curl "http://localhost:3000/api/story/top-story-details/123"
```

Bookmark APIs

- **Base Path:** `/api/bookmark` (Controller version: `1`)

- **POST:** `/api/bookmark`
  - **Description:** Add a story to bookmarks. Validates that the story exists by calling the Hacker News details API before saving.
  - **Body (JSON):** `{ "storyId": number }`
  - **Responses:**
    - `201`/`200`: saved bookmark object (`id`, `storyId`, `createdAt`)
    - `400`: Bad request (missing `HN_URL` or invalid payload)
    - `404`: Story not found

- **GET:** `/api/bookmark`
  - **Description:** Returns paginated list of bookmarked stories. Each item is a `StoryItem` (same as story list), with the `kids` property excluded.
  - **Query Parameters:** `page` (number, default: 0), `size` (number, default: 10, max: 100)

Examples:

Add a bookmark for story `123`:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"storyId":123}' \
  "http://localhost:3000/api/bookmark"
```

List bookmarks (first page):

```bash
curl "http://localhost:3000/api/bookmark?page=0&size=10"
```
