import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Transaction decorator helper for wrapping operations in database transactions.
 * Usage:
 *
 * @Injectable()
 * class MyService {
 *   constructor(private tx: TransactionHelper) {}
 *
 *   async doSomething() {
 *     return this.tx.run(async (manager) => {
 *       const user = await manager.save(User, { name: 'John' });
 *       const profile = await manager.save(Profile, { userId: user.id });
 *       return { user, profile };
 *     });
 *   }
 * }
 */
@Injectable()
export class TransactionHelper {
  private readonly logger = new Logger(TransactionHelper.name);

  constructor(private dataSource: DataSource) {}

  async run<T>(
    callback: (manager: any) => Promise<T>,
    options: { isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' } = {},
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(options.isolationLevel);

    try {
      this.logger.debug('Starting transaction');
      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();
      this.logger.debug('Transaction committed successfully');
      return result;
    } catch (error) {
      this.logger.error(`Transaction failed, rolling back: ${error.message}`, error.stack);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Run a read-only transaction
   */
  async runReadOnly<T>(callback: (manager: any) => Promise<T>): Promise<T> {
    return this.run(callback, { isolationLevel: 'READ COMMITTED' });
  }
}
