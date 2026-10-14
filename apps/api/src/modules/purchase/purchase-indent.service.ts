import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseIndentItem, PurchaseIndentOrder, IndentStatus } from './entities/purchase-indent.entity';
import {
  CreatePurchaseIndentItemDto,
  UpdatePurchaseIndentItemDto,
  BulkCreateIndentDto,
  MarkIndentRaisedDto,
  IndentDashboardQueryDto,
} from './dto/purchase-indent.dto';

@Injectable()
export class PurchaseIndentService {
  constructor(
    @InjectRepository(PurchaseIndentItem)
    private indentItemRepo: Repository<PurchaseIndentItem>,
    @InjectRepository(PurchaseIndentOrder)
    private indentOrderRepo: Repository<PurchaseIndentOrder>,
    private dataSource: DataSource,
  ) {}

  // ============ INDENT ITEMS CRUD ============

  async createIndentItem(dto: CreatePurchaseIndentItemDto, userId?: string, companyId?: string) {
    const item = this.indentItemRepo.create({
      ...dto,
      companyId,
      createdBy: userId,
    });
    const saved = await this.indentItemRepo.save(item);
    await this.recalculateOrderTotals(dto.orderNo, companyId);
    return saved;
  }

  async bulkCreateIndents(dto: BulkCreateIndentDto, userId?: string, companyId?: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedItems: PurchaseIndentItem[] = [];

      for (const itemDto of dto.items) {
        const item = this.indentItemRepo.create({
          ...itemDto,
          enquiryOrderId: dto.enquiryOrderId,
          plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
          companyId,
          createdBy: userId,
        });
        const saved = await queryRunner.manager.save(item);
        savedItems.push(saved);
      }

      await queryRunner.commitTransaction();

      // Recalculate order totals for affected orders
      const orderNos = [...new Set(savedItems.map(i => i.orderNo).filter(Boolean))];
      for (const orderNo of orderNos) {
        await this.recalculateOrderTotals(orderNo, companyId);
      }

      return { count: savedItems.length, items: savedItems };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateIndentItem(id: string, dto: UpdatePurchaseIndentItemDto, userId?: string) {
    const item = await this.indentItemRepo.findOne({ where: { indentItemId: id } });
    if (!item) throw new NotFoundException('Indent item not found');

    if (dto.isIndentRaised !== undefined) {
      item.isIndentRaised = dto.isIndentRaised;
      item.indentStatus = dto.isIndentRaised ? IndentStatus.RAISED : IndentStatus.PENDING;
      if (dto.isIndentRaised) {
        item.indentRaisedAt = new Date();
        item.indentRaisedBy = userId;
      }
    }

    Object.assign(item, { ...dto, updatedBy: userId });
    const saved = await this.indentItemRepo.save(item);
    await this.recalculateOrderTotals(item.orderNo, item.companyId);
    return saved;
  }

  async markIndentRaised(id: string, dto: MarkIndentRaisedDto, userId?: string) {
    const item = await this.indentItemRepo.findOne({ where: { indentItemId: id } });
    if (!item) throw new NotFoundException('Indent item not found');

    item.isIndentRaised = true;
    item.indentStatus = IndentStatus.RAISED;
    item.purchaseQuoteId = dto.purchaseQuoteId;
    item.purchaseQuoteNo = dto.purchaseQuoteNo;
    item.indentRaisedAt = new Date();
    item.indentRaisedBy = userId;
    item.remarks = dto.remarks || item.remarks;
    item.updatedBy = userId;

    const saved = await this.indentItemRepo.save(item);
    await this.recalculateOrderTotals(item.orderNo, item.companyId);
    return saved;
  }

  async findIndentItemsByOrder(orderNo: string, companyId?: string) {
    return this.indentItemRepo.find({
      where: { orderNo, companyId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findIndentItemsByAssignee(assignedTo: string, companyId?: string) {
    return this.indentItemRepo.find({
      where: { assignedTo, companyId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ============ ORDER-LEVEL TRACKING ============

  private async recalculateOrderTotals(orderNo: string, companyId?: string) {
    if (!orderNo) return;

    const items = await this.indentItemRepo.find({
      where: { orderNo, companyId, isActive: true },
    });

    const totalItems = items.length;
    const totalRaised = items.filter(i => i.isIndentRaised).length;
    const totalNotRaised = totalItems - totalRaised;

    // Determine who it's pending from
    const pendingItems = items.filter(i => !i.isIndentRaised);
    const pendingPersons = [...new Set(pendingItems.map(i => i.assignedToName).filter(Boolean))];
    const pendingFrom = pendingPersons.join(', ');

    const status = totalNotRaised === 0
      ? 'completed'
      : totalRaised > 0 ? 'partial' : 'pending';

    let order = await this.indentOrderRepo.findOne({
      where: { orderNo, companyId },
    });

    if (order) {
      order.totalItems = totalItems;
      order.totalIndentRaised = totalRaised;
      order.totalIndentNotRaised = totalNotRaised;
      order.pendingFrom = pendingFrom;
      order.status = status;
      await this.indentOrderRepo.save(order);
    } else if (items.length > 0) {
      const firstItem = items[0];
      order = this.indentOrderRepo.create({
        companyId,
        enquiryOrderId: firstItem.enquiryOrderId,
        orderNo,
        orderDate: firstItem.orderDate,
        plannedDate: firstItem.plannedDate,
        salesPersonId: firstItem.salesPersonId,
        salesPersonName: firstItem.salesPersonName,
        totalItems,
        totalIndentRaised: totalRaised,
        totalIndentNotRaised: totalNotRaised,
        pendingFrom,
        status,
        createdBy: firstItem.createdBy,
      });
      await this.indentOrderRepo.save(order);
    }
  }

  // ============ DASHBOARD (Tab 1) ============

  async getIndentDashboard(query: IndentDashboardQueryDto, companyId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.indentOrderRepo.createQueryBuilder('o')
      .where('o.isActive = :active', { active: true });

    if (companyId) {
      qb.andWhere('o.companyId = :companyId', { companyId });
    }

    if (query.search) {
      qb.andWhere('(o.orderNo ILIKE :search OR o.salesPersonName ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.salesPersonName) {
      qb.andWhere('o.salesPersonName = :salesPerson', { salesPerson: query.salesPersonName });
    }

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }

    if (query.fromDate) {
      qb.andWhere('o.orderDate >= :fromDate', { fromDate: query.fromDate });
    }

    if (query.toDate) {
      qb.andWhere('o.orderDate <= :toDate', { toDate: query.toDate });
    }

    qb.orderBy('o.orderDate', 'DESC');

    const [orders, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // For each order, get per-person breakdown
    const dashboardData = await Promise.all(
      orders.map(async (order) => {
        const items = await this.indentItemRepo.find({
          where: { orderNo: order.orderNo, companyId, isActive: true },
        });

        // Group by assignedToName
        const personBreakdown: Record<string, {
          totalPerItemOrder: number;
          indentRaisedPerItem: number;
          indentNotRaisedPerItem: number;
        }> = {};

        for (const item of items) {
          const person = item.assignedToName || 'Unassigned';
          if (!personBreakdown[person]) {
            personBreakdown[person] = {
              totalPerItemOrder: 0,
              indentRaisedPerItem: 0,
              indentNotRaisedPerItem: 0,
            };
          }
          personBreakdown[person].totalPerItemOrder++;
          if (item.isIndentRaised) {
            personBreakdown[person].indentRaisedPerItem++;
          } else {
            personBreakdown[person].indentNotRaisedPerItem++;
          }
        }

        return {
          ...order,
          personBreakdown,
        };
      }),
    );

    // Get all unique person names for column headers
    const allPersons = [...new Set(
      (await this.indentItemRepo
        .createQueryBuilder('i')
        .select('DISTINCT i.assignedToName', 'name')
        .where('i.companyId = :companyId', { companyId })
        .andWhere('i.isActive = true')
        .andWhere('i.assignedToName IS NOT NULL')
        .getRawMany()
      ).map((r: any) => r.name),
    )];

    return {
      data: dashboardData,
      persons: allPersons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============ REPORT (Tab 2) ============

  async getIndentReport(query: IndentDashboardQueryDto, companyId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 100;
    const skip = (page - 1) * limit;

    const qb = this.indentItemRepo.createQueryBuilder('i')
      .where('i.isActive = :active', { active: true });

    if (companyId) {
      qb.andWhere('i.companyId = :companyId', { companyId });
    }

    if (query.search) {
      qb.andWhere(
        '(i.orderNo ILIKE :search OR i.productCode ILIKE :search OR i.productName ILIKE :search OR i.productDescription ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.salesPersonName) {
      qb.andWhere('i.salesPersonName = :salesPerson', { salesPerson: query.salesPersonName });
    }

    if (query.assignedTo) {
      qb.andWhere('i.assignedToName = :assignedTo', { assignedTo: query.assignedTo });
    }

    if (query.status) {
      qb.andWhere('i.indentStatus = :status', { status: query.status });
    }

    if (query.fromDate) {
      qb.andWhere('i.orderDate >= :fromDate', { fromDate: query.fromDate });
    }

    if (query.toDate) {
      qb.andWhere('i.orderDate <= :toDate', { toDate: query.toDate });
    }

    qb.orderBy('i.orderDate', 'DESC')
      .addOrderBy('i.orderNo', 'ASC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: items.map(item => ({
        orderNo: item.orderNo,
        orderDate: item.orderDate,
        productCode: item.productCode,
        productName: item.productName,
        enquiryOrderId: item.enquiryOrderId,
        brandName: item.brandName,
        productDescription: item.productDescription,
        unitSize: item.unitSize,
        unitPerCarton: item.unitPerCarton,
        categoryName: item.categoryName,
        quantity: item.quantity,
        salesPersonName: item.salesPersonName,
        assignedToName: item.assignedToName,
        indentStatus: item.indentStatus,
        isIndentRaised: item.isIndentRaised,
        purchaseQuoteNo: item.purchaseQuoteNo,
        indentRaisedAt: item.indentRaisedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============ PENDANCY (Tab 3) ============

  async getIndentPendancy(companyId?: string) {
    const result = await this.indentItemRepo
      .createQueryBuilder('i')
      .select('i.assignedToName', 'personName')
      .addSelect('COUNT(DISTINCT i.orderNo)', 'totalPendingOrder')
      .addSelect('COUNT(i.indentItemId)', 'totalIndentPending')
      .where('i.isActive = :active', { active: true })
      .andWhere('i.isIndentRaised = :raised', { raised: false })
      .andWhere('i.assignedToName IS NOT NULL')
      .andWhere('i.companyId = :companyId', { companyId })
      .groupBy('i.assignedToName')
      .orderBy('i.assignedToName', 'ASC')
      .getRawMany();

    return result.map((row: any) => ({
      personName: row.personName,
      totalPendingOrder: parseInt(row.totalPendingOrder, 10) || 0,
      totalIndentPending: parseInt(row.totalIndentPending, 10) || 0,
    }));
  }

  // ============ SUMMARY STATS ============

  async getIndentStats(companyId?: string) {
    const baseWhere: any = { isActive: true };
    if (companyId) baseWhere.companyId = companyId;

    const totalItems = await this.indentItemRepo.count({ where: baseWhere });
    const raisedItems = await this.indentItemRepo.count({
      where: { ...baseWhere, isIndentRaised: true },
    });
    const pendingItems = totalItems - raisedItems;

    const totalOrders = await this.indentOrderRepo.count({ where: baseWhere });
    const completedOrders = await this.indentOrderRepo.count({
      where: { ...baseWhere, status: 'completed' },
    });
    const pendingOrders = totalOrders - completedOrders;

    return {
      totalItems,
      raisedItems,
      pendingItems,
      totalOrders,
      completedOrders,
      pendingOrders,
      raisedPercent: totalItems > 0 ? Math.round((raisedItems / totalItems) * 100) : 0,
    };
  }

  // ============ SYNC FROM SALES ENQUIRY ============

  async syncFromSalesEnquiry(enquiryOrderId: string, userId?: string, companyId?: string) {
    const enquiryOrder = await this.dataSource.query(
      `SELECT * FROM sales_enquiry_orders WHERE "enquiryOrderId" = $1 AND "companyId" = $2`,
      [enquiryOrderId, companyId],
    );

    if (!enquiryOrder || enquiryOrder.length === 0) {
      throw new NotFoundException('Sales enquiry order not found');
    }

    const order = enquiryOrder[0];

    const enquiryItems = await this.dataSource.query(
      `SELECT * FROM sales_enquiry_order_items WHERE "enquiryOrderId" = $1`,
      [enquiryOrderId],
    );

    if (!enquiryItems || enquiryItems.length === 0) {
      throw new BadRequestException('No items found in the sales enquiry order');
    }

    // Check if indent items already exist for this order
    const existingItems = await this.indentItemRepo.find({
      where: { enquiryOrderId, companyId },
    });

    if (existingItems.length > 0) {
      throw new BadRequestException('Indent items already exist for this order. Use update instead.');
    }

    // Create indent items from enquiry items
    const indentItems: PurchaseIndentItem[] = [];
    for (const eItem of enquiryItems) {
      const item = this.indentItemRepo.create({
        companyId,
        enquiryOrderId,
        orderNo: order.enquiryOrderNo,
        orderDate: order.enquiryDate,
        salesPersonId: order.salesPersonId,
        salesPersonName: order.salesPersonName || order.sales_person_name,
        enquiryItemId: eItem.itemId,
        productId: eItem.productId,
        productCode: eItem.productCode,
        productName: eItem.productName || eItem.manualProductName,
        productDescription: eItem.productDescription,
        unitSize: eItem.unitSize,
        unitPerCarton: eItem.unitPerCarton,
        brandName: eItem.brandName,
        categoryName: eItem.categoryName,
        quantity: eItem.quantity || 0,
        createdBy: userId,
      });
      indentItems.push(item);
    }

    const saved = await this.indentItemRepo.save(indentItems);
    await this.recalculateOrderTotals(order.enquiryOrderNo, companyId);

    return {
      count: saved.length,
      orderNo: order.enquiryOrderNo,
      items: saved,
    };
  }

  // ============ ASSIGN ITEMS TO PERSON ============

  async assignItemsToPerson(
    itemIds: string[],
    assignedTo: string,
    assignedToName: string,
    userId?: string,
  ) {
    const updated: PurchaseIndentItem[] = [];
    const orderNos = new Set<string>();

    for (const id of itemIds) {
      const item = await this.indentItemRepo.findOne({ where: { indentItemId: id } });
      if (item) {
        item.assignedTo = assignedTo;
        item.assignedToName = assignedToName;
        item.updatedBy = userId;
        const saved = await this.indentItemRepo.save(item);
        updated.push(saved);
        if (item.orderNo) orderNos.add(item.orderNo);
      }
    }

    // Recalculate affected orders
    for (const orderNo of orderNos) {
      const first = updated.find(i => i.orderNo === orderNo);
      await this.recalculateOrderTotals(orderNo, first?.companyId);
    }

    return { count: updated.length, items: updated };
  }
}
