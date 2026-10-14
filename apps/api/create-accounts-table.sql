-- Create accounts table for Financial module
CREATE TABLE IF NOT EXISTS accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255),
  account_code VARCHAR(50) NOT NULL UNIQUE,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  account_nature VARCHAR(50),
  account_group VARCHAR(100),
  description TEXT,
  gstin VARCHAR(20),
  opening_balance DECIMAL(18,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  journal_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255),
  voucher_type VARCHAR(50) NOT NULL,
  voucher_number VARCHAR(50) NOT NULL UNIQUE,
  voucher_date DATE NOT NULL,
  reference_number VARCHAR(100),
  reference_date DATE,
  description TEXT,
  is_posted BOOLEAN DEFAULT false,
  posted_by UUID,
  posted_at TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(voucher_date);

-- Create journal_entry_lines table
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(journal_entry_id),
  account_id UUID REFERENCES accounts(account_id),
  debit DECIMAL(18,2) DEFAULT 0,
  credit DECIMAL(18,2) DEFAULT 0,
  narration TEXT,
  cost_center_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);

-- Insert default chart of accounts
INSERT INTO accounts (account_id, account_code, account_name, account_type, account_nature, is_system, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'CASH', 'Cash Account', 'ASSET', 'DEBIT', true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'BANK', 'Bank Account', 'ASSET', 'DEBIT', true, NOW()),
  ('33333333-3333-3333-3333-333333333333', 'SALES', 'Sales Account', 'REVENUE', 'CREDIT', true, NOW()),
  ('44444444-4444-4444-4444-444444444444', 'PURCHASE', 'Purchase Account', 'EXPENSE', 'DEBIT', true, NOW()),
  ('55555555-5555-5555-5555-555555555555', 'CAPITAL', 'Capital Account', 'LIABILITY', 'CREDIT', true, NOW())
ON CONFLICT (account_code) DO NOTHING;
