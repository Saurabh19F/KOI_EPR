import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddMissingColumns1700000000000 implements MigrationInterface {
  name = 'AddMissingColumns1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email verification columns to users table
    await queryRunner.addColumn('users', new TableColumn({
      name: 'email_verified',
      type: 'boolean',
      default: false,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'email_verified_at',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'is_locked',
      type: 'boolean',
      default: false,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'locked_until',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'failed_login_attempts',
      type: 'int',
      default: 0,
    }));

    // Add missing columns to accounts table
    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'bank_name',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'bank_branch',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'bank_account_number',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'bank_ifsc_code',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'opening_balance',
      type: 'decimal',
      precision: 18,
      scale: 2,
      default: 0,
    }));

    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'opening_balance_date',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('accounts', new TableColumn({
      name: 'credit_limit',
      type: 'decimal',
      precision: 18,
      scale: 2,
      isNullable: true,
    }));

    // Add is_reconciled column to journal entries if not exists
    const journalEntriesColumns = await queryRunner.getTable('journal_entries');
    if (journalEntriesColumns && !journalEntriesColumns.columns.find(c => c.name === 'is_reconciled')) {
      await queryRunner.addColumn('journal_entries', new TableColumn({
        name: 'is_reconciled',
        type: 'boolean',
        default: false,
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop users columns
    await queryRunner.dropColumn('users', 'email_verified');
    await queryRunner.dropColumn('users', 'email_verified_at');
    await queryRunner.dropColumn('users', 'is_locked');
    await queryRunner.dropColumn('users', 'locked_until');
    await queryRunner.dropColumn('users', 'failed_login_attempts');

    // Drop accounts columns
    await queryRunner.dropColumn('accounts', 'bank_name');
    await queryRunner.dropColumn('accounts', 'bank_branch');
    await queryRunner.dropColumn('accounts', 'bank_account_number');
    await queryRunner.dropColumn('accounts', 'bank_ifsc_code');
    await queryRunner.dropColumn('accounts', 'opening_balance');
    await queryRunner.dropColumn('accounts', 'opening_balance_date');
    await queryRunner.dropColumn('accounts', 'credit_limit');

    // Drop journal entries column
    await queryRunner.dropColumn('journal_entries', 'is_reconciled');
  }
}
