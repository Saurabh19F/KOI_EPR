import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PoTrackingStatus {
  PO_CREATED = 'po_created',
  VENDOR_CONFIRMED = 'vendor_confirmed',
  IN_PRODUCTION = 'in_production',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  AT_PORT = 'at_port',
  CUSTOMS_CLEARANCE = 'customs_clearance',
  DELIVERED = 'delivered',
  RECEIVED = 'received',
  DELAYED = 'delayed',
}

@Entity('po_tracking')
@Index(['purchaseOrderId'])
@Index(['trackingNumber'], { unique: true })
export class PoTracking {
  @PrimaryGeneratedColumn('uuid')
  trackingId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column()
  purchaseOrderId: string;

  @Column({ nullable: true })
  purchaseOrderNo: string;

  @Column({ nullable: true })
  salesEnquiryId: string;

  @Column({ nullable: true })
  salesEnquiryNo: string;

  @Column({ nullable: true })
  vendorId: string;

  @Column({ nullable: true })
  vendorName: string;

  @Column({ nullable: true })
  buyerName: string;

  @Column({ nullable: true })
  country: string;

  // Shipment details
  @Column({ nullable: true })
  containerNumber: string;

  @Column({ nullable: true })
  blNumber: string; // Bill of Lading

  @Column({ nullable: true })
  shippingLine: string;

  @Column({ nullable: true })
  vesselName: string;

  @Column({ nullable: true })
  voyageNumber: string;

  @Column({ nullable: true })
  portOfLoading: string;

  @Column({ nullable: true })
  portOfDischarge: string;

  @Column({ nullable: true })
  transporterName: string;

  @Column({ nullable: true })
  lrNumber: string; // Lorry Receipt

  @Column({ nullable: true })
  vehicleNumber: string;

  // Dates
  @Column({ nullable: true })
  poDate: Date;

  @Column({ nullable: true })
  expectedDispatchDate: Date;

  @Column({ nullable: true })
  actualDispatchDate: Date;

  @Column({ nullable: true })
  expectedArrivalDate: Date;

  @Column({ nullable: true })
  actualArrivalDate: Date;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ nullable: true })
  delayDays: number;

  // Amounts
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'int', nullable: true })
  totalItems: number;

  @Column({ type: 'int', nullable: true })
  receivedItems: number;

  @Column({ type: 'int', nullable: true })
  pendingItems: number;

  @Column('text', { nullable: true })
  remarks: string;

  @Column({
    type: 'enum',
    enum: PoTrackingStatus,
    default: PoTrackingStatus.PO_CREATED,
  })
  status: PoTrackingStatus;

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
