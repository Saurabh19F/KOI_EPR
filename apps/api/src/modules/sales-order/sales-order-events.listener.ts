import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource, In } from 'typeorm';
import { SalesOrder, SalesOrderItem } from './entities/sales-order.entity';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from '../purchase-order/entities/purchase-order.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesOrderEventsListener {
  private readonly logger = new Logger(SalesOrderEventsListener.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent('sales-order.confirmed')
  async handleSalesOrderConfirmed(payload: {
    orderId: string;
    companyId: string;
    userId: string;
  }): Promise<void> {
    try {
      await this.generatePurchaseOrders(payload.orderId, payload.companyId, payload.userId);
    } catch (error) {
      this.logger.error(
        `Failed to auto-generate POs for SO ${payload.orderId}: ${error.message}`,
        error.stack,
      );
    }
  }

  async generatePurchaseOrders(
    orderId: string,
    companyId: string,
    userId: string,
  ): Promise<PurchaseOrder[]> {
    const orderRepo = this.dataSource.getRepository(SalesOrder);
    const itemRepo = this.dataSource.getRepository(SalesOrderItem);
    const poRepo = this.dataSource.getRepository(PurchaseOrder);

    const whereOrder: any = { orderId };
    if (companyId) whereOrder.companyId = companyId;
    const order = await orderRepo.findOne({ where: whereOrder });
    if (!order) {
      this.logger.warn(`SO ${orderId} not found, skipping PO generation`);
      return [];
    }

    const effectiveCompanyId = companyId || order.companyId;

    // Skip if POs already exist for this SO
    const existingWhere: any = { soNo: order.orderNumber };
    if (effectiveCompanyId) existingWhere.companyId = effectiveCompanyId;
    const existingPOs = await poRepo.find({ where: existingWhere });
    if (existingPOs.length > 0) {
      this.logger.warn(`POs already exist for SO ${order.orderNumber}, skipping`);
      return existingPOs;
    }

    const itemWhere: any = { orderId, isActive: true };
    if (effectiveCompanyId) itemWhere.companyId = effectiveCompanyId;
    const items = await itemRepo.find({
      where: itemWhere,
      order: { lineNumber: 'ASC' },
    });

    if (!items.length) {
      this.logger.warn(`SO ${order.orderNumber} has no items, skipping PO generation`);
      return;
    }

    // Group items by purchasePersonId
    const grouped = new Map<string, SalesOrderItem[]>();
    for (const item of items) {
      const key = item.purchasePersonId || 'unassigned';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }

    if (grouped.size === 0) return;

    // Look up actual user names for all purchase person IDs
    const userIds = [...grouped.keys()].filter(k => k !== 'unassigned');
    const userRepo = this.dataSource.getRepository(User);
    const userNameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const users = await userRepo.find({ where: { userId: In(userIds) }, select: ['userId', 'name'] });
      for (const u of users) {
        userNameMap.set(u.userId, u.name);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdPOs: PurchaseOrder[] = [];
      const baseNumber = await this.getNextPOSequence(effectiveCompanyId);
      let poIndex = 0;

      for (const [purchasePersonId, soItems] of grouped) {
        const poNumber = this.formatPONumber(baseNumber + poIndex);
        poIndex++;
        const purchasePersonName = userNameMap.get(purchasePersonId) || soItems[0].purchasePersonName || 'Unassigned';

        const po = queryRunner.manager.create(PurchaseOrder, {
          orderNumber: poNumber,
          salesEnquiryId: order.enquiryId,
          orderDate: new Date(),
          expectedDeliveryDate: order.expectedDeliveryDate,
          purchasePersonId: purchasePersonId !== 'unassigned' ? purchasePersonId : null,
          purchasePerson: purchasePersonId !== 'unassigned' ? purchasePersonName : null,
          vendorName: 'TBD',
          billingAddress: order.billingAddress,
          shippingAddress: order.shippingAddress,
          currencyId: order.currencyId,
          currencyCode: order.currencyCode,
          exchangeRate: order.exchangeRate,
          enquiryNo: order.enquiryId,
          soNo: order.orderNumber,
          notes: `Auto-generated from Sales Order ${order.orderNumber}`,
          status: PurchaseOrderStatus.DRAFT,
          companyId: effectiveCompanyId,
          createdBy: userId,
        });

        const savedPO = await queryRunner.manager.save(po);

        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        for (let i = 0; i < soItems.length; i++) {
          const soItem = soItems[i];
          const quantity = Number(soItem.quantity || 0);
          const unitPrice = Number(soItem.buyingBestLandingRate || soItem.landingCost || soItem.unitPrice || 0);
          const taxableAmount = quantity * unitPrice;
          const gstRate = Number(soItem.gstRate || 18);
          const cgstAmount = taxableAmount * (gstRate / 2) / 100;
          const sgstAmount = taxableAmount * (gstRate / 2) / 100;
          const igstAmount = taxableAmount * gstRate / 100;
          const taxAmount = cgstAmount + sgstAmount;
          const totalAmount = taxableAmount + taxAmount;

          const poItem = queryRunner.manager.create(PurchaseOrderItem, {
            orderId: savedPO.orderId,
            lineNumber: i + 1,
            productId: soItem.productId,
            productName: soItem.productName,
            productCode: soItem.productCode,
            sku: soItem.sku,
            hsnCode: soItem.hsnCode,
            uomName: soItem.uomName,
            orderQty: quantity,
            quantity,
            balanceQty: quantity,
            unitPrice,
            taxableAmount,
            gstRate,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount,
            totalAmount,
            description: soItem.description,
            enquiryNo: soItem.enquiryNo,
            soNo: order.orderNumber,
            location: soItem.location,
            companyId: effectiveCompanyId,
            createdBy: userId,
          });

          await queryRunner.manager.save(poItem);

          subtotal += taxableAmount;
          totalCgst += cgstAmount;
          totalSgst += sgstAmount;
          totalIgst += igstAmount;
        }

        const taxAmount = totalCgst + totalSgst + totalIgst;
        const totalAmount = subtotal + taxAmount;

        await queryRunner.manager.update(PurchaseOrder, savedPO.orderId, {
          subtotal,
          cgstAmount: totalCgst,
          sgstAmount: totalSgst,
          igstAmount: totalIgst,
          taxAmount,
          totalAmount,
        });

        savedPO.subtotal = subtotal;
        savedPO.totalAmount = totalAmount;
        createdPOs.push(savedPO);

        // Notify the purchase person
        if (purchasePersonId !== 'unassigned') {
          await this.notificationsService.createNotification({
            companyId: effectiveCompanyId,
            userId: purchasePersonId,
            title: 'New Purchase Order Assigned',
            message: `Purchase Order ${poNumber} has been auto-generated from Sales Order ${order.orderNumber} (${order.customerName}). ${soItems.length} item(s) assigned to you. Please review and assign vendor.`,
            moduleName: 'purchase_order',
            recordId: savedPO.orderId,
            notificationType: 'in_app',
          });
        }
      }

      await queryRunner.commitTransaction();

      // Update sales order status to purchase_in_progress
      if (createdPOs.length > 0) {
        await orderRepo.update(orderId, { status: 'purchase_in_progress' as any });
      }

      this.logger.log(
        `Auto-generated ${createdPOs.length} PO(s) from SO ${order.orderNumber}: ${createdPOs.map(po => po.orderNumber).join(', ')}`,
      );

      return createdPOs;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getNextPOSequence(companyId: string): Promise<number> {
    const poRepo = this.dataSource.getRepository(PurchaseOrder);
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const lastRecords = await poRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (lastRecords.length > 0) {
      const parts = lastRecords[0].orderNumber.split('/');
      const numPart = parts[parts.length - 1];
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed)) return parsed + 1;
    }

    return 1;
  }

  private formatPONumber(seq: number): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    const fy = `${fyStartYear.toString().slice(-2)}-${fyEndYear.toString().slice(-2)}`;
    return `KOI/PO/${fy}/${seq.toString().padStart(5, '0')}`;
  }
}
