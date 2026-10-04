import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env' });

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: false,
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('Database connected.');

  // Find all purchase department users
  const purchaseUsers = await ds.query(`
    SELECT u.user_id, u.name 
    FROM users u
    JOIN departments d ON u.department_id = d.department_id
    WHERE d.department_code = 'PURCHASE' AND u.is_active = true
  `);

  if (purchaseUsers.length === 0) {
    console.log('No purchase users found in database. Trying by role...');
    const purchaseUsersByRole = await ds.query(`
      SELECT u.user_id, u.name 
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.role_code IN ('PURCHASE_USER', 'PURCHASE_MANAGER') AND u.is_active = true
    `);
    purchaseUsers.push(...purchaseUsersByRole);
  }

  if (purchaseUsers.length === 0) {
    console.log('No purchase users found. Cannot assign.');
    await ds.destroy();
    return;
  }

  console.log(`Found ${purchaseUsers.length} purchase users:`, purchaseUsers.map((u: any) => u.name));

  // Fetch all products
  const products = await ds.query(`SELECT product_id FROM products WHERE deleted_at IS NULL`);
  console.log(`Found ${products.length} products to update.`);

  if (products.length === 0) {
    await ds.destroy();
    return;
  }

  // Build the bulk update VALUES query
  // Chunks of 1000 to prevent query size limits
  const chunkSize = 1000;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const valueStrings = chunk.map((product: any, idx: number) => {
      const assignedUser = purchaseUsers[(i + idx) % purchaseUsers.length];
      // Escape names just in case they have single quotes
      const escapedName = assignedUser.name.replace(/'/g, "''");
      return `('${product.product_id}'::uuid, '${assignedUser.user_id}'::uuid, '${escapedName}')`;
    });

    const query = `
      UPDATE products AS p
      SET 
        purchase_person_id = v.purchase_person_id,
        purchase_person_name = v.purchase_person_name
      FROM (VALUES
        ${valueStrings.join(',\n        ')}
      ) AS v(product_id, purchase_person_id, purchase_person_name)
      WHERE p.product_id = v.product_id;
    `;

    await ds.query(query);
    console.log(`Updated chunk ${i / chunkSize + 1} (${chunk.length} products)`);
  }

  console.log('Successfully assigned purchase persons to all products in bulk.');
  await ds.destroy();
}

run().catch(console.error);
