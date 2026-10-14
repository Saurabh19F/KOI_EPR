import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SystemErrorLog } from './entities/system-error-log.entity';
import { CreateSystemErrorLogDto } from './dto/system-error-log.dto';
import { PaginatedResult } from '../../common/types';

@Injectable()
export class SystemErrorLogService {
  constructor(
    @InjectRepository(SystemErrorLog)
    private readonly errorLogRepo: Repository<SystemErrorLog>,
  ) {}

  async create(
    dto: CreateSystemErrorLogDto,
    companyId?: string,
  ): Promise<SystemErrorLog> {
    const log = this.errorLogRepo.create({
      ...dto,
      errorTimestamp: new Date(dto.errorTimestamp),
      companyId,
    });
    return this.errorLogRepo.save(log);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    context?: string;
    username?: string;
    companyId?: string;
  }): Promise<PaginatedResult<SystemErrorLog>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.errorLogRepo.createQueryBuilder('e');

    if (params.companyId) {
      qb.andWhere('e.companyId = :companyId', {
        companyId: params.companyId,
      });
    }

    if (params.context) {
      qb.andWhere('e.context = :context', { context: params.context });
    }

    if (params.username) {
      qb.andWhere('e.username = :username', { username: params.username });
    }

    if (params.search) {
      qb.andWhere('(e.message ILIKE :search OR e.context ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    qb.orderBy('e.errorTimestamp', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<SystemErrorLog> {
    return this.errorLogRepo.findOneByOrFail({ errorId: id });
  }

  async clearOlderThan(days: number, companyId?: string): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const criteria: any = {
      errorTimestamp: LessThan(cutoff),
    };
    if (companyId) {
      criteria.companyId = companyId;
    }

    const result = await this.errorLogRepo.delete(criteria);
    return result.affected || 0;
  }
}
