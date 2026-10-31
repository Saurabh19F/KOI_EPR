import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ProductionJob,
  ProductionLog,
  ProductionMergeDetail,
  ProductionMaterialClosure,
  ProductionJobStatus,
  BillOfMaterial,
  BomItem,
  BomStatus,
} from './entities/production.entity';
import {
  CreateProductionJobDto,
  UpdateProductionJobDto,
  CloseProductionJobDto,
  CreateProductionLogDto,
  CreateProductionMergeDetailDto,
  CreateProductionMaterialClosureDto,
  CreateBomDto,
  UpdateBomDto,
} from './dto/production.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductionService {
  private readonly logger = new Logger(ProductionService.name);

  constructor(
    @InjectRepository(ProductionJob)
    private readonly jobRepository: Repository<ProductionJob>,
    @InjectRepository(ProductionLog)
    private readonly logRepository: Repository<ProductionLog>,
    @InjectRepository(ProductionMergeDetail)
    private readonly mergeDetailRepository: Repository<ProductionMergeDetail>,
    @InjectRepository(ProductionMaterialClosure)
    private readonly materialClosureRepository: Repository<ProductionMaterialClosure>,
    @InjectRepository(BillOfMaterial)
    private readonly bomRepository: Repository<BillOfMaterial>,
    @InjectRepository(BomItem)
    private readonly bomItemRepository: Repository<BomItem>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private generateNumber(prefix: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // ============ PRODUCTION JOBS ============

  async createJob(dto: CreateProductionJobDto, user: any): Promise<ProductionJob> {
    const job = this.jobRepository.create({
      ...dto,
      jobNumber: this.generateNumber('JOB'),
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      status: dto.status || ProductionJobStatus.DRAFT,
      companyId: user?.companyId,
      createdBy: user?.userId || user?.email,
      updatedBy: user?.userId || user?.email,
    });
    const saved = await this.jobRepository.save(job);
    this.logger.log(`Production job created: ${saved.jobNumber}`);
    return saved;
  }

  async findAllJobs(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProductionJobStatus;
    warehouseId?: string;
    companyId?: string;
  }): Promise<PaginatedResult<ProductionJob>> {
    const { page = 1, limit = 20, search, status, warehouseId, companyId } = params;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ProductionJob>[] = [];
    const baseWhere: FindOptionsWhere<ProductionJob> = {};

    if (companyId) baseWhere.companyId = companyId;
    if (status) baseWhere.status = status;
    if (warehouseId) baseWhere.warehouseId = warehouseId;

    if (search) {
      where.push(
        { ...baseWhere, jobNumber: ILike(`%${search}%`) },
        { ...baseWhere, productName: ILike(`%${search}%`) },
        { ...baseWhere, orderNo: ILike(`%${search}%`) },
        { ...baseWhere, partyName: ILike(`%${search}%`) },
      );
    } else {
      where.push(baseWhere);
    }

    const [data, total] = await this.jobRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findJobById(id: string, companyId?: string): Promise<ProductionJob> {
    const where: FindOptionsWhere<ProductionJob> = { jobId: id };
    if (companyId) where.companyId = companyId;

    const job = await this.jobRepository.findOne({ where });
    if (!job) throw new NotFoundException(`Production job ${id} not found`);
    return job;
  }

  async updateJob(id: string, dto: UpdateProductionJobDto, user: any): Promise<ProductionJob> {
    const job = await this.findJobById(id, user?.companyId);

    if (job.status === ProductionJobStatus.COMPLETED || job.status === ProductionJobStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update a ${job.status} job`);
    }

    Object.assign(job, {
      ...dto,
      updatedBy: user?.userId || user?.email,
    });

    return this.jobRepository.save(job);
  }

  async startJob(id: string, user: any): Promise<ProductionJob> {
    const job = await this.findJobById(id, user?.companyId);

    const allowedTransitions: Record<string, ProductionJobStatus[]> = {
      [ProductionJobStatus.DRAFT]: [ProductionJobStatus.PLANNED, ProductionJobStatus.IN_PROGRESS],
      [ProductionJobStatus.PLANNED]: [ProductionJobStatus.IN_PROGRESS, ProductionJobStatus.WAITING_FOR_MATERIAL],
      [ProductionJobStatus.WAITING_FOR_MATERIAL]: [ProductionJobStatus.IN_PROGRESS],
      [ProductionJobStatus.READY_FOR_PRODUCTION]: [ProductionJobStatus.IN_PROGRESS],
    };

    const allowed = allowedTransitions[job.status];
    if (!allowed || !allowed.includes(ProductionJobStatus.IN_PROGRESS)) {
      throw new BadRequestException(`Cannot start a job with status ${job.status}`);
    }

    job.status = ProductionJobStatus.IN_PROGRESS;
    job.startDate = job.startDate || new Date();
    job.startedBy = user?.userId || user?.email;
    job.updatedBy = user?.userId || user?.email;

    const saved = await this.jobRepository.save(job);
    this.logger.log(`Production job started: ${saved.jobNumber}`);

    this.eventEmitter.emit('production.job.started', {
      jobId: saved.jobId,
      jobNumber: saved.jobNumber,
      productId: saved.productId,
      productName: saved.productName,
      warehouseId: saved.warehouseId,
      warehouseName: saved.warehouseName,
      orderQty: Number(saved.orderQty),
      companyId: saved.companyId,
      userId: user?.userId || user?.email,
    });

    return saved;
  }

  async closeJob(id: string, dto: CloseProductionJobDto, user: any): Promise<ProductionJob> {
    return this.dataSource.transaction(async (manager) => {
      const job = await manager.findOne(ProductionJob, {
        where: { jobId: id, ...(user?.companyId ? { companyId: user.companyId } : {}) },
      });

      if (!job) throw new NotFoundException(`Production job ${id} not found`);

      if (job.status !== ProductionJobStatus.IN_PROGRESS) {
        throw new BadRequestException(`Can only close an IN_PROGRESS job, current status: ${job.status}`);
      }

      job.status = ProductionJobStatus.COMPLETED;
      job.finalProducedQty = dto.finalProducedQty;
      job.closingDate = new Date();
      job.closedBy = user?.userId || user?.email;
      job.updatedBy = user?.userId || user?.email;
      if (dto.remarks) job.remarks = dto.remarks;

      const saved = await manager.save(ProductionJob, job);
      this.logger.log(`Production job closed: ${saved.jobNumber}, produced: ${saved.finalProducedQty}`);

      const closures = await manager.find(ProductionMaterialClosure, {
        where: { productionJobId: id },
      });

      const materialClosureData: Array<{
        materialId: string;
        materialName: string;
        usedQty: number;
        returnedQty: number;
        sourceWarehouseId: string;
        productionWarehouseId: string;
      }> = closures.map((c) => ({
        materialId: c.materialId,
        materialName: c.materialName,
        usedQty: Number(c.usedQty),
        returnedQty: Number(c.returnedQty),
        sourceWarehouseId: c.sourceWarehouseId,
        productionWarehouseId: c.productionWarehouseId,
      }));

      this.eventEmitter.emit('production.job.completed', {
        jobId: saved.jobId,
        jobNumber: saved.jobNumber,
        productId: saved.productId,
        productName: saved.productName,
        warehouseId: saved.warehouseId,
        warehouseName: saved.warehouseName,
        finalProducedQty: Number(saved.finalProducedQty),
        companyId: saved.companyId,
        userId: user?.userId || user?.email,
        materialClosures: materialClosureData,
      });

      return saved;
    });
  }

  async deleteJob(id: string, user: any): Promise<{ deleted: boolean }> {
    const job = await this.findJobById(id, user?.companyId);

    if (job.status === ProductionJobStatus.IN_PROGRESS || job.status === ProductionJobStatus.COMPLETED) {
      throw new BadRequestException(`Cannot delete a ${job.status} job`);
    }

    await this.jobRepository.remove(job);
    return { deleted: true };
  }

  // ============ PRODUCTION LOGS ============

  async createLog(dto: CreateProductionLogDto, user: any): Promise<ProductionLog> {
    const log = this.logRepository.create({
      ...dto,
      logNumber: this.generateNumber('PROD'),
      date: new Date(dto.date),
      loggedBy: user?.name || user?.email,
      loggedByUserId: user?.userId,
      companyId: user?.companyId,
      createdBy: user?.userId || user?.email,
      updatedBy: user?.userId || user?.email,
    });

    const saved = await this.logRepository.save(log);
    this.logger.log(`Production log created: ${saved.logNumber}`);
    return saved;
  }

  async findAllLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    productionJobId?: string;
    companyId?: string;
  }): Promise<PaginatedResult<ProductionLog>> {
    const { page = 1, limit = 20, search, productionJobId, companyId } = params;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ProductionLog>[] = [];
    const baseWhere: FindOptionsWhere<ProductionLog> = {};

    if (companyId) baseWhere.companyId = companyId;
    if (productionJobId) baseWhere.productionJobId = productionJobId;

    if (search) {
      where.push(
        { ...baseWhere, logNumber: ILike(`%${search}%`) },
        { ...baseWhere, rawMaterialName: ILike(`%${search}%`) },
        { ...baseWhere, finishedProductName: ILike(`%${search}%`) },
      );
    } else {
      where.push(baseWhere);
    }

    const [data, total] = await this.logRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLogById(id: string, companyId?: string): Promise<ProductionLog> {
    const where: FindOptionsWhere<ProductionLog> = { logId: id };
    if (companyId) where.companyId = companyId;

    const log = await this.logRepository.findOne({ where });
    if (!log) throw new NotFoundException(`Production log ${id} not found`);
    return log;
  }

  // ============ MERGE DETAILS ============

  async createMergeDetail(dto: CreateProductionMergeDetailDto, user: any): Promise<ProductionMergeDetail> {
    const merge = this.mergeDetailRepository.create({
      ...dto,
      mergeNumber: this.generateNumber('MERGE'),
      entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
      enteredBy: user?.name || user?.email,
      enteredByUserId: user?.userId,
      companyId: user?.companyId,
      createdBy: user?.userId || user?.email,
      updatedBy: user?.userId || user?.email,
    });

    const saved = await this.mergeDetailRepository.save(merge);
    this.logger.log(`Production merge detail created: ${saved.mergeNumber}`);
    return saved;
  }

  async findAllMergeDetails(params: {
    page?: number;
    limit?: number;
    search?: string;
    productionJobId?: string;
    companyId?: string;
  }): Promise<PaginatedResult<ProductionMergeDetail>> {
    const { page = 1, limit = 20, search, productionJobId, companyId } = params;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ProductionMergeDetail>[] = [];
    const baseWhere: FindOptionsWhere<ProductionMergeDetail> = {};

    if (companyId) baseWhere.companyId = companyId;
    if (productionJobId) baseWhere.productionJobId = productionJobId;

    if (search) {
      where.push(
        { ...baseWhere, mergeNumber: ILike(`%${search}%`) },
        { ...baseWhere, mergedItemName: ILike(`%${search}%`) },
        { ...baseWhere, finalProductName: ILike(`%${search}%`) },
      );
    } else {
      where.push(baseWhere);
    }

    const [data, total] = await this.mergeDetailRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ MATERIAL CLOSURES ============

  async createMaterialClosure(dto: CreateProductionMaterialClosureDto, user: any): Promise<ProductionMaterialClosure> {
    const closure = this.materialClosureRepository.create({
      ...dto,
      closureNumber: this.generateNumber('CLOSE'),
      closingDate: dto.closingDate ? new Date(dto.closingDate) : new Date(),
      closedBy: user?.name || user?.email,
      closedByUserId: user?.userId,
      companyId: user?.companyId,
      createdBy: user?.userId || user?.email,
      updatedBy: user?.userId || user?.email,
    });

    const saved = await this.materialClosureRepository.save(closure);
    this.logger.log(`Production material closure created: ${saved.closureNumber}`);
    return saved;
  }

  async findAllMaterialClosures(params: {
    page?: number;
    limit?: number;
    search?: string;
    productionJobId?: string;
    companyId?: string;
  }): Promise<PaginatedResult<ProductionMaterialClosure>> {
    const { page = 1, limit = 20, search, productionJobId, companyId } = params;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ProductionMaterialClosure>[] = [];
    const baseWhere: FindOptionsWhere<ProductionMaterialClosure> = {};

    if (companyId) baseWhere.companyId = companyId;
    if (productionJobId) baseWhere.productionJobId = productionJobId;

    if (search) {
      where.push(
        { ...baseWhere, closureNumber: ILike(`%${search}%`) },
        { ...baseWhere, materialName: ILike(`%${search}%`) },
        { ...baseWhere, finalProductName: ILike(`%${search}%`) },
      );
    } else {
      where.push(baseWhere);
    }

    const [data, total] = await this.materialClosureRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============ BILL OF MATERIALS ============

  async createBom(dto: CreateBomDto, user: any): Promise<BillOfMaterial> {
    return this.dataSource.transaction(async (manager) => {
      const bom = this.bomRepository.create({
        bomNumber: this.generateNumber('BOM'),
        productId: dto.productId,
        productName: dto.productName,
        version: dto.version || '1.0',
        status: dto.status || BomStatus.DRAFT,
        outputQty: dto.outputQty || 1,
        uom: dto.uom,
        description: dto.description,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        companyId: user?.companyId,
        createdBy: user?.userId || user?.email,
        updatedBy: user?.userId || user?.email,
      });
      const savedBom = await manager.save(BillOfMaterial, bom);

      if (dto.items?.length) {
        const items = dto.items.map((item, idx) =>
          manager.create(BomItem, {
            bomId: savedBom.bomId,
            materialId: item.materialId,
            materialName: item.materialName,
            quantity: item.quantity,
            uom: item.uom,
            wastagePercent: item.wastagePercent || 0,
            remarks: item.remarks,
            sortOrder: item.sortOrder ?? idx,
          }),
        );
        await manager.save(BomItem, items);
      }

      this.logger.log(`BOM created: ${savedBom.bomNumber} for product ${savedBom.productId}`);
      return savedBom;
    });
  }

  async findAllBoms(params: {
    page?: number;
    limit?: number;
    search?: string;
    productId?: string;
    status?: BomStatus;
    companyId?: string;
  }): Promise<PaginatedResult<BillOfMaterial>> {
    const { page = 1, limit = 20, search, productId, status, companyId } = params;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<BillOfMaterial>[] = [];
    const baseWhere: FindOptionsWhere<BillOfMaterial> = {};

    if (companyId) baseWhere.companyId = companyId;
    if (productId) baseWhere.productId = productId;
    if (status) baseWhere.status = status;

    if (search) {
      where.push(
        { ...baseWhere, bomNumber: ILike(`%${search}%`) },
        { ...baseWhere, productName: ILike(`%${search}%`) },
      );
    } else {
      where.push(baseWhere);
    }

    const [data, total] = await this.bomRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBomById(id: string, companyId?: string): Promise<BillOfMaterial & { items: BomItem[] }> {
    const where: FindOptionsWhere<BillOfMaterial> = { bomId: id };
    if (companyId) where.companyId = companyId;

    const bom = await this.bomRepository.findOne({ where });
    if (!bom) throw new NotFoundException(`BOM ${id} not found`);

    const items = await this.bomItemRepository.find({
      where: { bomId: id },
      order: { sortOrder: 'ASC' },
    });

    return { ...bom, items };
  }

  async updateBom(id: string, dto: UpdateBomDto, user: any): Promise<BillOfMaterial> {
    return this.dataSource.transaction(async (manager) => {
      const bom = await manager.findOne(BillOfMaterial, {
        where: { bomId: id, ...(user?.companyId ? { companyId: user.companyId } : {}) },
      });
      if (!bom) throw new NotFoundException(`BOM ${id} not found`);

      Object.assign(bom, {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : bom.effectiveFrom,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : bom.effectiveTo,
        updatedBy: user?.userId || user?.email,
      });
      delete (bom as any).items;
      const savedBom = await manager.save(BillOfMaterial, bom);

      if (dto.items) {
        await manager.delete(BomItem, { bomId: id });
        const items = dto.items.map((item, idx) =>
          manager.create(BomItem, {
            bomId: id,
            materialId: item.materialId,
            materialName: item.materialName,
            quantity: item.quantity,
            uom: item.uom,
            wastagePercent: item.wastagePercent || 0,
            remarks: item.remarks,
            sortOrder: item.sortOrder ?? idx,
          }),
        );
        await manager.save(BomItem, items);
      }

      return savedBom;
    });
  }

  async deleteBom(id: string, user: any): Promise<{ deleted: boolean }> {
    const bom = await this.bomRepository.findOne({
      where: { bomId: id, ...(user?.companyId ? { companyId: user.companyId } : {}) },
    });
    if (!bom) throw new NotFoundException(`BOM ${id} not found`);

    if (bom.status === BomStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active BOM. Set it to inactive first.');
    }

    await this.bomItemRepository.delete({ bomId: id });
    await this.bomRepository.remove(bom);
    return { deleted: true };
  }

  async findBomByProduct(productId: string, companyId?: string): Promise<BillOfMaterial[]> {
    const where: FindOptionsWhere<BillOfMaterial> = { productId, status: BomStatus.ACTIVE };
    if (companyId) where.companyId = companyId;

    return this.bomRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}
