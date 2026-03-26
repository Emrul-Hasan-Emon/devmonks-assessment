# devmonks-assessment
# Docker Setup Guide

## Overview
This project includes a complete Docker Compose setup that allows you to run the entire application (client, server, and database) without installing any local dependencies.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Configuration](#configuration)
- [Useful Commands](#useful-commands)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

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
docker compose up -d
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
docker compose down
```

To stop and remove all data (including database):

```bash
docker compose down -v
```

## Development Workflow

### Running After Initial Setup
```bash
docker compose up -d
```

### Rebuilding After Code Changes
```bash
docker compose up -d --build
```

### Checking if Everything is Running
```bash
docker compose ps
```

### Viewing Application Output
```bash
docker compose logs -f
```

## Configuration

### Environment Variables - Server
The `.env` file at the project root contains all environment variables. You can modify these values before running `docker compose up`:

#### Populate the ENV Keys with required information
```env
APP_NAME=DEV_MONKS_ASSESSMENT
NODE_ENV=development
PORT=3000
DB_HOST=
DB_PORT=5432
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
DB_LOGGER=false
DB_SYNCHRONIZE=true
HN_URL=https://hacker-news.firebaseio.com
MAXIMUM_TOP_STORIES=100 // It will be used for Top, Best & New Stories. DOn't get confused with the name
OPENAI_URL=https://api.openai.com/
OPENAI_API_KEY=your_api_key_here
GROK_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-nano // model name
```

## Useful Commands

### Build and Run Commands

#### Build Docker Images
```bash
docker compose build
```

#### Start All Containers
```bash
docker compose up -d
```

#### Build and Start (After Code Changes)
```bash
docker compose up -d --build
```

#### Stop All Containers (Keep Data)
```bash
docker compose down
```

#### Stop All Containers and Remove Data
```bash
docker compose down -v
```

#### Restart All Containers
```bash
docker compose restart
```

### View Container Status and Logs

#### Check All Containers Status
```bash
docker compose ps
```

#### View All Containers Logs (Live)
```bash
docker compose logs -f
```

#### View Specific Container Logs (Live)
```bash
# Server logs
docker compose logs -f server

# Client logs
docker compose logs -f client

# Database logs
docker compose logs -f postgres
```

### Test API Endpoints

#### Health Check
```bash
curl http://localhost:3000
```

#### Test Server is Running
```bash
curl -i http://localhost:3000
```

### Database Commands

#### Access PostgreSQL Database (dynamic user/db)
Use variables for user and database name so this works for your environment:

```bash
DB_USER=postgres DB_NAME=devmonk
# or override to your values
# DB_USER=myuser DB_NAME=mydb

docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME"
```

If you prefer reading from your `.env` file:

```bash
source .env
docker compose exec postgres psql -U "$DB_USERNAME" -d "$DB_DATABASE"
```

#### Run Database Migrations
```bash
docker compose exec server npm run migration:run
```

#### Reset Database
```bash
docker compose exec server npm run migration:reset
```

### Execute Commands in Containers

#### Run Commands in Server Container
```bash
# Run migrations
docker compose exec server npm run migration:run

# Run tests
docker compose exec server npm test

# Run linter
docker compose exec server npm run lint
```

#### Run Commands in Client Container
```bash
# Run tests
docker compose exec client npm test

# Run linter
docker compose exec client npm run lint
```

### Full Workflow Example

```bash
# 1. Build images for the first time
docker compose build

# 2. Start all containers
docker compose up -d

# 3. Wait for services to initialize (usually 10-30 seconds)
sleep 10

# 4. Check if everything is running
docker compose ps

# 5. View logs to verify no errors
docker compose logs

# 6. Test the server is responding
curl http://localhost:3000

# 7. Access the application
# Client: http://localhost:4200
# Server API: http://localhost:3000
```

### Rebuild After Code Changes

When you make changes to the code:

```bash
# Method 1: Rebuild and restart (recommended)
docker compose down
docker compose up -d --build

# Method 2: Quick rebuild and restart
docker compose up -d --build

# View logs to verify
docker compose logs -f server
```


## Project Structure

- `client/` - Angular frontend application
  - `Dockerfile` - Multi-stage build for optimized Angular production image
  - `package.json` - Client dependencies

- `server/` - NestJS backend application
  - `Dockerfile` - Multi-stage build for optimized NestJS production image
  - `package.json` - Server dependencies

- `.env` - Environment configuration (used by `docker compose`)

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
docker compose logs postgres
```

### Container Exits Immediately
Check the logs:

```bash
docker compose logs server
docker compose logs client
```

### Rebuild After Dependency Changes
If you modify `package.json` in either client or server, rebuild:

```bash
docker compose up -d --build
```

## Key Features

✅ **Zero Local Dependencies** - Everything runs in containers  
✅ **Development Ready** - Hot reload and debugging support  
✅ **Production Optimized** - Multi-stage builds for smaller images  
✅ **Service Health Checks** - Database health check before server starts  
✅ **Persistent Database** - Data persists between container restarts  
✅ **Environment Configuration** - Easy to customize via .env file  
✅ **Networking** - Services communicate via container names