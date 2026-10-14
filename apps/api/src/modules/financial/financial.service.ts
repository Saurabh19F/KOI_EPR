import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import {
  VoucherType,
  JournalEntryType,
} from './entities/journal-entry.entity';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  CreatePaymentDto,
  PaginationDto,
} from './dto/financial.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);
  private readonly pgPool: Pool;

  constructor() {
    // Parse DATABASE_URL from environment (used by NestJS TypeORM)
    const databaseUrl = process.env.DATABASE_URL || '';

    let poolConfig: any = {
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

    // Parse URL if available
    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl);
        poolConfig = {
          host: url.hostname,
          port: parseInt(url.port) || 5432,
          database: url.pathname.replace('/', '') || 'postgres',
          user: url.username,
          password: url.password,
          ssl: poolConfig.ssl,
        };
      } catch {
        // Fallback to individual env vars
        poolConfig = {
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          database: process.env.DATABASE_NAME || 'postgres',
          user: process.env.DATABASE_USER || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };
      }
    }

    this.pgPool = new Pool(poolConfig);
  }

  // ============ ACCOUNT OPERATIONS ============

  async createAccount(dto: CreateAccountDto, userId: string): Promise<any> {
    const accountId = crypto.randomUUID();
    await this.pgPool.query(
      `INSERT INTO accounts (account_id, company_id, account_code, account_name, account_type, account_nature, account_group, description, gstin, opening_balance, is_active, is_system, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        accountId,
        dto.companyId || null,
        dto.accountCode,
        dto.accountName,
        dto.accountType,
        dto.accountNature,
        dto.accountGroup || null,
        dto.description || null,
        dto.gstin || null,
        dto.openingBalance || 0,
        true,
        false,
        userId,
      ]
    );
    return this.findAccountById(accountId);
  }

  async findAllAccounts(params: PaginationDto & { companyId?: string; accountType?: string; isActive?: boolean }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, companyId, accountType, isActive = true } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    if (accountType) {
      whereClause += ` AND account_type = $${paramIndex++}`;
      values.push(accountType);
    }
    if (isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      values.push(isActive);
    }
    if (search) {
      whereClause += ` AND (account_code ILIKE $${paramIndex++} OR account_name ILIKE $${paramIndex++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await this.pgPool.query(
      `SELECT COUNT(*) as total FROM accounts ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await this.pgPool.query(
      `SELECT * FROM accounts ${whereClause} ORDER BY account_code LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAccountById(id: string): Promise<any> {
    const result = await this.pgPool.query('SELECT * FROM accounts WHERE account_id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException(`Account not found: ${id}`);
    return result.rows[0];
  }

  async findAccountByCode(code: string): Promise<any> {
    const result = await this.pgPool.query('SELECT * FROM accounts WHERE account_code = $1', [code]);
    return result.rows[0] || null;
  }

  async updateAccount(id: string, dto: UpdateAccountDto): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${snakeKey} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updates.length === 0) return this.findAccountById(id);

    values.push(id);
    await this.pgPool.query(
      `UPDATE accounts SET ${updates.join(', ')} WHERE account_id = $${paramIndex}`,
      values
    );
    return this.findAccountById(id);
  }

  async deleteAccount(id: string): Promise<boolean> {
    await this.pgPool.query(
      'UPDATE accounts SET is_active = false, deleted_at = NOW() WHERE account_id = $1',
      [id]
    );
    return true;
  }

  async getAccountBalance(accountId: string, asOfDate?: Date): Promise<{ debit: number; credit: number; balance: number }> {
    const dateCondition = asOfDate ? ` AND je.posting_date <= $2` : '';
    const params: any[] = [accountId];
    if (asOfDate) params.push(asOfDate);

    const result = await this.pgPool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN jel.debit_amount > 0 THEN jel.debit_amount ELSE 0 END), 0) as total_debit,
        COALESCE(SUM(CASE WHEN jel.credit_amount > 0 THEN jel.credit_amount ELSE 0 END), 0) as total_credit
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.entry_id = jel.entry_id
      WHERE jel.account_id = $1 AND je.is_posted = true ${dateCondition}`,
      params
    );

    const { total_debit, total_credit } = result.rows[0] || { total_debit: 0, total_credit: 0 };

    // Get account nature
    const account = await this.findAccountById(accountId);
    const balance = account?.account_nature === 'debit'
      ? Number(total_debit) - Number(total_credit)
      : Number(total_credit) - Number(total_debit);

    return {
      debit: Number(total_debit),
      credit: Number(total_credit),
      balance,
    };
  }

  // ============ JOURNAL ENTRY OPERATIONS ============

  async createJournalEntry(dto: CreateJournalEntryDto, userId: string): Promise<any> {
    // Validate debits = credits
    const totalDebit = dto.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Debits (${totalDebit}) must equal Credits (${totalCredit})`);
    }

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber(dto.voucherType);
    const entryId = crypto.randomUUID();

    // Insert entry
    await this.pgPool.query(
      `INSERT INTO journal_entries (entry_id, company_id, voucher_number, voucher_type, entry_type, entry_date, posting_date, description, total_debit, total_credit, reference_number, reference_date, party_type, party_id, party_name, is_posted, is_auto, is_cancelled, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
      [
        entryId,
        dto.companyId || null,
        voucherNumber,
        dto.voucherType,
        dto.entryType || 'journal',
        dto.entryDate,
        dto.postingDate,
        dto.description,
        totalDebit,
        totalCredit,
        dto.referenceNumber || null,
        dto.referenceDate || null,
        dto.partyType || null,
        dto.partyId || null,
        dto.partyName || null,
        false,
        false,
        false,
        userId,
      ]
    );

    // Insert lines
    for (let i = 0; i < dto.lines.length; i++) {
      const line = dto.lines[i];
      const lineId = crypto.randomUUID();
      await this.pgPool.query(
        `INSERT INTO journal_entry_lines (line_id, company_id, entry_id, account_id, debit_amount, credit_amount, narration, cost_center_id, department_id, project_id, line_number, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          lineId,
          dto.companyId || null,
          entryId,
          line.accountId,
          line.debitAmount || 0,
          line.creditAmount || 0,
          line.narration || null,
          line.costCenterId || null,
          line.departmentId || null,
          line.projectId || null,
          i + 1,
          userId,
        ]
      );
    }

    return this.findJournalEntryById(entryId);
  }

  async findAllJournalEntries(params: PaginationDto & { companyId?: string; voucherType?: string; fromDate?: Date; toDate?: Date; isPosted?: boolean }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, companyId, voucherType, fromDate, toDate, isPosted } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    if (voucherType) {
      whereClause += ` AND voucher_type = $${paramIndex++}`;
      values.push(voucherType);
    }
    if (fromDate && toDate) {
      whereClause += ` AND entry_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      values.push(fromDate, toDate);
    }
    if (isPosted !== undefined) {
      whereClause += ` AND is_posted = $${paramIndex++}`;
      values.push(isPosted);
    }
    if (search) {
      whereClause += ` AND (voucher_number ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR party_name ILIKE $${paramIndex++})`;
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = await this.pgPool.query(
      `SELECT COUNT(*) as total FROM journal_entries ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await this.pgPool.query(
      `SELECT * FROM journal_entries ${whereClause} ORDER BY entry_date DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findJournalEntryById(id: string): Promise<any> {
    const entryResult = await this.pgPool.query('SELECT * FROM journal_entries WHERE entry_id = $1', [id]);
    if (entryResult.rows.length === 0) throw new NotFoundException(`Journal entry not found: ${id}`);

    const linesResult = await this.pgPool.query(
      `SELECT jel.*, a.account_code, a.account_name
       FROM journal_entry_lines jel
       LEFT JOIN accounts a ON a.account_id = jel.account_id
       WHERE jel.entry_id = $1
       ORDER BY jel.line_number`,
      [id]
    );

    return {
      ...entryResult.rows[0],
      lines: linesResult.rows,
    };
  }

  async postJournalEntry(id: string, userId: string): Promise<any> {
    await this.pgPool.query(
      'UPDATE journal_entries SET is_posted = true, approved_by = $1, approved_at = NOW() WHERE entry_id = $2',
      [userId, id]
    );
    return this.findJournalEntryById(id);
  }

  async updateJournalEntry(id: string, dto: UpdateJournalEntryDto): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.entryDate) {
      updates.push(`entry_date = $${paramIndex++}`);
      values.push(dto.entryDate);
    }
    if (dto.postingDate) {
      updates.push(`posting_date = $${paramIndex++}`);
      values.push(dto.postingDate);
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.referenceNumber !== undefined) {
      updates.push(`reference_number = $${paramIndex++}`);
      values.push(dto.referenceNumber);
    }

    if (updates.length > 0) {
      values.push(id);
      await this.pgPool.query(
        `UPDATE journal_entries SET ${updates.join(', ')} WHERE entry_id = $${paramIndex}`,
        values
      );
    }

    return this.findJournalEntryById(id);
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    await this.pgPool.query('UPDATE journal_entries SET deleted_at = NOW() WHERE entry_id = $1', [id]);
    return true;
  }

  // ============ PAYMENT OPERATIONS ============

  async createPayment(dto: CreatePaymentDto, userId: string): Promise<any> {
    const paymentId = crypto.randomUUID();
    const paymentNumber = await this.generateVoucherNumber(dto.paymentType === 'RECEIPT' ? 'RV' : 'PV');

    await this.pgPool.query(
      `INSERT INTO payments (payment_id, company_id, payment_number, payment_date, payment_type, party_type, party_id, party_name, total_amount, tds_amount, tds_rate, tds_section, mode, bank_account_id, cheque_number, cheque_date, reference_number, utr_number, notes, source_module, source_id, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())`,
      [
        paymentId,
        dto.companyId || null,
        paymentNumber,
        dto.paymentDate,
        dto.paymentType,
        dto.partyType || null,
        dto.partyId || null,
        dto.partyName || null,
        dto.totalAmount,
        dto.tdsAmount || 0,
        dto.tdsRate || null,
        dto.tdsSection || null,
        dto.mode || null,
        dto.bankAccountId || null,
        dto.chequeNumber || null,
        dto.chequeDate || null,
        dto.referenceNumber || null,
        dto.utrNumber || null,
        dto.notes || null,
        dto.sourceModule || null,
        dto.sourceId || null,
        userId,
      ]
    );

    return this.findPaymentById(paymentId);
  }

  async findPaymentById(id: string): Promise<any> {
    const result = await this.pgPool.query('SELECT * FROM payments WHERE payment_id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException(`Payment not found: ${id}`);
    return result.rows[0];
  }

  // ============ HELPER METHODS ============

  private async generateVoucherNumber(voucherType: string): Promise<string> {
    const prefix = voucherType || 'JV';
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const fy = `${currentYear}-${nextYear.toString().slice(-2)}`;

    const result = await this.pgPool.query(
      `SELECT MAX(voucher_number) as max_number FROM journal_entries WHERE voucher_type = $1`,
      [voucherType]
    );

    let nextNumber = 1;
    if (result.rows[0]?.max_number) {
      const parts = result.rows[0].max_number.split('/');
      const lastNumber = parseInt(parts[parts.length - 1], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${fy}/${nextNumber.toString().padStart(5, '0')}`;
  }

  // ============ COST CENTER OPERATIONS ============

  async createCostCenter(data: any, userId: string): Promise<any> {
    const costCenterId = crypto.randomUUID();
    await this.pgPool.query(
      `INSERT INTO cost_centers (cost_center_id, company_id, cost_center_code, cost_center_name, parent_id, allocation_percentage, type, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        costCenterId,
        data.companyId || null,
        data.costCenterCode,
        data.costCenterName,
        data.parentId || null,
        data.allocationPercentage || null,
        data.type || null,
        true,
        userId,
      ]
    );
    return this.findCostCenterById(costCenterId);
  }

  async findCostCenterById(id: string): Promise<any> {
    const result = await this.pgPool.query('SELECT * FROM cost_centers WHERE cost_center_id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException(`Cost center not found: ${id}`);
    return result.rows[0];
  }

  async findAllCostCenters(companyId?: string): Promise<any[]> {
    let whereClause = 'WHERE is_active = true';
    const values: any[] = [];

    if (companyId) {
      whereClause += ' AND company_id = $1';
      values.push(companyId);
    }

    const result = await this.pgPool.query(
      `SELECT * FROM cost_centers ${whereClause} ORDER BY cost_center_code`,
      values
    );
    return result.rows;
  }

  // ============ FINANCIAL REPORTS ============

  async getLedgerReport(accountId: string, fromDate: Date, toDate: Date): Promise<any> {
    const account = await this.findAccountById(accountId);
    const openingBalance = await this.getAccountBalance(accountId, new Date(fromDate.getTime() - 86400000));

    const transactions = await this.pgPool.query(
      `SELECT
        je.entry_date,
        je.voucher_number,
        je.voucher_type,
        je.description,
        je.party_name,
        jel.debit_amount,
        jel.credit_amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.entry_id = jel.entry_id
      WHERE jel.account_id = $1
        AND je.is_posted = true
        AND je.entry_date >= $2
        AND je.entry_date <= $3
      ORDER BY je.entry_date, je.created_at`,
      [accountId, fromDate, toDate]
    );

    let runningBalance = openingBalance.balance;
    const formattedTransactions = transactions.rows.map((t: any) => {
      const debit = Number(t.debit_amount);
      const credit = Number(t.credit_amount);
      runningBalance += account?.account_nature === 'debit'
        ? debit - credit
        : credit - debit;

      return {
        date: t.entry_date,
        voucherNumber: t.voucher_number,
        voucherType: t.voucher_type,
        description: t.description,
        partyName: t.party_name,
        debit,
        credit,
        runningBalance,
      };
    });

    return {
      accountId,
      accountCode: account?.account_code,
      accountName: account?.account_name,
      transactions: formattedTransactions,
      openingBalance: openingBalance.balance,
      closingBalance: runningBalance,
      totalDebit: formattedTransactions.reduce((sum: number, t: any) => sum + t.debit, 0),
      totalCredit: formattedTransactions.reduce((sum: number, t: any) => sum + t.credit, 0),
    };
  }

  async getTrialBalance(fromDate: Date, toDate: Date, companyId?: string): Promise<any> {
    const accountsResult = await this.pgPool.query(
      'SELECT * FROM accounts WHERE is_active = true ORDER BY account_type, account_code'
    );

    const accounts: any[] = [];
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalDebitTurnover = 0;
    let totalCreditTurnover = 0;

    for (const account of accountsResult.rows) {
      const opening = await this.getAccountBalance(account.account_id, new Date(fromDate.getTime() - 86400000));
      const period = await this.getAccountBalance(account.account_id, toDate);

      accounts.push({
        accountId: account.account_id,
        accountCode: account.account_code,
        accountName: account.account_name,
        accountType: account.account_type,
        openingDebit: opening.debit,
        openingCredit: opening.credit,
        debitTurnover: period.debit - opening.debit,
        creditTurnover: period.credit - opening.credit,
        closingDebit: period.debit,
        closingCredit: period.credit,
      });

      totalOpeningDebit += opening.debit;
      totalOpeningCredit += opening.credit;
      totalDebitTurnover += period.debit - opening.debit;
      totalCreditTurnover += period.credit - opening.credit;
    }

    return {
      accounts,
      totalOpeningDebit,
      totalOpeningCredit,
      totalDebitTurnover,
      totalCreditTurnover,
      totalClosingDebit: accounts.reduce((sum: number, a: any) => sum + a.closingDebit, 0),
      totalClosingCredit: accounts.reduce((sum: number, a: any) => sum + a.closingCredit, 0),
    };
  }

  async getBalanceSheet(asOfDate: Date, companyId?: string): Promise<any> {
    return {
      assets: [],
      liabilities: [],
      equity: { group: 'Equity', accounts: [], total: 0 },
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    };
  }

  async getProfitAndLoss(fromDate: Date, toDate: Date, companyId?: string): Promise<any> {
    return {
      income: [],
      expenses: [],
      totalIncome: 0,
      totalExpenses: 0,
      grossProfit: 0,
      netProfit: 0,
    };
  }

  // ============ DEFAULT CHART OF ACCOUNTS ============

  async createDefaultAccounts(companyId: string, userId: string): Promise<any[]> {
    const defaultAccounts = [
      { accountCode: 'CASH-001', accountName: 'Cash', accountType: 'asset', accountNature: 'debit', accountGroup: 'cash' },
      { accountCode: 'BANK-001', accountName: 'Bank Account', accountType: 'asset', accountNature: 'debit', accountGroup: 'bank' },
      { accountCode: 'SUNDRY-DEBTORS', accountName: 'Sundry Debtors', accountType: 'asset', accountNature: 'debit', accountGroup: 'receivable' },
      { accountCode: 'STOCK-001', accountName: 'Inventory', accountType: 'asset', accountNature: 'debit', accountGroup: 'inventory' },
      { accountCode: 'SUNDRY-CRED', accountName: 'Sundry Creditors', accountType: 'liability', accountNature: 'credit', accountGroup: 'payable' },
      { accountCode: 'TDS-PAY', accountName: 'TDS Payable', accountType: 'liability', accountNature: 'credit', accountGroup: 'current_liability' },
      { accountCode: 'GST-PAY', accountName: 'GST Payable', accountType: 'liability', accountNature: 'credit', accountGroup: 'current_liability' },
      { accountCode: 'CAPITAL-001', accountName: 'Capital Account', accountType: 'equity', accountNature: 'credit', accountGroup: 'capital' },
      { accountCode: 'SALES-001', accountName: 'Sales Account', accountType: 'revenue', accountNature: 'credit', accountGroup: 'sales' },
      { accountCode: 'SALES-RET', accountName: 'Sales Returns', accountType: 'revenue', accountNature: 'debit', accountGroup: 'sales' },
      { accountCode: 'PURCHASE-001', accountName: 'Purchase Account', accountType: 'expense', accountNature: 'debit', accountGroup: 'purchase' },
      { accountCode: 'PURCHASE-RET', accountName: 'Purchase Returns', accountType: 'expense', accountNature: 'credit', accountGroup: 'purchase' },
    ];

    const results: any[] = [];
    for (const acc of defaultAccounts) {
      const result = await this.createAccount({ ...acc, companyId }, userId);
      results.push(result);
    }
    return results;
  }

  // ============ GST UTILITIES ============

  async calculateGst(amount: number, gstRate: number): Promise<{ cgst: number; sgst: number; igst: number; total: number }> {
    const rate = gstRate / 2;
    const cgst = Math.round(amount * rate) / 100;
    const sgst = Math.round(amount * rate) / 100;
    const igst = Math.round(amount * gstRate) / 100;

    return {
      cgst,
      sgst,
      igst,
      total: amount + cgst + sgst,
    };
  }

  async calculateTds(amount: number, tdsRate: number): Promise<{ tdsAmount: number; netAmount: number }> {
    const tdsAmount = Math.round(amount * tdsRate) / 100;
    return {
      tdsAmount,
      netAmount: amount - tdsAmount,
    };
  }

  // ============ ACCOUNTS PAYABLE/RECEIVABLE ============

  async getAccountsPayable(companyId: string | undefined, params: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search } = params;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = true AND account_group = 'payable'";
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    if (search) {
      whereClause += ` AND (account_code ILIKE $${paramIndex++} OR account_name ILIKE $${paramIndex++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await this.pgPool.query(
      `SELECT COUNT(*) as total FROM accounts ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await this.pgPool.query(
      `SELECT * FROM accounts ${whereClause} ORDER BY account_code LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAccountsReceivable(companyId: string | undefined, params: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search } = params;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE is_active = true AND account_group = 'receivable'";
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    if (search) {
      whereClause += ` AND (account_code ILIKE $${paramIndex++} OR account_name ILIKE $${paramIndex++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await this.pgPool.query(
      `SELECT COUNT(*) as total FROM accounts ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await this.pgPool.query(
      `SELECT * FROM accounts ${whereClause} ORDER BY account_code LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ FIND ALL WITH PAGINATION ============

  async findAllPayments(params: PaginationDto & { companyId?: string; paymentType?: string }): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, companyId, paymentType } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (companyId) {
      whereClause += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    if (paymentType) {
      whereClause += ` AND payment_type = $${paramIndex++}`;
      values.push(paymentType);
    }
    if (search) {
      whereClause += ` AND (payment_number ILIKE $${paramIndex++} OR party_name ILIKE $${paramIndex++})`;
      values.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await this.pgPool.query(
      `SELECT COUNT(*) as total FROM payments ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    values.push(limit, offset);
    const result = await this.pgPool.query(
      `SELECT * FROM payments ${whereClause} ORDER BY payment_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      values
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
