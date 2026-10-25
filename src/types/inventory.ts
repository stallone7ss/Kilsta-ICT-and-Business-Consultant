export type ItemCategory =
  | 'Networking'
  | 'Servers & Infrastructure'
  | 'Workstations & Laptops'
  | 'Storage & SAN'
  | 'Cybersecurity & Firewalls'
  | 'Peripherals & Displays'
  | 'Cables & Optical'
  | 'Components & Upgrades'
  | 'Power & Cooling';

export type ItemCondition =
  | 'Brand New'
  | 'Refurbished'
  | 'Deployed / In Use'
  | 'Maintenance / RMA'
  | 'Decommissioned';

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ItemCategory;
  brand: string;
  model: string;
  serialNumber: string;
  quantity: number;
  minThreshold: number;
  unitCost: number;
  sellingPrice: number;
  location: string;
  condition: ItemCondition;
  supplier: string;
  specs: Record<string, string>;
  notes: string;
  updatedAt: string;
  createdAt: string;
}

export type TransactionType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'DEPLOYMENT'
  | 'TRANSFER'
  | 'RMA_RETURN'
  | 'AUDIT_ADJUSTMENT';

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: TransactionType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reference: string;
  operator: string;
  recipient?: string;
  locationFrom?: string;
  locationTo?: string;
  timestamp: string;
  notes?: string;
}

export interface SoftwareLicense {
  id: string;
  softwareName: string;
  vendor: string;
  licenseKey: string;
  type: 'Perpetual' | 'Annual Subscription' | 'Monthly Cloud' | 'OEM';
  totalSeats: number;
  allocatedSeats: number;
  assignedUsers: string[];
  expiryDate: string;
  costPerYear: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  notes?: string;
}

export interface ClientDeployment {
  id: string;
  clientName: string;
  contactPerson: string;
  clientEmail: string;
  siteLocation: string;
  workOrderNumber: string;
  assignedTechnician: string;
  items: {
    itemId: string;
    itemName: string;
    sku: string;
    serialNumber: string;
    qty: number;
  }[];
  status: 'Pending Installation' | 'Active On-Site' | 'Under Maintenance' | 'Returned';
  deployedDate: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  categories: string[];
  leadTimeDays: number;
  rating: number;
}

export interface SystemSettings {
  companyName: string;
  currency: 'USD' | 'EUR' | 'SEK';
  workerSyncUrl: string;
  lowStockAlerts: boolean;
  autoSKU: boolean;
  lastWorkerSync?: string;
  lastWorkerSyncStatus?: 'success' | 'failed' | 'idle';
  lastWorkerSyncMessage?: string;
}

export interface DatabaseSnapshot {
  schemaVersion: string;
  exportedAt: string;
  items: InventoryItem[];
  transactions: StockTransaction[];
  licenses: SoftwareLicense[];
  deployments: ClientDeployment[];
  suppliers: Supplier[];
  settings: SystemSettings;
}

export interface DatabaseStats {
  totalItems: number;
  totalQuantity: number;
  totalValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  transactionsCount: number;
  licensesCount: number;
  activeDeploymentsCount: number;
  suppliersCount: number;
  dbFileSizeKb: number;
  lastUpdated: string;
  sseClientsCount: number;
}

export interface RealtimeMessage {
  type:
    | 'INIT'
    | 'ITEM_CREATED'
    | 'ITEM_UPDATED'
    | 'ITEM_DELETED'
    | 'TRANSACTION_RECORDED'
    | 'LICENSE_UPDATED'
    | 'DEPLOYMENT_UPDATED'
    | 'DB_RESET'
    | 'DB_IMPORTED'
    | 'PING';
  timestamp: string;
  data?: any;
}
