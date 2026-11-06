// Module and metric keys match the palette selectors in workspace-glass.css.
export const moduleAccents: Record<string, string> = {
  masters: 'plum', sales: 'cobalt', purchase: 'copper', 'purchase-orders': 'copper',
  rate: 'magenta', fms: 'marine', inventory: 'olive', planner: 'umber',
  warehouse: 'petrol', production: 'ochre', quality: 'raspberry', accounts: 'pine',
  finance: 'jade', labels: 'orchid', mis: 'midnight', reports: 'indigo',
  help: 'turquoise', profile: 'indigo', users: 'emerald', settings: 'aubergine', admin: 'ocean', documents: 'lagoon', notifications: 'raspberry',
};

export const metricAccents: Record<string, string> = {
  'Total Enquiries': 'lagoon', 'Win Rate': 'mint', 'Pending Tasks': 'mustard',
  'Completed Today': 'emerald', 'Production Jobs': 'leaf', 'QC Inspections': 'crimson',
  'Rate Analyses': 'magenta', 'Purchase Quotes': 'copper', 'Stock Items': 'turquoise',
  'Pending Approvals': 'mustard', Finance: 'jade',
};

const activityAccents: Record<string, string> = {
  'approvals': 'jade', 'approval-console': 'jade', 'price-approval': 'jade',
  'accountant-review': 'jade',
  'stock': 'emerald', 'floor-stock': 'emerald', 'stock-report': 'emerald',
  'balance-sheet': 'emerald', 'profit-loss': 'emerald', 'vendors': 'emerald',
  'centralized-stock-ledger': 'pine', 'journal-entries': 'pine', 'warehouses': 'pine',
  'warehouse-planning': 'pine',
  'delivery-notes': 'lagoon', 'freight-rates': 'lagoon', 'ports': 'lagoon',
  'receiving-plans': 'lagoon', 'grn-plan': 'lagoon', 'offloading-plan': 'lagoon',
  'receiving-history': 'turquoise', 'grns': 'turquoise', 'grn': 'turquoise',
  'grn-history': 'turquoise', 'grn-notifications': 'turquoise',
  'orders': 'ocean', 'purchase-orders': 'ocean', 'po-dashboard': 'ocean',
  'po-tracking': 'ocean', 'countries': 'ocean', 'zones': 'ocean',
  'locations': 'ocean',
  'sales': 'cobalt', 'sales-assignment': 'cobalt', 'departments': 'cobalt',
  'customers': 'cobalt',
  'three-way-match': 'marine', 'order-review': 'marine', 'audit-trail': 'marine',
  'audit': 'marine', 'permissions': 'marine',
  'quotations': 'indigo', 'workflows': 'indigo', 'designer': 'indigo',
  'roles': 'indigo', 'groups': 'indigo', 'settings': 'indigo',
  'brands': 'plum', 'categories': 'plum', 'segments': 'plum',
  'labels': 'plum', 'rate': 'plum', 'currency-rates': 'plum',
  'price-analysis': 'magenta', 'currencies': 'magenta', 'currency': 'magenta',
  'gst-rates': 'magenta',
  'debit-notes': 'raspberry', 'adjustments': 'raspberry', 'return-material-notes': 'raspberry',
  'production-returns': 'raspberry',
  'reject-actions': 'crimson', 'reject-history': 'crimson',
  'bom': 'leaf', 'products': 'leaf', 'material-closure': 'leaf',
  'packing': 'leaf', 'uoms': 'leaf',
  'purchase': 'copper', 'indent': 'copper', 'job-panel': 'copper',
  'production-material-issue': 'copper', 'daily-log': 'copper',
  'pending-po': 'ochre', 'material-request-dashboard': 'ochre', 'extra-qty-request': 'ochre',
  'transfer-requests': 'ochre',
  'material-movement': 'petrol', 'movements': 'petrol', 'incoming-transfers': 'petrol',
  'material-transfer-history': 'petrol', 'transfer-history': 'petrol',
  'email-templates': 'orchid', 'users': 'orchid', 'quality': 'orchid',
  'post-receipt-qc': 'orchid', 'return-material-inspection': 'orchid',
  'invoices': 'midnight', 'po-invoice-status': 'midnight', 'payment-terms': 'midnight',
  'production-history': 'midnight',
  'stock-location': 'olive', 'bin-rack': 'olive',
  'haulage': 'umber', 'number-series': 'umber',
  'enquiry-summary': 'mint', 'setup': 'mint', 'planner': 'mint',
  'merge-details': 'aubergine',
};

export function getPageAccent(pathname: string): string {
  const [, department, ...segments] = pathname.split('/').filter(Boolean);
  const moduleColor = moduleAccents[department] ?? 'cobalt';
  if (!segments.length) return moduleColor;

  const activity = segments[segments.length - 1];
  if (activity === 'new') return 'jade';
  if (Object.prototype.hasOwnProperty.call(activityAccents, activity)) return activityAccents[activity];

  // Record URLs end in an ID. Follow their collection color where possible.
  return activityAccents[segments[segments.length - 2]] ?? ({
    sales: 'ocean', purchase: 'ochre', rate: 'plum', fms: 'lagoon',
  } as Record<string, string>)[department] ?? moduleColor;
}
