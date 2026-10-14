# ERP Setup Guide for Supabase

## Quick Setup (Run in Supabase SQL Editor)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://app.supabase.com
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Run the Seed Script
Copy the contents of this file:
```
C:\Users\Krisc\Desktop\git projects\ERP\supabase-migrations\supabase-seed.sql
```

Paste it into the SQL Editor and click **Run**

### Step 3: Verify Setup
The output should show:
- "Setup Complete!" status
- Table counts (Roles, Permissions, Users, etc.)
- User permissions table

---

## Update .env File

Edit `C:\Users\Krisc\Desktop\git projects\ERP\.env` with your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

---

## Update API Configuration

Make sure your `apps/api/src/main.ts` or `apps/api/src/app.module.ts` uses:
```typescript
DATABASE_URL from process.env.DATABASE_URL
```

---

## Restart the API

```powershell
cd C:\Users\Krisc\Desktop\git projects\ERP\apps\api
npm start
```

---

## Test Login

Go to http://localhost:3000 and login:

| Email | Password | Role |
|-------|----------|------|
| admin@erp.com | admin123 | Admin |
| neha@erp.com | admin123 | Sales Manager |
| rahul@erp.com | admin123 | Purchase Manager |
| amit@erp.com | admin123 | Sales User |

---

## Troubleshooting

### "Relation does not exist"
Make sure you ran the seed script in the correct database.

### "Password authentication failed"
Check your DATABASE_URL connection string.

### "Permission denied"
Make sure you're using the correct Supabase project.

### "Password hash invalid"
The seed script uses a pre-hashed password. If login fails, reset via API:

```bash
# Run with admin token
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

---

## If Login Still Fails

Create a new admin user directly:

```sql
-- Run in Supabase SQL Editor
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qUJr8N2H0xH8C2'
WHERE email = 'admin@erp.com';
```

This sets password to `admin123`.

---

## Next Steps

1. ✅ Database seeded
2. ⬜ Start API: `cd apps/api && npm start`
3. ⬜ Start Web: `cd apps/web && npm start`
4. ⬜ Login at http://localhost:3000
