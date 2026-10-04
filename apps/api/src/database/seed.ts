import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: '.env' });

async function seed() {
  console.log('Starting KOI ERP seed...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  // Check if admin@koi-erp.com exists
  const existingAdmin = await dataSource.query(`SELECT COUNT(*) FROM users WHERE email = $1`, ['admin@koi-erp.com']);
  if (parseInt(existingAdmin[0].count) > 0) {
    console.log('KOI ERP seed already run, skipping.');
    await dataSource.destroy();
    return;
  }

  // Get or create the company
  let companyRows = await dataSource.query(`SELECT id FROM companies WHERE company_code = 'DEFAULT' LIMIT 1`);
  if (companyRows.length === 0) {
    companyRows = await dataSource.query(
      `INSERT INTO companies (company_code, display_name, status, is_active) VALUES ('DEFAULT', 'Default Company', 'active', true) RETURNING id`,
    );
  }
  const companyId = companyRows[0].id;
  const password = await bcrypt.hash('admin123', 10);

  // Helper: insert and return id
  async function upsertDept(code: string, name: string): Promise<string> {
    const existing = await dataSource.query(`SELECT department_id FROM departments WHERE department_code = $1`, [code]);
    if (existing.length > 0) return existing[0].department_id;
    const rows = await dataSource.query(
      `INSERT INTO departments (company_id, department_name, department_code, is_active) VALUES ($1, $2, $3, true) RETURNING department_id`,
      [companyId, name, code],
    );
    return rows[0].department_id;
  }

  async function upsertRole(code: string, name: string, level: number): Promise<string> {
    const existing = await dataSource.query(`SELECT role_id FROM roles WHERE role_code = $1`, [code]);
    if (existing.length > 0) return existing[0].role_id;
    const rows = await dataSource.query(
      `INSERT INTO roles (company_id, role_name, role_code, description, is_active, level) VALUES ($1, $2, $3, $4, true, $5) RETURNING role_id`,
      [companyId, name, code, name + ' role for KOI ERP', level],
    );
    return rows[0].role_id;
  }

  // ===== DEPARTMENTS =====
  const deptIds: Record<string, string> = {};
  const departments = [
    { code: 'SALES', name: 'Sales' },
    { code: 'PURCHASE', name: 'Purchase' },
    { code: 'COSTING', name: 'Costing / Rate Analysis' },
    { code: 'PRODUCTION', name: 'Production' },
    { code: 'INVENTORY', name: 'Inventory & Warehouse' },
    { code: 'FINANCE', name: 'Finance & Accounts' },
    { code: 'MIS', name: 'MIS & Reports' },
    { code: 'QUALITY', name: 'Quality Control' },
    { code: 'LOGISTICS', name: 'Logistics & Dispatch' },
    { code: 'HR', name: 'Human Resources' },
    { code: 'IT_ADMIN', name: 'IT & Administration' },
  ];

  for (const dept of departments) {
    deptIds[dept.code] = await upsertDept(dept.code, dept.name);
  }
  console.log('Departments:', departments.map(d => d.name).join(', '));

  // ===== ROLES =====
  const roleIds: Record<string, string> = {};
  const roles = [
    { code: 'ADMIN', name: 'Administrator', level: 1 },
    { code: 'MANAGEMENT', name: 'Management', level: 1 },
    { code: 'SALES_MANAGER', name: 'Sales Manager', level: 2 },
    { code: 'SALES_USER', name: 'Sales Executive', level: 3 },
    { code: 'PURCHASE_MANAGER', name: 'Purchase Manager', level: 2 },
    { code: 'PURCHASE_USER', name: 'Purchase Executive', level: 3 },
    { code: 'COSTING_MANAGER', name: 'Costing Manager', level: 2 },
    { code: 'COSTING_USER', name: 'Costing Executive', level: 3 },
    { code: 'INVENTORY_MANAGER', name: 'Inventory Manager', level: 2 },
    { code: 'PRODUCTION_MANAGER', name: 'Production Manager', level: 2 },
    { code: 'FINANCE_MANAGER', name: 'Finance Manager', level: 2 },
    { code: 'MIS', name: 'MIS Manager', level: 2 },
    { code: 'QUALITY_MANAGER', name: 'Quality Manager', level: 2 },
    { code: 'LOGISTICS_MANAGER', name: 'Logistics Manager', level: 2 },
    { code: 'HR_MANAGER', name: 'HR Manager', level: 2 },
    { code: 'CHIEF_ACCOUNTANT', name: 'Chief Accountant', level: 1 },
    { code: 'ACCOUNTANT', name: 'Accountant', level: 2 },
    { code: 'VIEWER', name: 'Viewer (Read Only)', level: 4 },
  ];

  for (const role of roles) {
    roleIds[role.code] = await upsertRole(role.code, role.name, role.level);
  }
  console.log('Roles:', roles.map(r => r.name).join(', '));

  // ===== USERS =====
  const users = [
    { email: 'admin@koi-erp.com', name: 'System Administrator', dept: null, role: 'ADMIN', isSuper: true },
    { email: 'neha@koi-erp.com', name: 'Neha Singh', dept: 'SALES', role: 'SALES_MANAGER', isSuper: false },
    { email: 'rahul@koi-erp.com', name: 'Rahul Kumar', dept: 'SALES', role: 'SALES_MANAGER', isSuper: false },
    { email: 'aisha@koi-erp.com', name: 'Aisha Khan', dept: 'SALES', role: 'SALES_MANAGER', isSuper: false },
    { email: 'vikram@koi-erp.com', name: 'Vikram Patel', dept: 'PURCHASE', role: 'PURCHASE_MANAGER', isSuper: false },
    { email: 'meera@koi-erp.com', name: 'Meera Desai', dept: 'PURCHASE', role: 'PURCHASE_MANAGER', isSuper: false },
    { email: 'arjun@koi-erp.com', name: 'Arjun Sharma', dept: 'PURCHASE', role: 'PURCHASE_MANAGER', isSuper: false },
    { email: 'priya@koi-erp.com', name: 'Priya Mehta', dept: 'MIS', role: 'MIS', isSuper: false },
    { email: 'kiran@koi-erp.com', name: 'Kiran Nair', dept: 'MIS', role: 'MIS', isSuper: false },
    { email: 'sunita@koi-erp.com', name: 'Sunita Rao', dept: 'FINANCE', role: 'FINANCE_MANAGER', isSuper: false },
    { email: 'ramesh@koi-erp.com', name: 'Ramesh Iyer', dept: 'INVENTORY', role: 'INVENTORY_MANAGER', isSuper: false },
    { email: 'amit@koi-erp.com', name: 'Amit Verma', dept: 'COSTING', role: 'COSTING_MANAGER', isSuper: false },
    { email: 'deepak@koi-erp.com', name: 'Deepak Gupta', dept: 'PRODUCTION', role: 'PRODUCTION_MANAGER', isSuper: false },
    { email: 'sanjay@koi-erp.com', name: 'Sanjay Joshi', dept: 'QUALITY', role: 'QUALITY_MANAGER', isSuper: false },
    { email: 'pooja@koi-erp.com', name: 'Pooja Reddy', dept: 'LOGISTICS', role: 'LOGISTICS_MANAGER', isSuper: false },
  ];

  const userIds: Record<string, string> = {};
  for (const user of users) {
    const deptId = user.dept ? deptIds[user.dept] : null;
    const rId = roleIds[user.role];
    const rows = await dataSource.query(
      `INSERT INTO users (company_id, department_id, email, password_hash, name, phone, is_active, is_super_admin, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING user_id`,
      [companyId, deptId, user.email, password, user.name, '+91 9876543210', user.isSuper, rId],
    );
    if (rows.length > 0) {
      userIds[user.email] = rows[0].user_id;
    }
  }
  console.log('Users:', users.length, 'users created');

  // Assign department heads
  const deptHeads: Record<string, string> = {
    SALES: 'neha@koi-erp.com',
    PURCHASE: 'vikram@koi-erp.com',
    COSTING: 'amit@koi-erp.com',
    PRODUCTION: 'deepak@koi-erp.com',
    INVENTORY: 'ramesh@koi-erp.com',
    FINANCE: 'sunita@koi-erp.com',
    MIS: 'priya@koi-erp.com',
    QUALITY: 'sanjay@koi-erp.com',
    LOGISTICS: 'pooja@koi-erp.com',
  };
  for (const [deptCode, email] of Object.entries(deptHeads)) {
    const uid = userIds[email];
    if (uid) {
      await dataSource.query(
        `UPDATE departments SET head_user_id = $1 WHERE department_code = $2`,
        [uid, deptCode],
      );
    }
  }
  console.log('Department heads assigned');

  console.log('\n  KOI ERP Users (all password: admin123):');
  console.log('  Admin:       admin@koi-erp.com');
  console.log('  Sales:       neha@, rahul@, aisha@koi-erp.com');
  console.log('  Purchase:    vikram@, meera@, arjun@koi-erp.com');
  console.log('  MIS:         priya@, kiran@koi-erp.com');
  console.log('  Finance:     sunita@koi-erp.com');
  console.log('  Inventory:   ramesh@koi-erp.com');
  console.log('  Costing:     amit@koi-erp.com');
  console.log('  Production:  deepak@koi-erp.com');
  console.log('  Quality:     sanjay@koi-erp.com');
  console.log('  Logistics:   pooja@koi-erp.com');

  await dataSource.destroy();
  console.log('\nKOI ERP seed completed!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
