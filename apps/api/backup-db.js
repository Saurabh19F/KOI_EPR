#!/usr/bin/env node

/**
 * Database backup script — run manually or via cron.
 * Usage: node backup-db.js [--output-dir ./backups]
 *
 * Cron example (daily at 2am):
 *   0 2 * * * cd /app && node backup-db.js >> /var/log/db-backup.log 2>&1
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync, readdirSync, unlinkSync, statSync } = require('fs');
const { join } = require('path');
const { config } = require('dotenv');

config({ path: join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL env var is required.');
  process.exit(1);
}

const args = process.argv.slice(2);
const outputDirIdx = args.indexOf('--output-dir');
const outputDir = outputDirIdx !== -1 && args[outputDirIdx + 1]
  ? args[outputDirIdx + 1]
  : join(__dirname, 'backups');

const MAX_BACKUPS = parseInt(process.env.BACKUP_RETENTION_COUNT || '7', 10);

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const filename = `backup-${timestamp}.sql.gz`;
const filepath = join(outputDir, filename);

console.log(`[${new Date().toISOString()}] Starting database backup...`);
console.log(`Output: ${filepath}`);

try {
  execSync(`pg_dump "${DATABASE_URL}" | gzip > "${filepath}"`, {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 600000,
  });

  const stats = statSync(filepath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`Backup completed: ${sizeMB} MB`);
} catch (err) {
  console.error('Backup FAILED:', err.message);
  if (existsSync(filepath)) unlinkSync(filepath);
  process.exit(1);
}

// Rotate old backups
const backups = readdirSync(outputDir)
  .filter(f => f.startsWith('backup-') && f.endsWith('.sql.gz'))
  .sort()
  .reverse();

if (backups.length > MAX_BACKUPS) {
  const toDelete = backups.slice(MAX_BACKUPS);
  for (const old of toDelete) {
    const oldPath = join(outputDir, old);
    console.log(`Rotating old backup: ${old}`);
    unlinkSync(oldPath);
  }
}

console.log(`[${new Date().toISOString()}] Backup complete. ${backups.length} backups in ${outputDir} (keeping last ${MAX_BACKUPS}).`);
