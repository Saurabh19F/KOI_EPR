# ERP Quick Setup Script (Windows)

## One-Command Setup

Run this in PowerShell or Command Prompt from the ERP folder:

```powershell
# 1. Start Docker services
docker-compose up -d postgres redis

# 2. Wait for database to be ready
timeout /t 10

# 3. Run migration
psql "postgresql://postgres:postgres123@localhost:5432/erp" -f supabase-migrations/00000000000001_add_role_permissions_table.sql

# 4. Install API deps and seed
cd apps/api
npm install
npx ts-node -r tsconfig-paths/register src/database/seed-complete.ts

# 5. Start API (in background or new terminal)
npm run dev

# 6. Install Web deps (new terminal)
cd apps/web
npm install
npm run dev
```

## What Each Step Does

1. **docker-compose up** - Starts PostgreSQL and Redis containers
2. **Migration** - Creates role_permissions table and seeds permissions
3. **npm install** - Installs Node.js dependencies
4. **seed-complete.ts** - Seeds all roles, permissions, master data, demo users
5. **npm run dev** - Starts the application in development mode

## Access Points

| Service | URL |
|---------|-----|
| Web Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## First Login

1. Open http://localhost:3000
2. Email: **admin@erp.com**
3. Password: **admin123**

## Troubleshooting

### "docker: command not found"
Install Docker Desktop from https://docker.com

### "psql: command not found"
Install PostgreSQL from https://postgresql.org
Or use pgAdmin/DBeaver

### "npm: command not found"
Install Node.js from https://nodejs.org (v18+ recommended)

### Port already in use
```powershell
# Find what's using port 3000 or 3001
netstat -ano | findstr :3000
# Kill the process by PID
taskkill /PID <PID> /F
```

### Database connection refused
```powershell
# Check Docker is running
docker ps
# If not running, start Docker Desktop app
docker start erp-postgres
```

### Reset Everything
```powershell
# Stop everything
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v

# Start fresh
docker-compose up -d
```
