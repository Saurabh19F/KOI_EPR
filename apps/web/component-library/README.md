# ERP Frontend Component Library

This document outlines the recommended React components for the ERP frontend application.

## Table of Contents
1. [Form Components](#form-components)
2. [Data Display Components](#data-display-components)
3. [Layout Components](#layout-components)
4. [Navigation Components](#navigation-components)
5. [Feedback Components](#feedback-components)
6. [Data Entry Components](#data-entry-components)

---

## Form Components

### TextField
```tsx
// props
interface TextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onBlur?: (e: React.FocusEvent) => void;
}
```

### Select
```tsx
// props
interface SelectProps {
  name: string;
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  multiple?: boolean;
}
```

### DatePicker
```tsx
// props
interface DatePickerProps {
  name: string;
  label: string;
  value?: Date | string;
  onChange?: (date: Date | null) => void;
  format?: string; // e.g., 'DD/MM/YYYY'
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showTime?: boolean;
  placeholder?: string;
}
```

### DateRangePicker
```tsx
// props
interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  format?: string;
  label?: string;
  error?: string;
}
```

### Checkbox
```tsx
// props
interface CheckboxProps {
  name: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error';
}
```

### RadioGroup
```tsx
// props
interface RadioGroupProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  row?: boolean;
}
```

### Switch
```tsx
// props
interface SwitchProps {
  name: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary';
  size?: 'small' | 'medium';
}
```

---

## Data Display Components

### DataTable
```tsx
// props
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort: (field: string) => void;
  };
  rowSelection?: {
    selected: string[];
    onSelectionChange: (ids: string[]) => void;
  };
  rowActions?: {
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    color?: 'primary' | 'secondary' | 'error';
  }[];
  emptyText?: string;
  onRowClick?: (row: T) => void;
  responsive?: boolean;
}

interface Column<T> {
  field: keyof T | string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, value: any) => ReactNode;
  format?: 'currency' | 'date' | 'datetime' | 'percentage' | 'number';
}
```

### StatusBadge
```tsx
// props
interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'>;
  size?: 'small' | 'medium';
}
```

### CurrencyDisplay
```tsx
// props
interface CurrencyDisplayProps {
  value: number;
  currency?: string; // default: 'INR'
  locale?: string; // default: 'en-IN'
  showSign?: boolean; // show +/- prefix
  colorize?: boolean; // green for positive, red for negative
}
```

### AddressCard
```tsx
// props
interface AddressCardProps {
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    stateCode?: string;
    country?: string;
    postalCode: string;
  };
  type?: 'billing' | 'shipping' | 'office';
  onEdit?: () => void;
  compact?: boolean;
}
```

---

## Layout Components

### Card
```tsx
// props
interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  elevation?: 0 | 1 | 2 | 3;
  padding?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
}
```

### Modal
```tsx
// props
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  loading?: boolean;
}
```

### Drawer
```tsx
// props
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  position?: 'left' | 'right';
  width?: number | string;
  height?: number | string;
}
```

### PageHeader
```tsx
// props
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
  backHref?: string;
}
```

### Tabs
```tsx
// props
interface TabsProps {
  tabs: { id: string; label: string; icon?: ReactNode; disabled?: boolean }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'standard' | 'scrollable' | 'pills';
  orientation?: 'horizontal' | 'vertical';
}
```

### SplitPane
```tsx
// props
interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  showHandle?: boolean;
}
```

---

## Navigation Components

### Sidebar
```tsx
// props
interface SidebarProps {
  items: NavItem[];
  activeItem?: string;
  onItemClick?: (item: NavItem) => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
  logo?: ReactNode;
  footer?: ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  children?: NavItem[];
  badge?: string | number;
  disabled?: boolean;
}
```

### Breadcrumbs
```tsx
// props
interface BreadcrumbsProps {
  items: { label: string; href?: string }[];
  separator?: ReactNode;
  maxItems?: number;
}
```

### Stepper
```tsx
// props
interface StepperProps {
  steps: { label: string; description?: string }[];
  activeStep: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  alternativeLabel?: boolean;
}
```

---

## Feedback Components

### LoadingSpinner
```tsx
// props
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  fullScreen?: boolean;
  overlay?: boolean;
}
```

### Skeleton
```tsx
// props
interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | 'none';
}
```

### EmptyState
```tsx
// props
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Alert
```tsx
// props
interface AlertProps {
  severity: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

### Toast
```tsx
// props
interface ToastProps {
  id: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Hook usage
const { addToast, removeToast } = useToast();
```

---

## Data Entry Components

### ItemLineEditor
```tsx
// props
interface ItemLineEditorProps {
  items: LineItem[];
  columns: {
    field: string;
    header: string;
    width?: number;
    editable?: boolean;
    type?: 'text' | 'number' | 'select' | 'date' | 'currency';
    options?: { value: string; label: string }[];
    format?: 'currency' | 'percentage';
    align?: 'left' | 'center' | 'right';
  }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: string, value: any) => void;
  onReorder?: (from: number, to: number) => void;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  allowDuplicate?: boolean;
  maxRows?: number;
}

interface LineItem {
  [key: string]: any;
  _id?: string;
}
```

### AddressForm
```tsx
// props
interface AddressFormProps {
  value: Address;
  onChange: (address: Address) => void;
  countries?: { value: string; label: string }[];
  states?: { value: string; label: string; countryCode: string }[];
  required?: boolean;
  compact?: boolean;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode?: string;
  country: string;
  postalCode: string;
}
```

### ProductSearch
```tsx
// props
interface ProductSearchProps {
  value?: Product;
  onChange: (product: Product | null) => void;
  warehouseId?: string;
  batchRequired?: boolean;
  disabled?: boolean;
  placeholder?: string;
}
```

### PartySearch
```tsx
// props
interface PartySearchProps {
  value?: Party;
  onChange: (party: Party | null) => void;
  type: 'customer' | 'vendor' | 'all';
  disabled?: boolean;
  placeholder?: string;
}

interface Party {
  partyId: string;
  partyName: string;
  gstin?: string;
  email?: string;
  phone?: string;
  billingAddress?: Address;
}
```

### AccountSearch
```tsx
// props
interface AccountSearchProps {
  value?: Account;
  onChange: (account: Account | null) => void;
  accountType?: AccountType[];
  accountGroupId?: string;
  disabled?: boolean;
  placeholder?: string;
  allowCreateNew?: boolean;
}
```

### FileUpload
```tsx
// props
interface FileUploadProps {
  value?: FileInfo[];
  onChange: (files: FileInfo[]) => void;
  accept?: string; // e.g., '.pdf,.jpg,.png'
  maxSize?: number; // in MB
  maxFiles?: number;
  uploadUrl?: string;
  disabled?: boolean;
  showPreview?: boolean;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress?: number;
}
```

---

## Chart Components

### LineChart
```tsx
// props
interface LineChartProps {
  data: ChartData;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
  animated?: boolean;
}
```

### BarChart
```tsx
// props
interface BarChartProps {
  data: ChartData;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  showLegend?: boolean;
  colors?: string[];
}
```

### PieChart
```tsx
// props
interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
  innerRadius?: number; // for doughnut
}
```

### ChartData Interface
```tsx
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}
```

---

## Utility Hooks

```tsx
// useForm
function useForm<T>(initialValues: T, validationSchema?: ZodSchema) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const handleChange = (field: string, value: any) => void;
  const handleBlur = (field: string) => void;
  const validate = () => boolean;
  const reset = () => void;
  const setFieldValue = (field: string, value: any) => void;
  
  return { values, errors, touched, handleChange, handleBlur, validate, reset, setFieldValue };
}

// useDataTable
function useDataTable<T>(options: {
  url: string;
  params?: Record<string, any>;
  initialPage?: number;
  initialLimit?: number;
}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [sorting, setSorting] = useState({ sortBy: '', sortOrder: 'desc' });
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const fetchData = async () => void;
  const setPage = (page: number) => void;
  const setLimit = (limit: number) => void;
  const setSort = (field: string) => void;
  const setFilter = (key: string, value: any) => void;
  
  return { data, loading, pagination, sorting, filters, fetchData, setPage, setLimit, setSort, setFilter };
}

// useDebounce
function useDebounce<T>(value: T, delay?: number): T;

// useClickOutside
function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void): void;

// useKeyPress
function useKeyPress(targetKey: string, handler: (event: KeyboardEvent) => void): void;
```

---

## Implementation Notes

1. **Internationalization**: All labels and messages should use i18n keys, not hardcoded strings.

2. **Responsive Design**: Components should work on mobile, tablet, and desktop. Use Tailwind's responsive prefixes.

3. **Accessibility**: 
   - All form inputs must have associated labels
   - Use semantic HTML elements
   - Support keyboard navigation
   - Maintain proper contrast ratios

4. **State Management**: For complex forms with many fields, consider using Zustand or React Context.

5. **API Integration**: Use React Query or SWR for data fetching and caching.

6. **Form Validation**: Use Zod for schema validation, integrated with React Hook Form.

7. **Error Handling**: Display inline errors below form fields and use toast notifications for async errors.
