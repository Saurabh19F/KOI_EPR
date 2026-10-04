# Supabase Database Setup

## Connection Details

```
Host: aws-1-ap-southeast-1.pooler.supabase.com
Port: 6543 (Session Pooler)
Database: postgres
User: postgres.telztddxrafqlkrsbrcu
Password: Kriscel@123456789000
```

## Running Migrations

Run these in order in Supabase SQL Editor:

### Step 1: 001_workflow_and_events.sql
Tables: workflow_definitions, workflow_steps, workflow_instances, workflow_transitions

### Step 2: 002_fms_tables.sql
Tables: fms_step_directory, fms_tasks, email_queue, fms_mail_queue, fms_escalations
Also seeds default FMS steps.

---

## Migration Files

| File | Purpose |
|------|---------|
| `001_workflow_and_events.sql` | Workflow tables (already exist in your DB) |
| `002_fms_tables.sql` | FMS tables + email queue + seed data |

---

## Default FMS Steps Seeded

| Step Code | Name | SLA | Role |
|-----------|------|-----|------|
| ACT01 | Purchase Rate Collection | 48h | PURCHASE |
| ACT02 | Rate Verification | 24h | COSTING |
| ACT03 | Manager Approval | 24h | MANAGEMENT |

---

## Verify Tables

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- workflow_definitions
- workflow_steps
- workflow_instances
- workflow_transitions
- fms_step_directory
- fms_tasks
- email_queue
- fms_mail_queue
- fms_escalations

---

## Redis Setup (For BullMQ)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```
