import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POLedgerEntry, POLedgerStatus } from './entities/po-ledger.entity';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, GoodsReceiptNote, GoodsReceiptNoteItem, PurchaseInvoice, PurchaseInvoiceItem } from '../purchase-order/entities/purchase-order.entity';
import { PurchaseIndentOrder, PurchaseIndentItem } from '../purchase/entities/purchase-indent.entity';
import { UploadLedgerDto, UpdateLedgerDto, ApproveLedgerDto, RejectLedgerDto } from './dto/accounts.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(POLedgerEntry)
    private readonly ledgerRepository: Repository<POLedgerEntry>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(GoodsReceiptNote)
    private readonly grnRepository: Repository<GoodsReceiptNote>,
    @InjectRepository(GoodsReceiptNoteItem)
    private readonly grnItemRepository: Repository<GoodsReceiptNoteItem>,
    @InjectRepository(PurchaseInvoice)
    private readonly invoiceRepository: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceItem)
    private readonly invoiceItemRepository: Repository<PurchaseInvoiceItem>,
    @InjectRepository(PurchaseIndentOrder)
    private readonly indentOrderRepo: Repository<PurchaseIndentOrder>,
    @InjectRepository(PurchaseIndentItem)
    private readonly indentItemRepo: Repository<PurchaseIndentItem>,
  ) {}

  async getPendingForLedger(
    companyId: string,
    params: { page?: number; limit?: number; search?: string },
  ): Promise<PaginatedResult<any>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.poRepository.createQueryBuilder('po')
      .where('po.companyId = :companyId', { companyId })
      .andWhere('po.status = :status', { status: PurchaseOrderStatus.APPROVED })
      .andWhere('po.isActive = true')
      .andWhere(
        `CAST("po"."order_id" AS text) NOT IN (
          SELECT ple.order_id FROM po_ledger_entries ple
          WHERE ple.company_id = :companyId AND ple.is_active = true
        )`,
      );

    if (params.search) {
      qb.andWhere(
        '(po.orderNumber ILIKE :search OR po.vendorName ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('po.orderDate', 'DESC');

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLedgerEntries(
    companyId: string,
    params: { page?: number; limit?: number; status?: string; search?: string },
  ): Promise<PaginatedResult<POLedgerEntry>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.ledgerRepository.createQueryBuilder('ple')
      .where('ple.companyId = :companyId', { companyId })
      .andWhere('ple.isActive = true');

    if (params.status) {
      qb.andWhere('ple.status = :status', { status: params.status });
    }

    if (params.search) {
      qb.andWhere(
        '(ple.orderNumber ILIKE :search OR ple.vendorName ILIKE :search OR ple.ledgerNumber ILIKE :search OR ple.enquiryNo ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('ple.createdAt', 'DESC');

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLedgerEntry(id: string, companyId: string): Promise<POLedgerEntry> {
    const entry = await this.ledgerRepository.findOne({
      where: { ledgerEntryId: id, companyId, isActive: true },
    });
    if (!entry) throw new NotFoundException('Ledger entry not found');
    return entry;
  }

  async getPODetails(orderId: string, companyId: string) {
    const po = await this.poRepository.findOne({
      where: { orderId, companyId, isActive: true },
      relations: ['items'],
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async uploadLedger(dto: UploadLedgerDto, userId: string, userName: string, companyId: string): Promise<POLedgerEntry> {
    const po = await this.poRepository.findOne({
      where: { orderId: dto.orderId, companyId, isActive: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const existing = await this.ledgerRepository.findOne({
      where: { orderId: dto.orderId, companyId, isActive: true },
    });
    if (existing) throw new BadRequestException('Ledger entry already exists for this PO');

    const entry = this.ledgerRepository.create({
      companyId,
      orderId: po.orderId,
      orderNumber: po.orderNumber,
      enquiryNo: po.enquiryNo,
      salesEnquiryId: po.salesEnquiryId,
      vendorName: po.vendorName,
      poAmount: po.totalAmount,
      poDate: po.orderDate,
      poPdfUrl: po.poUrl,
      ledgerNumber: dto.ledgerNumber,
      ledgerDate: dto.ledgerDate ? new Date(dto.ledgerDate) : new Date(),
      ledgerPdfUrl: dto.ledgerPdfUrl,
      ledgerFileName: dto.ledgerFileName,
      ledgerAmount: dto.ledgerAmount,
      accountHeadName: dto.accountHeadName,
      accountantRemarks: dto.accountantRemarks,
      accountantId: userId,
      accountantName: userName,
      uploadedAt: new Date(),
      actualDate: new Date(),
      status: POLedgerStatus.LEDGER_UPLOADED,
      createdBy: userId,
    });

    return this.ledgerRepository.save(entry);
  }

  async updateLedger(id: string, dto: UpdateLedgerDto, userId: string, companyId: string): Promise<POLedgerEntry> {
    const entry = await this.getLedgerEntry(id, companyId);

    if (entry.status === POLedgerStatus.APPROVED) {
      throw new BadRequestException('Cannot update an approved ledger entry');
    }

    Object.assign(entry, {
      ...dto,
      ledgerDate: dto.ledgerDate ? new Date(dto.ledgerDate) : entry.ledgerDate,
      updatedBy: userId,
    });

    if (entry.status === POLedgerStatus.REJECTED) {
      entry.status = POLedgerStatus.LEDGER_UPLOADED;
      entry.rejectedAt = null;
      entry.rejectionReason = null;
    }

    return this.ledgerRepository.save(entry);
  }

  async approveLedger(id: string, dto: ApproveLedgerDto, userId: string, userName: string, companyId: string): Promise<POLedgerEntry> {
    const entry = await this.getLedgerEntry(id, companyId);

    if (entry.status !== POLedgerStatus.LEDGER_UPLOADED) {
      throw new BadRequestException('Only uploaded ledgers can be approved');
    }

    entry.status = POLedgerStatus.APPROVED;
    entry.chiefAccountantId = userId;
    entry.chiefAccountantName = userName;
    entry.chiefAccountantRemarks = dto.chiefAccountantRemarks;
    entry.approvedAt = new Date();
    entry.approvalActualDate = new Date();
    entry.updatedBy = userId;

    return this.ledgerRepository.save(entry);
  }

  async rejectLedger(id: string, dto: RejectLedgerDto, userId: string, userName: string, companyId: string): Promise<POLedgerEntry> {
    const entry = await this.getLedgerEntry(id, companyId);

    if (entry.status !== POLedgerStatus.LEDGER_UPLOADED) {
      throw new BadRequestException('Only uploaded ledgers can be rejected');
    }

    entry.status = POLedgerStatus.REJECTED;
    entry.chiefAccountantId = userId;
    entry.chiefAccountantName = userName;
    entry.chiefAccountantRemarks = dto.chiefAccountantRemarks;
    entry.rejectionReason = dto.rejectionReason;
    entry.rejectedAt = new Date();
    entry.updatedBy = userId;

    return this.ledgerRepository.save(entry);
  }

  async getStats(companyId: string) {
    const [pending, uploaded, approved, rejected] = await Promise.all([
      this.ledgerRepository.count({ where: { companyId, status: POLedgerStatus.PENDING, isActive: true } }),
      this.ledgerRepository.count({ where: { companyId, status: POLedgerStatus.LEDGER_UPLOADED, isActive: true } }),
      this.ledgerRepository.count({ where: { companyId, status: POLedgerStatus.APPROVED, isActive: true } }),
      this.ledgerRepository.count({ where: { companyId, status: POLedgerStatus.REJECTED, isActive: true } }),
    ]);

    const pendingPOs = await this.poRepository.createQueryBuilder('po')
      .where('po.companyId = :companyId', { companyId })
      .andWhere('po.status = :status', { status: PurchaseOrderStatus.APPROVED })
      .andWhere('po.isActive = true')
      .andWhere(
        `CAST("po"."order_id" AS text) NOT IN (
          SELECT ple.order_id FROM po_ledger_entries ple
          WHERE ple.company_id = :companyId AND ple.is_active = true
        )`,
      )
      .getCount();

    return {
      pendingPOs,
      uploaded,
      pendingApproval: uploaded,
      approved,
      rejected,
      total: pending + uploaded + approved + rejected,
    };
  }

  async getIndentToPO(
    companyId: string,
    params: { page?: number; limit?: number; search?: string },
  ): Promise<PaginatedResult<any>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.indentOrderRepo.createQueryBuilder('io')
      .where('io.isActive = true');

    if (companyId) {
      qb.andWhere('io.companyId = :companyId', { companyId });
    }

    if (params.search) {
      qb.andWhere(
        '(io.orderNo ILIKE :search OR io.salesPersonName ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('io.orderDate', 'DESC');

    const [orders, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const data = await Promise.all(
      orders.map(async (order) => {
        const items = await this.indentItemRepo.find({
          where: { orderNo: order.orderNo, companyId, isActive: true },
        });

        const purchaseQuoteNos = [...new Set(
          items
            .filter(i => i.purchaseQuoteNo)
            .map(i => i.purchaseQuoteNo),
        )];

        const pos = await this.poRepository.createQueryBuilder('po')
          .where('po.companyId = :companyId', { companyId })
          .andWhere(
            '(po.enquiryNo = :enquiryNo OR po.salesEnquiryId = :enquiryOrderId)',
            { enquiryNo: order.orderNo, enquiryOrderId: order.enquiryOrderId || order.orderNo },
          )
          .andWhere('po.isActive = true')
          .orderBy('po.orderDate', 'DESC')
          .getMany();

        const ledgerEntries = pos.length > 0
          ? await this.ledgerRepository.find({
              where: pos.map(po => ({ orderId: po.orderId, companyId, isActive: true })),
            })
          : [];

        const ledgerMap: Record<string, any> = {};
        for (const le of ledgerEntries) {
          ledgerMap[le.orderId] = le;
        }

        return {
          ...order,
          indentItems: items.map(i => ({
            indentItemId: i.indentItemId,
            productName: i.productName,
            productCode: i.productCode,
            quantity: i.quantity,
            assignedToName: i.assignedToName,
            indentStatus: i.indentStatus,
            isIndentRaised: i.isIndentRaised,
            purchaseQuoteNo: i.purchaseQuoteNo,
            indentRaisedAt: i.indentRaisedAt,
          })),
          purchaseQuoteNos,
          purchaseOrders: pos.map(po => ({
            orderId: po.orderId,
            orderNumber: po.orderNumber,
            vendorName: po.vendorName,
            totalAmount: po.totalAmount,
            orderDate: po.orderDate,
            status: po.status,
            purchasePerson: po.purchasePerson,
            poUrl: po.poUrl,
            ledger: ledgerMap[po.orderId] ? {
              ledgerEntryId: ledgerMap[po.orderId].ledgerEntryId,
              ledgerNumber: ledgerMap[po.orderId].ledgerNumber,
              status: ledgerMap[po.orderId].status,
              accountantName: ledgerMap[po.orderId].accountantName,
            } : null,
          })),
          totalIndentItems: items.length,
          raisedCount: items.filter(i => i.isIndentRaised).length,
          poCount: pos.length,
        };
      }),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getThreeWayMatch(
    companyId: string,
    params: { page?: number; limit?: number; search?: string },
  ): Promise<PaginatedResult<any>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.poRepository.createQueryBuilder('po')
      .where('po.companyId = :companyId', { companyId })
      .andWhere('po.isActive = true')
      .andWhere('po.status IN (:...statuses)', { statuses: [PurchaseOrderStatus.APPROVED, 'completed'] });

    if (params.search) {
      qb.andWhere(
        '(po.orderNumber ILIKE :search OR po.vendorName ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('po.orderDate', 'DESC');
    const [orders, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const data = await Promise.all(
      orders.map(async (po) => {
        const poItems = await this.poItemRepository.find({
          where: { orderId: po.orderId, companyId },
        });

        const grns = await this.grnRepository.find({
          where: { orderId: po.orderId, companyId },
        });

        const grnItems = grns.length > 0
          ? await this.grnItemRepository.find({
              where: grns.map(g => ({ grnId: g.grnId, companyId })),
            })
          : [];

        const invoices = await this.invoiceRepository.find({
          where: { orderId: po.orderId, companyId },
        });

        const invoiceItems = invoices.length > 0
          ? await this.invoiceItemRepository.find({
              where: invoices.map(inv => ({ invoiceId: inv.invoiceId, companyId })),
            })
          : [];

        const lineMatches = poItems.map(poItem => {
          const matchingGrnItems = grnItems.filter(g => g.orderItemId === poItem.itemId);
          const matchingInvItems = invoiceItems.filter(i => i.orderItemId === poItem.itemId);

          const orderedQty = Number(poItem.quantity || 0);
          const receivedQty = matchingGrnItems.reduce((s, g) => s + Number(g.receivedQuantity || 0), 0);
          const acceptedQty = matchingGrnItems.reduce((s, g) => s + Number(g.acceptedQuantity || 0), 0);
          const invoicedQty = matchingInvItems.reduce((s, i) => s + Number(i.quantity || 0), 0);

          const poUnitPrice = Number(poItem.unitPrice || 0);
          const invoiceUnitPrice = matchingInvItems.length > 0 ? Number(matchingInvItems[0].unitPrice || 0) : 0;
          const priceMismatch = matchingInvItems.length > 0 && Math.abs(poUnitPrice - invoiceUnitPrice) > 0.01;

          const qtyMismatch = orderedQty !== receivedQty || receivedQty !== invoicedQty;
          const status = !qtyMismatch && !priceMismatch ? 'matched' :
                         priceMismatch ? 'price_mismatch' : 'qty_mismatch';

          return {
            productName: poItem.productName,
            productCode: poItem.productCode,
            hsnCode: poItem.hsnCode,
            orderedQty,
            receivedQty,
            acceptedQty,
            invoicedQty,
            poUnitPrice,
            invoiceUnitPrice,
            poLineTotal: Number(poItem.totalAmount || 0),
            invoiceLineTotal: matchingInvItems.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
            status,
          };
        });

        const allMatched = lineMatches.every(l => l.status === 'matched');
        const hasInvoice = invoices.length > 0;
        const hasGrn = grns.length > 0;

        const matchStatus = !hasGrn && !hasInvoice ? 'pending' :
                            !hasGrn ? 'grn_missing' :
                            !hasInvoice ? 'invoice_missing' :
                            allMatched ? 'matched' : 'mismatch';

        return {
          orderId: po.orderId,
          orderNumber: po.orderNumber,
          vendorName: po.vendorName,
          orderDate: po.orderDate,
          poTotal: Number(po.totalAmount || 0),
          grnCount: grns.length,
          grnTotal: grns.reduce((s, g) => s + Number(g.totalAmount || 0), 0),
          invoiceCount: invoices.length,
          invoiceTotal: invoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0),
          matchStatus,
          lineMatches,
        };
      }),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
