import { EntityManager } from 'typeorm';

/**
 * Financial-year label used by the document series, e.g. `2026-27`.
 */
export function financialYearLabel(date: Date = new Date()): string {
  const currentYear = date.getFullYear();
  const nextYear = currentYear + 1;
  return `${currentYear}-${nextYear.toString().slice(-2)}`;
}

export interface GenerateDocumentNumberOptions {
  /** Manager to run on. Pass a transaction's manager so the advisory lock is held until commit. */
  manager: EntityManager;
  /** Series prefix, e.g. `PLAN` or `GRN`. */
  prefix: string;
  /** Physical table holding the numbers, e.g. `receiving_plans`. */
  table: string;
  /** Physical column holding the numbers, e.g. `plan_number`. */
  column: string;
  /** Digits in the sequence part. Defaults to 5. */
  padding?: number;
}

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

/**
 * Generate the next number in a `PREFIX/FY/00001` document series.
 *
 * The number columns these series live in carry a *global* unique constraint, so
 * both the advisory lock and the lookup are scoped to the series rather than to a
 * company - a company-scoped lookup lets two companies derive the same number, and
 * a company-scoped lock (which degenerated to a constant for a NULL company) does
 * not serialise the generators that actually compete.
 *
 * The next value is MAX over the parsed numeric suffix, not the suffix of the most
 * recently created row: ordering by `created_at` has a non-deterministic tie-break
 * and rows bulk-inserted with an identical timestamp made it return the same number
 * forever.
 */
export async function generateDocumentNumber({
  manager,
  prefix,
  table,
  column,
  padding = 5,
}: GenerateDocumentNumberOptions): Promise<string> {
  if (!IDENTIFIER.test(table) || !IDENTIFIER.test(column)) {
    throw new Error(`Invalid document number source: ${table}.${column}`);
  }

  const series = `${prefix}/${financialYearLabel()}/`;

  // Serialise every generator for this series. Transaction-scoped, so it is held
  // until the caller's transaction commits the row it is about to insert.
  await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${table}.${column}:${series}`]);

  const rows = await manager.query(
    `SELECT COALESCE(MAX(substring(${column} from '([0-9]+)$')::bigint), 0)::bigint AS max_seq
       FROM ${table}
      WHERE ${column} LIKE $1 AND ${column} ~ '[0-9]+$'`,
    [`${series}%`],
  );

  const maxSeq = Number(rows?.[0]?.max_seq ?? 0);
  const nextNumber = (Number.isFinite(maxSeq) ? maxSeq : 0) + 1;

  return `${series}${nextNumber.toString().padStart(padding, '0')}`;
}
