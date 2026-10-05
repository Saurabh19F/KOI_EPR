'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  BarChart3,
  FileText,
  Settings2,
  Settings,
  ChevronDown,
  LogOut,
  Activity,
  Wrench,
  Warehouse,
  Tag,
  Palette,
  CheckSquare,
  PackageSearch,
  BookOpen,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { KoiLogo } from '@/components/brand/KoiLogo';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  badge?: number;
  roles?: string[];
  permissions?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Masters',
    href: '/dashboard/masters',
    icon: Package,
    permissions: ['MASTERS_VIEW'],
    children: [
      { title: 'Products', href: '/dashboard/masters/products', permissions: ['MASTERS_VIEW'] },
      { title: 'Customers', href: '/dashboard/masters/customers', permissions: ['MASTERS_VIEW'] },
      { title: 'Vendors', href: '/dashboard/masters/vendors', permissions: ['MASTERS_VIEW'] },
      { title: 'Packing', href: '/dashboard/masters/packing', permissions: ['MASTERS_VIEW'] },
    ],
  },
  {
    title: 'Sales',
    href: '/dashboard/sales',
    icon: TrendingUp,
    permissions: ['SALES_VIEW'],
    children: [
      { title: 'Sales Enquiry', href: '/dashboard/sales', permissions: ['SALES_VIEW'] },
      { title: 'Sales Order List', href: '/dashboard/sales/quotations', permissions: ['SALES_VIEW'] },
      { title: 'Sales Orders', href: '/dashboard/sales/orders', permissions: ['SALES_VIEW'] },
      { title: 'Delivery Notes', href: '/dashboard/sales/delivery-notes', permissions: ['SALES_VIEW'] },
      { title: 'Sales Invoices', href: '/dashboard/sales/invoices', permissions: ['SALES_VIEW'] },
    ],
  },
  {
    title: 'Purchase',
    href: '/dashboard/purchase',
    icon: ShoppingCart,
    permissions: ['PURCHASE_VIEW'],
    children: [
      { title: 'Indent Dashboard', href: '/dashboard/purchase/indent', permissions: ['PURCHASE_VIEW'] },
      { title: 'Purchase Quotes', href: '/dashboard/purchase', permissions: ['PURCHASE_VIEW'] },
      { title: 'Purchase Orders', href: '/dashboard/purchase/orders', permissions: ['PURCHASE_VIEW'] },
      { title: 'GRNs', href: '/dashboard/purchase/grns', permissions: ['PURCHASE_VIEW'] },
      { title: 'Purchase Invoices', href: '/dashboard/purchase/invoices', permissions: ['PURCHASE_VIEW'] },
      { title: 'Price Approval', href: '/dashboard/purchase/price-approval', permissions: ['PURCHASE_VIEW', 'RATE_APPROVE'] },
      { title: 'PO Approvals', href: '/dashboard/purchase/po-dashboard?tab=approvals', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Rate Calculation',
    href: '/dashboard/rate',
    icon: BarChart3,
    roles: ['ADMIN'],
    children: [
      { title: 'Price Analysis', href: '/dashboard/rate', roles: ['ADMIN'] },
      { title: 'Currency Rates', href: '/dashboard/rate/currency', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'FMS',
    href: '/dashboard/fms',
    icon: ClipboardList,
    permissions: ['FMS_VIEW'],
    children: [
      { title: 'Tasks', href: '/dashboard/fms', permissions: ['FMS_VIEW'] },
      { title: 'Designer FMS', href: '/dashboard/fms/designer', permissions: ['FMS_VIEW'] },
      { title: 'Quality FMS', href: '/dashboard/fms/quality', permissions: ['FMS_VIEW'] },
      { title: 'PO Tracking', href: '/dashboard/fms/po-tracking', permissions: ['FMS_VIEW'] },
    ],
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Warehouse,
    permissions: ['INVENTORY_VIEW', 'PURCHASE_VIEW'],
    children: [
      { title: 'Stock Overview', href: '/dashboard/inventory/stock', permissions: ['INVENTORY_VIEW', 'PURCHASE_VIEW'] },
      { title: 'Warehouses', href: '/dashboard/inventory/warehouses', permissions: ['INVENTORY_VIEW', 'PURCHASE_VIEW'] },
      { title: 'Stock Movements', href: '/dashboard/inventory/movements', permissions: ['INVENTORY_VIEW', 'PURCHASE_VIEW'] },
    ],
  },
  {
    title: 'Accounts',
    href: '/dashboard/accounts/accountant-review',
    icon: BookOpen,
    permissions: ['ACCOUNTS_VIEW'],
    children: [
      { title: 'Accountant Review', href: '/dashboard/accounts/accountant-review', permissions: ['ACCOUNTS_VIEW'] },
      { title: 'Approvals', href: '/dashboard/accounts/approvals', permissions: ['ACCOUNTS_VIEW', 'ACCOUNTS_APPROVE'] },
    ],
  },
  {
    title: 'Labels',
    href: '/dashboard/labels',
    icon: Tag,
    permissions: ['PURCHASE_VIEW', 'FMS_VIEW'],
  },
  {
    title: 'MIS Review',
    href: '/dashboard/mis',
    icon: Activity,
    roles: ['MIS_USER', 'MIS', 'ADMIN'],
    children: [
      { title: 'Enquiry Review', href: '/dashboard/mis', roles: ['MIS_USER', 'MIS', 'ADMIN'] },
    ],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    permissions: ['REPORTS_VIEW'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    children: [
      { title: 'Profile', href: '/dashboard/settings' },
      {
        title: 'Setup',
        href: '/dashboard/settings/setup',
        icon: Wrench,
        permissions: ['MASTERS_VIEW'],
        children: [
          { title: 'Brands', href: '/dashboard/masters/brands', permissions: ['MASTERS_VIEW'] },
          { title: 'Categories', href: '/dashboard/masters/categories', permissions: ['MASTERS_VIEW'] },
          { title: 'Segments', href: '/dashboard/masters/segments', permissions: ['MASTERS_VIEW'] },
          { title: 'Groups', href: '/dashboard/masters/groups', permissions: ['MASTERS_VIEW'] },
          { title: 'UOMs', href: '/dashboard/masters/uoms', permissions: ['MASTERS_VIEW'] },
          { title: 'GST Rates', href: '/dashboard/masters/gst-rates', permissions: ['MASTERS_VIEW'] },
          { title: 'Payment Terms', href: '/dashboard/masters/payment-terms', permissions: ['MASTERS_VIEW'] },
          { title: 'Zones', href: '/dashboard/masters/zones', permissions: ['MASTERS_VIEW'] },
          { title: 'Locations', href: '/dashboard/masters/locations', permissions: ['MASTERS_VIEW'] },
          { title: 'Countries', href: '/dashboard/masters/countries', permissions: ['MASTERS_VIEW'] },
          { title: 'Currencies', href: '/dashboard/masters/currencies', permissions: ['MASTERS_VIEW'] },
          { title: 'Currency Rates', href: '/dashboard/masters/currency-rates', permissions: ['MASTERS_VIEW'] },
          { title: 'Haulage', href: '/dashboard/masters/haulage', permissions: ['MASTERS_VIEW'] },
          { title: 'Ports', href: '/dashboard/masters/ports', permissions: ['MASTERS_VIEW'] },
        ],
      },
    ],
  },
  {
    title: 'Admin',
    href: '/dashboard/admin',
    icon: Settings2,
    roles: ['ADMIN'],
    children: [
      { title: 'Users', href: '/dashboard/admin/users', roles: ['ADMIN'] },
      { title: 'Roles', href: '/dashboard/admin/roles', roles: ['ADMIN'] },
      { title: 'Permissions', href: '/dashboard/admin/permissions', roles: ['ADMIN'] },
      { title: 'Settings', href: '/dashboard/admin/settings', roles: ['ADMIN'] },
    ],
  },
];

// Check if user has access to a nav item
function hasAccess(item: NavItem, user: any): boolean {
  if (!user) return false;

  // Admin has access to everything
  if (user.isSuperAdmin) return true;

  // Get user's roles - backend returns array of strings like ['ADMIN'] or ['SALES_USER']
  const userRoles = user.roles || [];
  const roleStrings = userRoles.map((r: any) => typeof r === 'string' ? r : (r.roleCode || r.roleName || ''));

  const hasRequiredRole = item.roles && item.roles.length > 0
    ? item.roles.some(role => roleStrings.includes(role))
    : true; // no role restriction → passes

  // Check permission access - backend returns array of strings like ['SALES_VIEW', 'SALES_CREATE']
  const userPermissions = user.permissions || [];
  const hasRequiredPermission = item.permissions && item.permissions.length > 0
    ? item.permissions.some(perm => userPermissions.includes(perm))
    : true; // no permission restriction → passes

  // If BOTH roles and permissions are specified, pass if EITHER matches (OR logic)
  // If only one is specified, it must match
  if (item.roles && item.roles.length > 0 && item.permissions && item.permissions.length > 0) {
    return hasRequiredRole || hasRequiredPermission;
  }

  return hasRequiredRole && hasRequiredPermission;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setExpanded(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setExpanded(false);
      setOpenMenus([]);
    }, 200);
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;

  const hasActiveChild = (item: NavItem): boolean => (
    item.children?.some((child) => isActive(child.href) || hasActiveChild(child)) || false
  );

  // Get user roles for display
  const userRoles = user?.roles || [];
  const userRoleDisplay = userRoles.length > 0
    ? (typeof userRoles[0] === 'string' ? userRoles[0] : (userRoles[0]?.roleCode || 'USER'))
    : 'USER';

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'sticky top-0 flex h-screen flex-shrink-0 flex-col overflow-hidden bg-[#0d211d] text-white shadow-sidebar transition-all duration-300 ease-in-out',
        expanded ? 'w-64' : 'w-[68px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-[72px] items-center justify-center border-b border-white/10', expanded ? 'px-3' : 'px-2')}>
        <Link href="/dashboard" className="block">
          {expanded ? (
            <KoiLogo variant="wordmark" className="h-12 w-44 rounded-xl border-white/10" />
          ) : (
            <KoiLogo variant="icon" className="h-10 w-10" />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {navItems.map((item) => (
          <NavItemView
            key={item.title}
            item={item}
            level={0}
            user={user}
            userRoles={userRoles}
            openMenus={openMenus}
            toggleMenu={toggleMenu}
            isActive={isActive}
            hasActiveChild={hasActiveChild}
            expanded={expanded}
          />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-2">
        {expanded ? (
          <>
            <div className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-white">
                <span className="text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="absolute h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold">{user?.name || 'User'}</p>
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-[#bdd0c8]">{userRoleDisplay}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#bdd0c8] transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10" title={user?.name || 'User'}>
              <span className="text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </span>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="absolute h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-[#bdd0c8] transition-colors hover:bg-white/10 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavItemView({
  item,
  level,
  user,
  userRoles,
  openMenus,
  toggleMenu,
  isActive,
  hasActiveChild,
  expanded,
}: {
  item: NavItem;
  level: number;
  user: any;
  userRoles: any[];
  openMenus: string[];
  toggleMenu: (title: string) => void;
  isActive: (href: string) => boolean;
  hasActiveChild: (item: NavItem) => boolean;
  expanded: boolean;
}) {
  if (!hasAccess(item, user)) return null;

  const visibleChildren = item.children?.filter((child) => hasAccess(child, user)) || [];
  const isOpen = expanded && (openMenus.includes(item.title) || hasActiveChild(item));
  const itemActive = isActive(item.href);
  const Icon = item.icon;

  // Collapsed: show only top-level icons
  if (!expanded) {
    if (level > 0) return null;
    return (
      <Link
        href={item.href}
        className={cn(
          'my-1 flex items-center justify-center rounded-lg py-3 text-[#bdd0c8] transition-colors hover:bg-white/10 hover:text-white',
          (itemActive || hasActiveChild(item)) && 'bg-[#f7f3ea] text-[#0f2f29]'
        )}
        title={item.title}
      >
        {Icon && <Icon className="h-5 w-5" />}
      </Link>
    );
  }

  // Expanded: full navigation
  const paddingLeft = 16 + level * 16;

  if (visibleChildren.length > 0) {
    return (
      <div>
        <button
          onClick={() => toggleMenu(item.title)}
          style={{ paddingLeft }}
          className={cn(
            'flex w-full items-center justify-between rounded-lg pr-4 text-sm font-semibold text-[#bdd0c8] transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap',
            level === 0 ? 'my-1 py-2.5' : 'my-0.5 py-2',
            (isOpen || itemActive) && 'bg-white/10 text-white'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className={cn('h-5 w-5 flex-shrink-0', level > 0 && 'h-4 w-4')} />}
            <span>{item.title}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </button>
        {isOpen && (
          <div className="ml-4 border-l border-white/10 pl-1">
            {visibleChildren.map((child) => (
              <NavItemView
                key={`${child.title}-${child.href}`}
                item={child}
                level={level + 1}
                user={user}
                userRoles={userRoles}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                isActive={isActive}
                hasActiveChild={hasActiveChild}
                expanded={expanded}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      style={{ paddingLeft }}
      className={cn(
        'my-0.5 flex items-center gap-3 rounded-lg pr-4 py-2 text-sm font-semibold text-[#bdd0c8] transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap',
        level === 0 && 'my-1 py-2.5',
        itemActive && 'bg-[#f7f3ea] text-[#0f2f29] shadow-sm'
      )}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      <span>{item.title}</span>
    </Link>
  );
}
