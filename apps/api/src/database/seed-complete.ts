/**
 * Complete Seed Script for ERP System
 * Run with: npx ts-node -r tsconfig-paths/register src/database/seed-complete.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/erp',
  synchronize: false,
  logging: true,
});

async function seed() {
  console.log('🚀 Starting ERP seed process...\n');

  await dataSource.initialize();
  console.log('✅ Database connected\n');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // ========== 1. SEED ROLES ==========
    console.log('📦 Seeding roles...');

    const roles = [
      { roleCode: 'ADMIN', roleName: 'Administrator', level: 1, description: 'Full system access' },
      { roleCode: 'MANAGEMENT', roleName: 'Management', level: 2, description: 'Management level access' },
      { roleCode: 'SALES_MANAGER', roleName: 'Sales Manager', level: 3, description: 'Sales management' },
      { roleCode: 'SALES_USER', roleName: 'Sales User', level: 4, description: 'Sales team member' },
      { roleCode: 'PURCHASE_MANAGER', roleName: 'Purchase Manager', level: 3, description: 'Purchase management' },
      { roleCode: 'PURCHASE_USER', roleName: 'Purchase User', level: 4, description: 'Purchase team member' },
      { roleCode: 'COSTING_MANAGER', roleName: 'Costing Manager', level: 3, description: 'Costing management' },
      { roleCode: 'COSTING_USER', roleName: 'Costing User', level: 4, description: 'Costing team member' },
      { roleCode: 'MIS_USER', roleName: 'MIS User', level: 4, description: 'MIS and reports' },
      { roleCode: 'FINANCE_USER', roleName: 'Finance User', level: 4, description: 'Finance access' },
      { roleCode: 'DESIGNER', roleName: 'Designer', level: 4, description: 'Artwork and label design' },
      { roleCode: 'VIEWER', roleName: 'Viewer', level: 10, description: 'Read-only access' },
    ];

    for (const role of roles) {
      await queryRunner.query(`
        INSERT INTO roles (role_id, role_code, role_name, description, level, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
        ON CONFLICT (role_code) DO UPDATE SET
          role_name = EXCLUDED.role_name,
          description = EXCLUDED.description,
          level = EXCLUDED.level,
          is_active = true
      `, [role.roleCode, role.roleName, role.description, role.level]);
    }
    console.log('✅ Roles seeded\n');

    // ========== 2. SEED PERMISSIONS ==========
    console.log('📦 Seeding permissions...');

    const permissions = [
      // Dashboard
      { code: 'DASHBOARD_VIEW', name: 'View Dashboard', module: 'dashboard', action: 'view' },

      // Masters
      { code: 'MASTERS_VIEW', name: 'View Masters', module: 'masters', action: 'view' },
      { code: 'MASTERS_CREATE', name: 'Create Masters', module: 'masters', action: 'create' },
      { code: 'MASTERS_EDIT', name: 'Edit Masters', module: 'masters', action: 'edit' },
      { code: 'MASTERS_DELETE', name: 'Delete Masters', module: 'masters', action: 'delete' },

      // Products
      { code: 'PRODUCTS_VIEW', name: 'View Products', module: 'products', action: 'view' },
      { code: 'PRODUCTS_CREATE', name: 'Create Products', module: 'products', action: 'create' },
      { code: 'PRODUCTS_EDIT', name: 'Edit Products', module: 'products', action: 'edit' },
      { code: 'PRODUCTS_DELETE', name: 'Delete Products', module: 'products', action: 'delete' },
      { code: 'PRODUCTS_REVIEW', name: 'Review Products', module: 'products', action: 'review' },

      // Customers
      { code: 'CUSTOMERS_VIEW', name: 'View Customers', module: 'customers', action: 'view' },
      { code: 'CUSTOMERS_CREATE', name: 'Create Customers', module: 'customers', action: 'create' },
      { code: 'CUSTOMERS_EDIT', name: 'Edit Customers', module: 'customers', action: 'edit' },
      { code: 'CUSTOMERS_DELETE', name: 'Delete Customers', module: 'customers', action: 'delete' },

      // Vendors
      { code: 'VENDORS_VIEW', name: 'View Vendors', module: 'vendors', action: 'view' },
      { code: 'VENDORS_CREATE', name: 'Create Vendors', module: 'vendors', action: 'create' },
      { code: 'VENDORS_EDIT', name: 'Edit Vendors', module: 'vendors', action: 'edit' },
      { code: 'VENDORS_DELETE', name: 'Delete Vendors', module: 'vendors', action: 'delete' },

      // Sales
      { code: 'SALES_VIEW', name: 'View Sales', module: 'sales', action: 'view' },
      { code: 'SALES_CREATE', name: 'Create Sales', module: 'sales', action: 'create' },
      { code: 'SALES_EDIT', name: 'Edit Sales', module: 'sales', action: 'edit' },
      { code: 'SALES_DELETE', name: 'Delete Sales', module: 'sales', action: 'delete' },
      { code: 'SALES_APPROVE', name: 'Approve Sales', module: 'sales', action: 'approve' },

      // Purchase
      { code: 'PURCHASE_VIEW', name: 'View Purchase', module: 'purchase', action: 'view' },
      { code: 'PURCHASE_CREATE', name: 'Create Purchase', module: 'purchase', action: 'create' },
      { code: 'PURCHASE_EDIT', name: 'Edit Purchase', module: 'purchase', action: 'edit' },
      { code: 'PURCHASE_DELETE', name: 'Delete Purchase', module: 'purchase', action: 'delete' },
      { code: 'PURCHASE_APPROVE', name: 'Approve Purchase', module: 'purchase', action: 'approve' },

      // Rate/Price Analysis
      { code: 'RATE_VIEW', name: 'View Rate Analysis', module: 'rate', action: 'view' },
      { code: 'RATE_CREATE', name: 'Create Rate Analysis', module: 'rate', action: 'create' },
      { code: 'RATE_EDIT', name: 'Edit Rate Analysis', module: 'rate', action: 'edit' },
      { code: 'RATE_DELETE', name: 'Delete Rate Analysis', module: 'rate', action: 'delete' },
      { code: 'RATE_APPROVE', name: 'Approve Rate', module: 'rate', action: 'approve' },
      { code: 'RATE_LOCK', name: 'Lock Rate', module: 'rate', action: 'lock' },

      // FMS
      { code: 'FMS_VIEW', name: 'View FMS', module: 'fms', action: 'view' },
      { code: 'FMS_CREATE', name: 'Create FMS', module: 'fms', action: 'create' },
      { code: 'FMS_EDIT', name: 'Edit FMS', module: 'fms', action: 'edit' },
      { code: 'FMS_ASSIGN', name: 'Assign FMS', module: 'fms', action: 'assign' },

      // Reports
      { code: 'REPORTS_VIEW', name: 'View Reports', module: 'reports', action: 'view' },
      { code: 'REPORTS_EXPORT', name: 'Export Reports', module: 'reports', action: 'export' },

      // Admin
      { code: 'ADMIN_USERS', name: 'Manage Users', module: 'admin', action: 'users' },
      { code: 'ADMIN_ROLES', name: 'Manage Roles', module: 'admin', action: 'roles' },
      { code: 'ADMIN_SETTINGS', name: 'System Settings', module: 'admin', action: 'settings' },

      // Labels
      { code: 'LABELS_VIEW', name: 'View Labels', module: 'labels', action: 'view' },
      { code: 'LABELS_CREATE', name: 'Create Labels', module: 'labels', action: 'create' },
      { code: 'LABELS_EDIT', name: 'Edit Labels', module: 'labels', action: 'edit' },
    ];

    for (const perm of permissions) {
      await queryRunner.query(`
        INSERT INTO permissions (permission_id, permission_code, permission_name, module_name, action, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (permission_code) DO UPDATE SET
          permission_name = EXCLUDED.permission_name,
          module_name = EXCLUDED.module_name,
          action = EXCLUDED.action
      `, [perm.code, perm.name, perm.module, perm.action]);
    }
    console.log('✅ Permissions seeded\n');

    // ========== 3. SEED ROLE_PERMISSIONS ==========
    console.log('📦 Assigning permissions to roles...');

    // Get role IDs
    const adminRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'ADMIN'`);
    const managementRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'MANAGEMENT'`);
    const salesManagerRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'SALES_MANAGER'`);
    const salesUserRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'SALES_USER'`);
    const purchaseManagerRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'PURCHASE_MANAGER'`);
    const purchaseUserRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'PURCHASE_USER'`);
    const costingManagerRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'COSTING_MANAGER'`);
    const costingUserRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'COSTING_USER'`);
    const misRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'MIS_USER'`);
    const viewerRole = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = 'VIEWER'`);

    const rolePermissions: Record<string, string[]> = {
      'ADMIN': permissions.map(p => p.code), // All permissions
      'MANAGEMENT': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
        'SALES_VIEW', 'SALES_APPROVE', 'PURCHASE_VIEW', 'PURCHASE_APPROVE',
        'RATE_VIEW', 'RATE_APPROVE', 'FMS_VIEW', 'REPORTS_VIEW', 'REPORTS_EXPORT',
      ],
      'SALES_MANAGER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
        'REPORTS_VIEW', 'REPORTS_EXPORT',
      ],
      'SALES_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT',
        'REPORTS_VIEW',
      ],
      'PURCHASE_MANAGER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
        'LABELS_VIEW', 'LABELS_CREATE', 'LABELS_EDIT',
        'REPORTS_VIEW', 'REPORTS_EXPORT',
      ],
      'PURCHASE_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT',
        'LABELS_VIEW', 'LABELS_CREATE', 'LABELS_EDIT',
        'REPORTS_VIEW',
      ],
      'COSTING_MANAGER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
        'SALES_VIEW', 'PURCHASE_VIEW',
        'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
        'REPORTS_VIEW', 'REPORTS_EXPORT',
      ],
      'COSTING_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'VENDORS_VIEW',
        'SALES_VIEW', 'PURCHASE_VIEW',
        'RATE_VIEW', 'RATE_CREATE', 'RATE_EDIT',
        'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT',
        'REPORTS_VIEW',
      ],
      'MIS_USER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
        'MASTERS_CREATE', 'MASTERS_EDIT',
        'SALES_VIEW', 'SALES_CREATE', 'SALES_EDIT', 'SALES_APPROVE',
        'PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT', 'PURCHASE_APPROVE',
        'FMS_VIEW', 'FMS_CREATE', 'FMS_EDIT', 'FMS_ASSIGN',
        'REPORTS_VIEW', 'REPORTS_EXPORT',
      ],
      'VIEWER': [
        'DASHBOARD_VIEW', 'MASTERS_VIEW', 'PRODUCTS_VIEW', 'CUSTOMERS_VIEW', 'VENDORS_VIEW',
        'SALES_VIEW', 'PURCHASE_VIEW',
        'FMS_VIEW',
      ],
    };

    for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
      const roleResult = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = $1`, [roleCode]);
      if (!roleResult[0]) continue;
      const roleId = roleResult[0].role_id;

      for (const permCode of permCodes) {
        const permResult = await queryRunner.query(`SELECT permission_id FROM permissions WHERE permission_code = $1`, [permCode]);
        if (!permResult[0]) continue;
        const permissionId = permResult[0].permission_id;

        await queryRunner.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [roleId, permissionId]);
      }
    }
    console.log('✅ Role permissions assigned\n');

    // ========== 4. SEED MASTER DATA ==========
    console.log('📦 Seeding master data...');

    // Product Categories
    const categories = [
      { code: 'BRD', name: 'Biscuits & Bakery' },
      { code: 'KRI', name: 'Chocolates & Confectionery' },
      { code: 'SNA', name: 'Snacks & Savories' },
      { code: 'BVR', name: 'Beverages' },
      { code: 'DRY', name: 'Dry Fruits' },
      { code: 'FRZ', name: 'Frozen Foods' },
    ];

    for (const cat of categories) {
      await queryRunner.query(`
        INSERT INTO product_categories (category_id, category_code, category_name, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
        ON CONFLICT (category_code) DO UPDATE SET
          category_name = EXCLUDED.category_name,
          is_active = true
      `, [cat.code, cat.name]);
    }
    console.log('  ✅ Product Categories');

    // Segments
    const segments = [
      { code: 'SS', name: 'Small Size' },
      { code: 'BB', name: 'Big Box' },
      { code: 'RB', name: 'Regular' },
      { code: 'FF', name: 'Family Pack' },
    ];

    for (const seg of segments) {
      await queryRunner.query(`
        INSERT INTO segments (segment_id, segment_code, segment_name, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
        ON CONFLICT (segment_code) DO UPDATE SET
          segment_name = EXCLUDED.segment_name,
          is_active = true
      `, [seg.code, seg.name]);
    }
    console.log('  ✅ Segments');

    // Component Groups
    const groups = [
      { code: 'GRP', name: 'General' },
      { code: 'ORG', name: 'Organic' },
      { code: 'STD', name: 'Standard' },
      { code: 'PRM', name: 'Premium' },
    ];

    for (const grp of groups) {
      await queryRunner.query(`
        INSERT INTO component_groups (group_id, group_code, group_name, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
        ON CONFLICT (group_code) DO UPDATE SET
          group_name = EXCLUDED.group_name,
          is_active = true
      `, [grp.code, grp.name]);
    }
    console.log('  ✅ Component Groups');

    // Brands
    const brands = [
      { name: 'Parle', country: 'India' },
      { name: 'Britannia', country: 'India' },
      { name: 'Cadbury', country: 'UK' },
      { name: 'Nestle', country: 'Switzerland' },
      { name: 'Ferrero', country: 'Italy' },
      { name: 'Mars', country: 'USA' },
      { name: 'PepsiCo', country: 'USA' },
      { name: 'Haldiram', country: 'India' },
      { name: 'Lays', country: 'USA' },
      { name: 'Doritos', country: 'USA' },
    ];

    for (const brand of brands) {
      const brandCode = brand.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const description = `Brand from ${brand.country}`;
      const existing = await queryRunner.query(
        `SELECT brand_id FROM brands WHERE brand_code = $1`,
        [brandCode]
      );
      if (existing && existing.length > 0) {
        await queryRunner.query(`
          UPDATE brands 
          SET brand_name = $1, description = $2, is_active = true, updated_at = NOW() 
          WHERE brand_code = $3
        `, [brand.name, description, brandCode]);
      } else {
        await queryRunner.query(`
          INSERT INTO brands (brand_id, brand_name, brand_code, description, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
        `, [brand.name, brandCode, description]);
      }
    }
    console.log('  ✅ Brands');

    // UOMs
    const uoms = [
      { name: 'Pieces', shortCode: 'PCS' },
      { name: 'Kilograms', shortCode: 'KG' },
      { name: 'Grams', shortCode: 'GM' },
      { name: 'Liters', shortCode: 'LTR' },
      { name: 'Milliliters', shortCode: 'ML' },
      { name: 'Cartons', shortCode: 'CTN' },
      { name: 'Boxes', shortCode: 'BOX' },
      { name: 'Packets', shortCode: 'PKT' },
    ];

    for (const uom of uoms) {
      const existing = await queryRunner.query(
        `SELECT uom_id FROM uom_master WHERE uom_code = $1`,
        [uom.shortCode]
      );
      if (existing && existing.length > 0) {
        await queryRunner.query(`
          UPDATE uom_master 
          SET uom_name = $1, is_active = true, updated_at = NOW() 
          WHERE uom_code = $2
        `, [uom.name, uom.shortCode]);
      } else {
        await queryRunner.query(`
          INSERT INTO uom_master (uom_id, uom_name, uom_code, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
        `, [uom.name, uom.shortCode]);
      }
    }
    console.log('  ✅ Units of Measure');

    // GST Rates
    const gstRates = [
      { percent: 0, name: 'Exempt' },
      { percent: 5, name: 'GST 5%' },
      { percent: 12, name: 'GST 12%' },
      { percent: 18, name: 'GST 18%' },
      { percent: 28, name: 'GST 28%' },
    ];

    for (const gst of gstRates) {
      const gstCode = `GST${gst.percent}`;
      const existing = await queryRunner.query(
        `SELECT gst_rate_id FROM gst_rates WHERE gst_code = $1`,
        [gstCode]
      );
      if (existing && existing.length > 0) {
        await queryRunner.query(`
          UPDATE gst_rates 
          SET gst_name = $1, gst_percent = $2, is_active = true, updated_at = NOW() 
          WHERE gst_code = $3
        `, [gst.name, gst.percent, gstCode]);
      } else {
        await queryRunner.query(`
          INSERT INTO gst_rates (gst_rate_id, gst_name, gst_percent, gst_code, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
        `, [gst.name, gst.percent, gstCode]);
      }
    }
    console.log('  ✅ GST Rates');

    // Countries
    const countries = [
      { code: 'IN', name: 'India' },
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'SG', name: 'Singapore' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'AU', name: 'Australia' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
    ];

    for (const country of countries) {
      const existing = await queryRunner.query(
        `SELECT id FROM countries WHERE code = $1`,
        [country.code]
      );
      if (existing && existing.length > 0) {
        await queryRunner.query(`
          UPDATE countries 
          SET name = $1, is_active = true 
          WHERE code = $2
        `, [country.name, country.code]);
      } else {
        await queryRunner.query(`
          INSERT INTO countries (id, code, name, phone_code, currency_code, is_active, created_at)
          VALUES (gen_random_uuid(), $1, $2, NULL, NULL, true, NOW())
        `, [country.code, country.name]);
      }
    }
    console.log('  ✅ Countries');

    // Currencies
    const currencies = [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    ];

    for (const curr of currencies) {
      const existing = await queryRunner.query(
        `SELECT id FROM currencies WHERE code = $1`,
        [curr.code]
      );
      if (existing && existing.length > 0) {
        await queryRunner.query(`
          UPDATE currencies 
          SET name = $1, symbol = $2, is_active = true 
          WHERE code = $3
        `, [curr.name, curr.symbol, curr.code]);
      } else {
        await queryRunner.query(`
          INSERT INTO currencies (id, code, name, symbol, is_active, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
        `, [curr.code, curr.name, curr.symbol]);
      }
    }
    console.log('  ✅ Currencies');

    // Currency Rates (base rates)
    // Table columns: rate_id, currency_code, currency_name, rate, rate_date, source, is_active
    const currencyRates = [
      { currency: 'USD', currencyName: 'US Dollar', rate: 83.50 },
      { currency: 'GBP', currencyName: 'British Pound', rate: 105.25 },
      { currency: 'EUR', currencyName: 'Euro', rate: 90.75 },
      { currency: 'AED', currencyName: 'UAE Dirham', rate: 22.75 },
      { currency: 'SGD', currencyName: 'Singapore Dollar', rate: 62.00 },
      { currency: 'AUD', currencyName: 'Australian Dollar', rate: 55.50 },
    ];

    for (const rate of currencyRates) {
      // No unique constraint on currency_code — use SELECT-then-INSERT/UPDATE
      const existingRate = await queryRunner.query(
        `SELECT rate_id FROM currency_rate_master WHERE currency_code = $1`,
        [rate.currency]
      );
      if (existingRate.length > 0) {
        await queryRunner.query(
          `UPDATE currency_rate_master SET currency_name = $1, rate = $2, rate_date = CURRENT_DATE, is_active = true WHERE currency_code = $3`,
          [rate.currencyName, rate.rate, rate.currency]
        );
      } else {
        await queryRunner.query(
          `INSERT INTO currency_rate_master (rate_id, currency_code, currency_name, rate, rate_date, source, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_DATE, 'SEED', true, NOW(), NOW())`,
          [rate.currency, rate.currencyName, rate.rate]
        );
      }
    }
    console.log('  ✅ Currency Rates');

    // Zones
    // Table columns: id, code, name, region, description, is_active
    const zones = [
      { code: 'USA', name: 'USA & Canada', region: 'Americas' },
      { code: 'UK', name: 'United Kingdom', region: 'Europe' },
      { code: 'EU', name: 'European Union', region: 'Europe' },
      { code: 'DOM', name: 'Domestic', region: 'India' },
      { code: 'ME', name: 'Middle East', region: 'Middle East' },
      { code: 'APAC', name: 'Asia Pacific', region: 'Asia' },
    ];

    for (const zone of zones) {
      const existing = await queryRunner.query(`SELECT id FROM zones WHERE code = $1`, [zone.code]);
      if (existing.length > 0) {
        await queryRunner.query(`
          UPDATE zones SET name = $1, region = $2, is_active = true WHERE code = $3
        `, [zone.name, zone.region, zone.code]);
      } else {
        await queryRunner.query(`
          INSERT INTO zones (id, code, name, region, is_active, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
        `, [zone.code, zone.name, zone.region]);
      }
    }
    console.log('  ✅ Product Zones');

    // Locations
    // Table columns: id, code, name, type, city, state, country_id, is_active
    const locations = [
      { code: 'DEL', name: 'Delhi NCR', city: 'Delhi', state: 'Delhi' },
      { code: 'MUM', name: 'Mumbai', city: 'Mumbai', state: 'Maharashtra' },
      { code: 'BLR', name: 'Bangalore', city: 'Bangalore', state: 'Karnataka' },
      { code: 'CHE', name: 'Chennai', city: 'Chennai', state: 'Tamil Nadu' },
      { code: 'KOL', name: 'Kolkata', city: 'Kolkata', state: 'West Bengal' },
      { code: 'HYD', name: 'Hyderabad', city: 'Hyderabad', state: 'Telangana' },
      { code: 'PUN', name: 'Pune', city: 'Pune', state: 'Maharashtra' },
      { code: 'AHM', name: 'Ahmedabad', city: 'Ahmedabad', state: 'Gujarat' },
    ];

    for (const loc of locations) {
      const existing = await queryRunner.query(`SELECT id FROM locations WHERE code = $1`, [loc.code]);
      if (existing.length > 0) {
        await queryRunner.query(`
          UPDATE locations SET name = $1, city = $2, state = $3, is_active = true WHERE code = $4
        `, [loc.name, loc.city, loc.state, loc.code]);
      } else {
        await queryRunner.query(`
          INSERT INTO locations (id, code, name, type, city, state, is_active, created_at)
          VALUES (gen_random_uuid(), $1, $2, 'WAREHOUSE', $3, $4, true, NOW())
        `, [loc.code, loc.name, loc.city, loc.state]);
      }
    }
    console.log('  ✅ Locations');

    // Haulage Charges
    // Table columns: haulage_id, location, rate_per_cbm, description, is_active
    const haulage = [
      { location: 'Delhi', rateCbm: 3700 },
      { location: 'Mumbai', rateCbm: 1700 },
      { location: 'Chennai', rateCbm: 1900 },
      { location: 'Kolkata', rateCbm: 2400 },
    ];

    for (const h of haulage) {
      const existing = await queryRunner.query(`SELECT haulage_id FROM haulage_master WHERE location = $1`, [h.location]);
      if (existing.length > 0) {
        await queryRunner.query(`
          UPDATE haulage_master SET rate_per_cbm = $1, is_active = true WHERE location = $2
        `, [h.rateCbm, h.location]);
      } else {
        await queryRunner.query(`
          INSERT INTO haulage_master (haulage_id, location, rate_per_cbm, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
        `, [h.location, h.rateCbm]);
      }
    }
    console.log('  ✅ Haulage Charges');

    // Payment Terms
    // Table columns: id, code, name, days, description, is_active
    const paymentTerms = [
      { code: 'IMM', name: 'Immediate', days: 0 },
      { code: 'NET15', name: 'Net 15', days: 15 },
      { code: 'NET30', name: 'Net 30', days: 30 },
      { code: 'NET45', name: 'Net 45', days: 45 },
      { code: 'NET60', name: 'Net 60', days: 60 },
      { code: 'NET90', name: 'Net 90', days: 90 },
      { code: 'ADV', name: 'Advance', days: 0 },
      { code: 'ADV50', name: '50% Advance, 50% on Delivery', days: 0 },
    ];

    for (const pt of paymentTerms) {
      const existing = await queryRunner.query(`SELECT id FROM payment_terms WHERE code = $1`, [pt.code]);
      if (existing.length > 0) {
        await queryRunner.query(`
          UPDATE payment_terms SET name = $1, days = $2, is_active = true WHERE code = $3
        `, [pt.name, pt.days, pt.code]);
      } else {
        await queryRunner.query(`
          INSERT INTO payment_terms (id, code, name, days, is_active, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
        `, [pt.code, pt.name, pt.days]);
      }
    }
    console.log('  ✅ Payment Terms');

    // Ports
    // Table columns: id, code, name, type, city, state, country_id, is_active
    const ports = [
      { code: 'INJNP', name: 'JNPT', type: 'SEA', city: 'Mumbai', state: 'Maharashtra' },
      { code: 'INMUN', name: 'Mundra', type: 'SEA', city: 'Mundra', state: 'Gujarat' },
      { code: 'INMAA', name: 'Chennai', type: 'SEA', city: 'Chennai', state: 'Tamil Nadu' },
      { code: 'INCCU', name: 'Kolkata', type: 'SEA', city: 'Kolkata', state: 'West Bengal' },
      { code: 'INNSV', name: 'Nhava Sheva', type: 'SEA', city: 'Mumbai', state: 'Maharashtra' },
      { code: 'USLAX', name: 'Los Angeles', type: 'SEA', city: 'Los Angeles', state: 'California' },
      { code: 'GBFXT', name: 'Felixstowe', type: 'SEA', city: 'Felixstowe', state: 'Suffolk' },
      { code: 'AEDXB', name: 'Dubai', type: 'SEA', city: 'Dubai', state: 'Dubai' },
    ];

    for (const port of ports) {
      const existing = await queryRunner.query(`SELECT id FROM ports WHERE code = $1`, [port.code]);
      if (existing.length > 0) {
        await queryRunner.query(`
          UPDATE ports SET name = $1, type = $2, city = $3, state = $4, is_active = true WHERE code = $5
        `, [port.name, port.type, port.city, port.state, port.code]);
      } else {
        await queryRunner.query(`
          INSERT INTO ports (id, code, name, type, city, state, is_active, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW())
        `, [port.code, port.name, port.type, port.city, port.state]);
      }
    }
    console.log('  ✅ Ports\n');

    // ========== 5. SEED DEMO USERS ==========
    console.log('📦 Seeding demo users...');

    const hashedPassword = await bcrypt.hash('admin123', 12);

    const demoUsers = [
      { email: 'admin@erp.com', name: 'Admin User', role: 'ADMIN', userCode: 'ADM' },
      // Sales
      { email: 'neha@erp.com', name: 'Neha', role: 'SALES_MANAGER', userCode: 'NEH' },
      { email: 'hitesh@erp.com', name: 'Hitesh', role: 'SALES_USER', userCode: 'HIT' },
      { email: 'kirti@erp.com', name: 'Kirti Chaudhary', role: 'SALES_USER', userCode: 'KIR' },
      { email: 'pritesh@erp.com', name: 'Pritesh', role: 'SALES_USER', userCode: 'PRT' },
      { email: 'somya@erp.com', name: 'Somya', role: 'SALES_USER', userCode: 'SOM' },
      { email: 'pc@erp.com', name: 'PC', role: 'SALES_USER', userCode: 'PC' },
      // Purchase
      { email: 'amit@erp.com', name: 'Amit', role: 'PURCHASE_MANAGER', userCode: 'AMT' },
      { email: 'sunil@erp.com', name: 'Sunil', role: 'PURCHASE_USER', userCode: 'SUN' },
      { email: 'rakhi@erp.com', name: 'Rakhi', role: 'PURCHASE_USER', userCode: 'RAK' },
      { email: 'amitsharma@erp.com', name: 'Amit Sharma', role: 'PURCHASE_USER', userCode: 'ASH' },
      { email: 'kapil@erp.com', name: 'Kapil', role: 'PURCHASE_USER', userCode: 'KAP' },
      // Costing
      { email: 'nipur@erp.com', name: 'Nipur', role: 'COSTING_MANAGER', userCode: 'NIP' },
      // MIS
      { email: 'mis@erp.com', name: 'MIS User', role: 'MIS_USER', userCode: 'MIS' },
      { email: 'jatin@erp.com', name: 'Jatin', role: 'ADMIN', userCode: 'JAT' },
    ];

    // Delete old dummy users that are not in the new list to keep database clean
    const allowedEmails = demoUsers.map(u => u.email);
    await queryRunner.query(`
      DELETE FROM users 
      WHERE email NOT IN (${allowedEmails.map((_, i) => `$${i + 1}`).join(', ')})
    `, allowedEmails);

    for (const user of demoUsers) {
      // Get role ID
      const roleResult = await queryRunner.query(`SELECT role_id FROM roles WHERE role_code = $1`, [user.role]);
      const roleId = roleResult[0]?.role_id;

      await queryRunner.query(`
        INSERT INTO users (user_id, email, password_hash, name, user_code, role_id, is_active, is_super_admin, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, $6, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          user_code = EXCLUDED.user_code,
          role_id = COALESCE(EXCLUDED.role_id, users.role_id),
          is_active = true
      `, [user.email, hashedPassword, user.name, user.userCode, roleId, user.role === 'ADMIN']);
    }
    console.log('✅ Demo users seeded\n');

    // ========== 6. SEED SAMPLE CUSTOMERS ==========
    console.log('📦 Seeding sample customers...');

    const customers = [
      { name: 'ABC Imports LLC', buyerCode: 'USA-000001', zone: 'USA', country: 'US' },
      { name: 'UK Distributors Ltd', buyerCode: 'UK-000001', zone: 'UK', country: 'GB' },
      { name: 'Gulf Trading Co', buyerCode: 'ME-000001', zone: 'ME', country: 'AE' },
      { name: 'Asia Pacific Traders', buyerCode: 'APAC-000001', zone: 'APAC', country: 'SG' },
      { name: 'European Foods GmbH', buyerCode: 'EU-000001', zone: 'EU', country: 'DE' },
      { name: 'Local Mart', buyerCode: 'DOM-000001', zone: 'DOM', country: 'IN' },
    ];

    for (const customer of customers) {
      // Table uses product_zone (not zone); status enum values are lowercase: 'active'/'inactive'
      await queryRunner.query(`
        INSERT INTO customers (customer_id, buyer_code, customer_name, product_zone, status, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, 'active', true, NOW(), NOW())
        ON CONFLICT (buyer_code) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          product_zone = EXCLUDED.product_zone,
          is_active = true
      `, [customer.buyerCode, customer.name, customer.zone]);
    }
    console.log('✅ Sample customers seeded\n');

    // ========== 7. SEED SAMPLE VENDORS ==========
    console.log('📦 Seeding sample vendors (skipped since vendors table does not exist)...');
    /*
    const vendors = [
      { name: 'ABC Manufacturers', vendorCode: 'VND-001' },
      { name: 'XYZ Suppliers', vendorCode: 'VND-002' },
      { name: 'Global Exports', vendorCode: 'VND-003' },
      { name: 'Prime Industries', vendorCode: 'VND-004' },
      { name: 'Quality Foods Co', vendorCode: 'VND-005' },
    ];

    for (const vendor of vendors) {
      await queryRunner.query(`
        INSERT INTO vendors (vendor_id, vendor_code, vendor_name, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
        ON CONFLICT (vendor_code) DO UPDATE SET
          vendor_name = EXCLUDED.vendor_name,
          is_active = true
      `, [vendor.vendorCode, vendor.name]);
    }
    console.log('✅ Sample vendors seeded\n');
    */

    // ========== 8. SEED NUMBER SERIES ==========
    console.log('📦 Seeding number series...');

    const numberSeries = [
      { module: 'ENQUIRY', prefix: 'ENQ', currentNo: 1 },
      { module: 'PURCHASE', prefix: 'PUR', currentNo: 1 },
      { module: 'ANALYSIS', prefix: 'PA', currentNo: 1 },
      { module: 'SKU', prefix: 'SKU', currentNo: 1 },
      { module: 'CUSTOMER', prefix: 'CUST', currentNo: 1 },
      { module: 'VENDOR', prefix: 'VND', currentNo: 1 },
    ];

    for (const ns of numberSeries) {
      // Table columns: number_series_id, module_name, prefix, current_number, padding, is_active
      const existing = await queryRunner.query(`SELECT number_series_id FROM number_series WHERE module_name = $1`, [ns.module]);
      if (existing.length > 0) {
        await queryRunner.query(`
          UPDATE number_series SET prefix = $1, is_active = true WHERE module_name = $2
        `, [ns.prefix, ns.module]);
      } else {
        await queryRunner.query(`
          INSERT INTO number_series (number_series_id, module_name, prefix, current_number, padding, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, 5, true, NOW(), NOW())
        `, [ns.module, ns.prefix, ns.currentNo]);
      }
    }
    console.log('✅ Number series seeded\n');

    console.log('🎉 Seed completed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo login credentials:');
    console.log('  Email: admin@erp.com');
    console.log('  Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch(console.error);
