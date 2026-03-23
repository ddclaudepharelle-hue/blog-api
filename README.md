# blog-api

  A Node.js Express REST API for a blog with full CRUD operations for articles, backed by SQLite.

  ## Tech Stack

  - **Runtime**: Node.js 24
  - **Framework**: Express 5
  - **Database**: SQLite via `better-sqlite3` + Drizzle ORM
  - **Validation**: Zod + drizzle-zod
  - **Language**: TypeScript
  - **Package manager**: pnpm workspaces (monorepo)

  ## API Endpoints

  | Method | Endpoint | Description |
  |--------|----------|-------------|
  | GET | `/api/healthz` | Health check |
  | GET | `/api/articles` | List articles (supports `?page`, `?limit`, `?published` filters) |
  | POST | `/api/articles` | Create a new article |
  | GET | `/api/articles/:id` | Get article by ID |
  | PUT | `/api/articles/:id` | Update article (partial) |
  | DELETE | `/api/articles/:id` | Delete article |

  ## Article Schema

  ```json
  {
    "id": 1,
    "title": "My Post",
    "content": "Post body...",
    "author": "Alice",
    "slug": "my-post",
    "published": false,
    "createdAt": "2026-03-22T19:00:00.000Z",
    "updatedAt": "2026-03-22T19:00:00.000Z"
  }
  ```

  ## Quick Start

  ```bash
  pnpm install
  pnpm --filter @workspace/api-server run dev
  ```

  The server starts on the port specified by the `PORT` environment variable.
  