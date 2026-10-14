import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Department } from './entities/department.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

const SYSTEM_PERMISSIONS: { code: string; name: string; module: string; action: string }[] = [
  { code: 'DASHBOARD_VIEW', name: 'View Dashboard', module: 'dashboard', action: 'view' },

  { code: 'MASTERS_VIEW', name: 'View Masters', module: 'masters', action: 'view' },
  { code: 'MASTERS_CREATE', name: 'Create Masters', module: 'masters', action: 'create' },
  { code: 'MASTERS_EDIT', name: 'Edit Masters', module: 'masters', action: 'edit' },
  { code: 'MASTERS_DELETE', name: 'Delete Masters', module: 'masters', action: 'delete' },

  { code: 'PRODUCTS_VIEW', name: 'View Products', module: 'products', action: 'view' },
  { code: 'PRODUCTS_CREATE', name: 'Create Products', module: 'products', action: 'create' },
  { code: 'PRODUCTS_EDIT', name: 'Edit Products', module: 'products', action: 'edit' },
  { code: 'PRODUCTS_DELETE', name: 'Delete Products', module: 'products', action: 'delete' },
  { code: 'PRODUCTS_REVIEW', name: 'Review Products', module: 'products', action: 'review' },

  { code: 'CUSTOMERS_VIEW', name: 'View Customers', module: 'customers', action: 'view' },
  { code: 'CUSTOMERS_CREATE', name: 'Create Customers', module: 'customers', action: 'create' },
  { code: 'CUSTOMERS_EDIT', name: 'Edit Customers', module: 'customers', action: 'edit' },
  { code: 'CUSTOMERS_DELETE', name: 'Delete Customers', module: 'customers', action: 'delete' },

  { code: 'VENDORS_VIEW', name: 'View Vendors', module: 'vendors', action: 'view' },
  { code: 'VENDORS_CREATE', name: 'Create Vendors', module: 'vendors', action: 'create' },
  { code: 'VENDORS_EDIT', name: 'Edit Vendors', module: 'vendors', action: 'edit' },
  { code: 'VENDORS_DELETE', name: 'Delete Vendors', module: 'vendors', action: 'delete' },

  { code: 'SALES_VIEW', name: 'View Sales', module: 'sales', action: 'view' },
  { code: 'SALES_CREATE', name: 'Create Sales', module: 'sales', action: 'create' },
  { code: 'SALES_EDIT', name: 'Edit Sales', module: 'sales', action: 'edit' },
  { code: 'SALES_DELETE', name: 'Delete Sales', module: 'sales', action: 'delete' },
  { code: 'SALES_APPROVE', name: 'Approve Sales', module: 'sales', action: 'approve' },

  { code: 'PURCHASE_VIEW', name: 'View Purchase', module: 'purchase', action: 'view' },
  { code: 'PURCHASE_CREATE', name: 'Create Purchase', module: 'purchase', action: 'create' },
  { code: 'PURCHASE_EDIT', name: 'Edit Purchase', module: 'purchase', action: 'edit' },
  { code: 'PURCHASE_DELETE', name: 'Delete Purchase', module: 'purchase', action: 'delete' },
  { code: 'PURCHASE_APPROVE', name: 'Approve Purchase', module: 'purchase', action: 'approve' },

  { code: 'RATE_VIEW', name: 'View Rate Analysis', module: 'rate', action: 'view' },
  { code: 'RATE_CREATE', name: 'Create Rate Analysis', module: 'rate', action: 'create' },
  { code: 'RATE_EDIT', name: 'Edit Rate Analysis', module: 'rate', action: 'edit' },
  { code: 'RATE_DELETE', name: 'Delete Rate Analysis', module: 'rate', action: 'delete' },
  { code: 'RATE_APPROVE', name: 'Approve Rate', module: 'rate', action: 'approve' },
  { code: 'RATE_LOCK', name: 'Lock Rate', module: 'rate', action: 'lock' },

  { code: 'FMS_VIEW', name: 'View FMS', module: 'fms', action: 'view' },
  { code: 'FMS_CREATE', name: 'Create FMS', module: 'fms', action: 'create' },
  { code: 'FMS_EDIT', name: 'Edit FMS', module: 'fms', action: 'edit' },
  { code: 'FMS_ASSIGN', name: 'Assign FMS', module: 'fms', action: 'assign' },

  { code: 'REPORTS_VIEW', name: 'View Reports', module: 'reports', action: 'view' },
  { code: 'REPORTS_EXPORT', name: 'Export Reports', module: 'reports', action: 'export' },

  { code: 'ADMIN_USERS', name: 'Manage Users', module: 'admin', action: 'users' },
  { code: 'ADMIN_ROLES', name: 'Manage Roles', module: 'admin', action: 'roles' },
  { code: 'ADMIN_SETTINGS', name: 'System Settings', module: 'admin', action: 'settings' },

  { code: 'LABELS_VIEW', name: 'View Labels', module: 'labels', action: 'view' },
  { code: 'LABELS_CREATE', name: 'Create Labels', module: 'labels', action: 'create' },
  { code: 'LABELS_EDIT', name: 'Edit Labels', module: 'labels', action: 'edit' },

  { code: 'RECEIVING_PLAN_VIEW', name: 'View Receiving Plans', module: 'receiving-plan', action: 'view' },
  { code: 'RECEIVING_PLAN_CREATE', name: 'Create Receiving Plan', module: 'receiving-plan', action: 'create' },
  { code: 'RECEIVING_PLAN_EDIT', name: 'Edit Receiving Plan', module: 'receiving-plan', action: 'edit' },
  { code: 'RECEIVING_PLAN_DELETE', name: 'Delete Receiving Plan', module: 'receiving-plan', action: 'delete' },

  { code: 'PRODUCTION_VIEW', name: 'View Production', module: 'production', action: 'view' },
  { code: 'PRODUCTION_CREATE', name: 'Create Production Job', module: 'production', action: 'create' },
  { code: 'PRODUCTION_EDIT', name: 'Edit Production', module: 'production', action: 'edit' },
  { code: 'PRODUCTION_DELETE', name: 'Delete Production', module: 'production', action: 'delete' },

  { code: 'QUALITY_VIEW', name: 'View Quality Logs', module: 'quality', action: 'view' },
  { code: 'QUALITY_CREATE', name: 'Create Quality Log', module: 'quality', action: 'create' },
  { code: 'QUALITY_EDIT', name: 'Edit Quality Log', module: 'quality', action: 'edit' },
  { code: 'QUALITY_DELETE', name: 'Delete Quality Log', module: 'quality', action: 'delete' },

  { code: 'REJECT_ACTION_VIEW', name: 'View Reject Actions', module: 'quality', action: 'view' },
  { code: 'REJECT_ACTION_CREATE', name: 'Create Reject Action', module: 'quality', action: 'create' },
  { code: 'REJECT_ACTION_EDIT', name: 'Edit Reject Action', module: 'quality', action: 'edit' },

  { code: 'STOCK_ADJUSTMENT_VIEW', name: 'View Stock Adjustments', module: 'stock-adjustment', action: 'view' },
  { code: 'STOCK_ADJUSTMENT_CREATE', name: 'Create Stock Adjustment', module: 'stock-adjustment', action: 'create' },

  { code: 'ERROR_LOG_VIEW', name: 'View Error Logs', module: 'system-error-log', action: 'view' },
  { code: 'ERROR_LOG_CREATE', name: 'Create Error Log', module: 'system-error-log', action: 'create' },
  { code: 'ERROR_LOG_DELETE', name: 'Clear Error Logs', module: 'system-error-log', action: 'delete' },

  { code: 'ACCOUNTS_VIEW', name: 'View Accounts', module: 'accounts', action: 'view' },
  { code: 'ACCOUNTS_CREATE', name: 'Create Ledger Entry', module: 'accounts', action: 'create' },
  { code: 'ACCOUNTS_APPROVE', name: 'Approve Ledger Entry', module: 'accounts', action: 'approve' },

  { code: 'INVENTORY_VIEW', name: 'View Inventory', module: 'inventory', action: 'view' },
  { code: 'INVENTORY_CREATE', name: 'Create Inventory Entry', module: 'inventory', action: 'create' },
  { code: 'INVENTORY_EDIT', name: 'Edit Inventory', module: 'inventory', action: 'edit' },
  { code: 'INVENTORY_TRANSFER', name: 'Transfer Stock', module: 'inventory', action: 'transfer' },
];

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission, Department])],
  controllers: [UsersController, RolesController, DepartmentsController],
  providers: [UsersService, RolesService, DepartmentsService],
  exports: [UsersService, RolesService, DepartmentsService],
})
export class UsersModule implements OnModuleInit {
  private readonly logger = new Logger(UsersModule.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    let created = 0;
    for (const p of SYSTEM_PERMISSIONS) {
      const exists = await this.permissionRepo.findOne({ where: { permissionCode: p.code } });
      if (!exists) {
        await this.permissionRepo.save(
          this.permissionRepo.create({
            permissionCode: p.code,
            permissionName: p.name,
            moduleName: p.module,
            action: p.action,
          }),
        );
        created++;
      }
    }
    if (created > 0) {
      this.logger.log(`Auto-synced ${created} missing permissions to database`);
    }

    await this.ensureAdminRolePermissions();
  }

  private async ensureAdminRolePermissions() {
    const adminRole = await this.roleRepo.findOne({
      where: { roleCode: 'ADMIN' },
      relations: ['permissions'],
    });
    if (!adminRole) return;

    const allPermissions = await this.permissionRepo.find();
    const existingIds = new Set(adminRole.permissions.map(p => p.permissionId));
    const missing = allPermissions.filter(p => !existingIds.has(p.permissionId));

    if (missing.length > 0) {
      adminRole.permissions = [...adminRole.permissions, ...missing];
      await this.roleRepo.save(adminRole);
      this.logger.log(`Assigned ${missing.length} missing permissions to ADMIN role`);
    }
  }
}
