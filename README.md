# devmonks-assessment
# Docker Setup Guide

## Overview
This project includes a complete Docker Compose setup that allows you to run the entire application (client, server, and database) without installing any local dependencies.

## Prerequisites
- Docker Desktop (or Docker + Docker Compose installed)
- No other dependencies need to be installed locally

## Quick Start

### First Time Setup
Clone the repository and navigate to the project root:

```bash
git clone <repository-url>
cd devmonks-assessment
```

### 1. Start the Application
From the project root directory, run:

```bash
docker-compose up -d
```

This command will:
- Build the client (Angular) image from `client/Dockerfile`
- Build the server (NestJS) image from `server/Dockerfile`
- Start a PostgreSQL database container
- Start the server container (waits for database to be ready)
- Start the client container (waits for server to be ready)
- Automatically install all npm dependencies inside containers
- Initialize the database

**No local installation needed!** 🎉

### 2. Access the Application
Once all containers are running (usually takes 1-3 minutes on first start):

- **Client (Angular)**: http://localhost:4200
- **Server (API)**: http://localhost:3000
- **Database (PostgreSQL)**: localhost:5432

### 3. Stop the Application
To stop all containers:

```bash
docker-compose down
```

To stop and remove all data (including database):

```bash
docker-compose down -v
```

## Development Workflow

### Running After Initial Setup
```bash
docker-compose up -d
```

### Rebuilding After Code Changes
```bash
docker-compose up -d --build
```

### Checking if Everything is Running
```bash
docker-compose ps
```

### Viewing Application Output
```bash
docker-compose logs -f
```

## Configuration

### Environment Variables
The `.env` file at the project root contains all environment variables. You can modify these values before running `docker-compose up`:

```env
APP_NAME=DEV_MONKS_ASSESSMENT
NODE_ENV=development
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=devmonk
DB_USERNAME=postgres
DB_PASSWORD=kingemon
DB_LOGGER=false
DB_SYNCHRONIZE=true
HN_URL=https://hacker-news.firebaseio.com
OPENAI_URL=https://api.openai.com/
OPENAI_API_KEY=your_api_key_here
GROK_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-nano
```

## Useful Commands

### Rebuild Images After Code Changes
If you make changes to the code and want to rebuild the images, use:

```bash
docker-compose up -d --build
```

**When to use `--build` flag:**
- After modifying code in `client/` or `server/` directories
- After installing new npm dependencies (`package.json` changes)
- After updating any configuration files
- To ensure the latest code changes are included in the containers

**Example workflow:**
```bash
# 1. Make code changes
# 2. Rebuild and restart containers
docker-compose up -d --build

# 3. View logs to verify everything works
docker-compose logs -f server
```

### View Container Logs
```bash
# View all containers logs
docker-compose logs -f

# View specific container logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres
```

### Access Database
To connect to the PostgreSQL database:

```bash
docker-compose exec postgres psql -U postgres -d devmonk
```

### Execute Commands in Container
```bash
# Run commands in the server container
docker-compose exec server npm run migration:run

# Run commands in the client container
docker-compose exec client npm run test
```

## Project Structure

- `client/` - Angular frontend application
  - `Dockerfile` - Multi-stage build for optimized Angular production image
  - `package.json` - Client dependencies

- `server/` - NestJS backend application
  - `Dockerfile` - Multi-stage build for optimized NestJS production image
  - `package.json` - Server dependencies

- `.env` - Environment configuration (used by docker-compose)

- `docker-compose.yml` - Docker Compose configuration

## Services

### PostgreSQL Database
- Image: `postgres:16-alpine`
- Container name: `devmonks-postgres`
- Port: `5432`
- Volumes: `postgres_data` (persisted data)
- Health check: Enabled

### NestJS Server
- Built from `./server/Dockerfile`
- Container name: `devmonks-server`
- Port: `3000`
- Depends on: PostgreSQL (waits for health check)
- Network: Connects to devmonks-network

### Angular Client
- Built from `./client/Dockerfile`
- Container name: `devmonks-client`
- Port: `4200`
- Depends on: Server
- Network: Connects to devmonks-network

## Networking

All services are connected via a custom bridge network `devmonks-network`, allowing them to communicate using service names as hostnames.

## Troubleshooting

### Port Already in Use
If port 3000, 4200, or 5432 is already in use, modify the port mappings in `.env` or `docker-compose.yml`:

```yaml
ports:
  - "8000:3000"  # Maps container port 3000 to host port 8000
```

### Database Connection Issues
Ensure PostgreSQL is healthy before the server starts:

```bash
docker-compose logs postgres
```

### Container Exits Immediately
Check the logs:

```bash
docker-compose logs server
docker-compose logs client
```

### Rebuild After Dependency Changes
If you modify `package.json` in either client or server, rebuild:

```bash
docker-compose up -d --build
```

## Key Features

✅ **Zero Local Dependencies** - Everything runs in containers  
✅ **Development Ready** - Hot reload and debugging support  
✅ **Production Optimized** - Multi-stage builds for smaller images  
✅ **Service Health Checks** - Database health check before server starts  
✅ **Persistent Database** - Data persists between container restarts  
✅ **Environment Configuration** - Easy to customize via .env file  
✅ **Networking** - Services communicate via container names  
