# Architecture Changes - May 2026

## Changes Made

### 1. Workflow Module Integrated ✅
- Added `WorkflowModule` to `app.module.ts`
- Workflow engine now registered and will execute

### 2. BullMQ Background Jobs ✅
- Added `BullModule.forRootAsync()` with Redis config
- Global rate limiting enabled with `ThrottlerModule`
- Connection pool tuning added (max: 20, idleTimeout: 30s)

### 3. Event-Driven Architecture ✅
Created new `EventBusModule` at `apps/api/src/modules/events/`:

```
event-bus.module.ts          - Main module
event-bus.service.ts         - Event emitter with typed events
listeners/
  ├── fms-event.listener.ts   - FMS task automation
  ├── notification.listener.ts - Centralized notifications
  └── audit-event.listener.ts  - Auto audit logging
```

### 4. Event Types Available
```typescript
enum ERPEventType {
  ENQUIRY_CREATED = 'enquiry.created',
  ENQUIRY_SUBMITTED = 'enquiry.submitted',
  PURCHASE_QUOTE_CREATED = 'purchase.quote_created',
  RATE_UPDATED = 'rate.updated',
  RATE_LOCKED = 'rate.locked',
  PRICE_ANALYSIS_APPROVED = 'price_analysis.approved',
  FMS_TASK_CREATED = 'fms.task_created',
  FMS_TASK_DELAYED = 'fms.task_delayed',
  FMS_TASK_ESCALATED = 'fms.task_escalated',
  WORKFLOW_STARTED = 'workflow.started',
  // ... more
}
```

### 5. FMS Queue Processor ✅
Created `FmsProcessor` that handles:
- `create-tasks-from-enquiry` - Auto-create FMS tasks
- `process-delay-escalation` - Mark delayed + escalate
- `send-reminder` - Send task reminders

### 6. Sales Service Event Emission ✅
When enquiry status changes to SUBMITTED:
- Automatically emits `ENQUIRY_SUBMITTED` event
- Triggers FMS task creation automatically
- Triggers notifications automatically
- Creates audit log automatically

### 7. Security Enhancements ✅
- Helmet.js for security headers
- CORS properly configured
- Rate limiting (100 req/min)
- Connection pool tuning

---

## How to Use Events

### Emit an Event (any service)
```typescript
constructor(private eventBus: EventBusService) {}

async submitEnquiry(dto: CreateEnquiryDto, user: User) {
  // ... save enquiry
  this.eventBus.enquirySubmitted(
    user.companyId,
    user.id,
    enquiry.id,
    enquiry.enquiryNo
  );
}
```

### Listen for Events (automatic)
```typescript
@OnEvent(ERPEventType.ENQUIRY_SUBMITTED)
async handleEnquirySubmitted(event: ERPEvent) {
  // Automatically triggered when enquiry.submitted is emitted
}
```

---

## Background Jobs Flow

```
Sales Service
    │
    ▼
EventBus.emit(ENQUIRY_SUBMITTED)
    │
    ├──▶ FmsEventListener.handleEnquirySubmitted()
    │        │
    │        ▼
    │    FmsQueue.add('create-tasks-from-enquiry')
    │
    ├──▶ NotificationEventListener.handleEnquirySubmitted()
    │        │
    │        ▼
    │    NotificationQueue.add('enquiry-submitted')
    │
    └──▶ AuditEventListener.handleEnquirySubmitted()
             │
             ▼
         audit_logs table
```

---

## BullMQ Queues Registered

| Queue | Purpose | Jobs |
|-------|---------|------|
| `fms` | FMS task processing | create-tasks, process-delay, send-reminder |
| `notifications` | Email/WhatsApp/SMS | enquiry-submitted, fms-task-assigned, rate-locked |
| `workflow` | Workflow steps | notify-step, notify-completed, check-timeout |

---

## Rate Limiting Enabled

```typescript
// 100 requests per minute per IP
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 100,
}])
```

---

## Next Steps (TODO)

### P0 - Critical
- [x] Wire up FMS task creation when enquiry submitted ✅
- [ ] Add formula configuration table for rate calculations
- [ ] Fix optimistic locking on price_analysis table

### P1 - High
- [ ] Implement approval matrix auto-evaluation
- [ ] Add unique constraints: UNIQUE(company_id, code) on all masters
- [ ] Consistent soft delete across all entities

### P2 - Medium
- [ ] Add scheduler for cron jobs (SLA checks, reminders)
- [ ] Circuit breaker for external APIs
- [ ] Idempotency keys for critical operations

### P3 - Low
- [ ] Global search with MeiliSearch
- [ ] Webhook system for external integrations
- [ ] PostgreSQL Row Level Security

---

## Files Created/Modified

### Created
```
apps/api/src/modules/events/
├── event-bus.module.ts
├── event-bus.service.ts
└── listeners/
    ├── fms-event.listener.ts
    ├── notification-event.listener.ts
    └── audit-event.listener.ts

apps/api/src/modules/fms/processors/
└── fms.processor.ts

supabase-migrations/
├── 001_workflow_and_events.sql
└── README.md
```

### Modified
```
apps/api/src/app.module.ts          - Added WorkflowModule, EventBusModule, BullMQ, Throttler
apps/api/src/main.ts               - Added Helmet security
apps/api/src/modules/fms/fms.module.ts - Added BullQueue, FmsProcessor
apps/api/src/modules/sales/sales.module.ts - Added EventBusService export
apps/api/src/modules/sales/sales.service.ts - Emit events on status change
apps/api/package.json               - Added @nestjs/event-emitter, @nestjs/throttler, helmet
apps/api/.env                      - Added Redis and other configs
```

---

## Supabase Setup

### Connection
```
Host: aws-1-ap-southeast-1.pooler.supabase.com
Port: 6543 (Session Pooler)
Database: postgres
User: postgres.telztddxrafqlkrsbrcu
```

### Run Migration
```bash
psql "postgresql://postgres.telztddxrafqlkrsbrcu:Kriscel@123456789000@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" -f supabase-migrations/001_workflow_and_events.sql
```

Or copy-paste SQL from `supabase-migrations/001_workflow_and_events.sql` in Supabase SQL Editor.

---

## Running the System

```bash
# 1. Start Redis (for BullMQ) - REQUIRED
docker run -d -p 6379:6379 redis:7-alpine

# 2. Run Supabase migration (first time only)
# See supabase-migrations/README.md

# 3. Start API
cd apps/api && npm run dev

# 4. API runs at http://localhost:3001
# 5. Swagger docs at http://localhost:3001/api/docs
```

---

## Testing Events

```typescript
// In any controller/service
@Post()
async create(@CurrentUser() user: User) {
  this.eventBus.emit(ERPEventType.ENQUIRY_SUBMITTED, user.companyId, user.id, {
    enquiryId: 'xxx',
    enquiryNo: 'ENQ-2026-0001'
  });
  return result;
}
```

Console will show:
```
[FmsEventListener] Handling enquiry submitted: xxx
[FmsEventListener] FMS task creation queued for enquiry: xxx
[NotificationEventListener] Notification: Enquiry submitted
```
