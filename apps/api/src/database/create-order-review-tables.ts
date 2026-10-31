import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from '../common/typeorm/snake-naming.strategy';
import {
  OrderReviewDraft,
  OrderFinalSubmission,
  OrderReviewLog,
  OrderItemTask,
  OrderTaskEmailLog,
  OrderItemCancellation,
  OrderClosure,
} from '../modules/order-review/entities/order-review.entity';

dotenv.config({ path: '.env' });

async function migrate() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: true,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [
      OrderReviewDraft,
      OrderFinalSubmission,
      OrderReviewLog,
      OrderItemTask,
      OrderTaskEmailLog,
      OrderItemCancellation,
      OrderClosure,
    ],
  });

  await ds.initialize();
  console.log('Connected to database...');

  // Drop tables if they exist (from previous migration attempt with wrong enum names)
  const tables = [
    'order_review_drafts',
    'order_final_submissions',
    'order_review_logs',
    'order_item_tasks',
    'order_task_email_logs',
    'order_item_cancellations',
    'order_closures',
  ];
  for (const t of tables) {
    await ds.query(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
  }

  // Drop old enum types from previous migration
  for (const e of ['review_draft_status', 'task_status_enum', 'task_email_status', 'order_closure_status']) {
    await ds.query(`DROP TYPE IF EXISTS "${e}" CASCADE;`);
  }

  console.log('Old tables/enums dropped. Synchronizing schema...');

  // Let TypeORM create the tables with correct column names, types, and enum names
  await ds.synchronize();

  console.log('All order-review tables created successfully via TypeORM sync!');
  await ds.destroy();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
