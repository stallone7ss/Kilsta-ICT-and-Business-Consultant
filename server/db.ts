import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import {
  InventoryItem,
  StockTransaction,
  SoftwareLicense,
  ClientDeployment,
  Supplier,
  SystemSettings,
  DatabaseSnapshot,
  DatabaseStats,
  RealtimeMessage
} from '../src/types/inventory.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kilsta_inventory.json');

export const dbEvents = new EventEmitter();
dbEvents.setMaxListeners(100);

// Default initial enterprise ICT seed data for Kilsta Business ICT
function createDefaultSeed(): DatabaseSnapshot {
  const now = new Date().toISOString();
  
  const items: InventoryItem[] = [
    {
      id: 'item-001',
      sku: 'KICT-SRV-0101',
      barcode: '735001230001',
      name: 'Dell PowerEdge R750xs 2U Rack Server',
      category: 'Servers & Infrastructure',
      brand: 'Dell EMC',
      model: 'R750xs (2x Xeon Silver 4314, 128GB ECC, 8x 2.5" SAS)',
      serialNumber: 'SRV-DL-883921',
      quantity: 4,
      minThreshold: 2,
      unitCost: 3850,
      sellingPrice: 4799,
      location: 'Kilsta Server Room Rack 2U-4U',
      condition: 'Brand New',
      supplier: 'Dell Technologies Nordic',
      specs: {
        CPU: '2x Intel Xeon Silver 4314 (32 cores total)',
        RAM: '128GB DDR4-3200 ECC RDIMM',
        RAID: 'PERC H755 Front SAS/SATA 8GB Cache',
        Network: 'Broadcom 57414 Dual Port 10/25GbE SFP28',
        Power: 'Dual Redundant 800W Platinum'
      },
      notes: 'Standard virtualization host for client private clouds and hypervisors.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-002',
      sku: 'KICT-NET-0204',
      barcode: '735001230002',
      name: 'Cisco Catalyst 9200L 48-Port PoE+ Switch',
      category: 'Networking',
      brand: 'Cisco',
      model: 'C9200L-48P-4X-E',
      serialNumber: 'CSCO-FCW2518L91',
      quantity: 8,
      minThreshold: 3,
      unitCost: 2150,
      sellingPrice: 2890,
      location: 'Central Karlskoga Warehouse Shelf N-12',
      condition: 'Brand New',
      supplier: 'Ingram Micro Nordic',
      specs: {
        Ports: '48x 10/100/1000 PoE+ (740W budget)',
        Uplinks: '4x 10G SFP+ fixed uplinks',
        Stacking: 'StackWise-80 optional kit',
        OS: 'Cisco IOS XE Network Essentials'
      },
      notes: 'Core campus switch for enterprise client office deployments.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-003',
      sku: 'KICT-SEC-0301',
      barcode: '735001230003',
      name: 'Fortinet FortiGate 60F UTM Next-Gen Firewall',
      category: 'Cybersecurity & Firewalls',
      brand: 'Fortinet',
      model: 'FG-60F-BDL-950-12',
      serialNumber: 'FGT60FTK2104921',
      quantity: 2,
      minThreshold: 3,
      unitCost: 890,
      sellingPrice: 1250,
      location: 'Security Cage Lockbox B-01',
      condition: 'Brand New',
      supplier: 'Arrow Enterprise Computing',
      specs: {
        Throughput: '10 Gbps Firewall / 1 Gbps IPS / 700 Mbps NGFW',
        Interfaces: '10x GE RJ45 (including 2x WAN, 1x DMZ, 7x Internal)',
        License: '1-Year FortiGuard Unified Threat Protection (UTP)'
      },
      notes: 'Low stock warning! Primary SMB edge firewall with IPS and SSL inspection.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-004',
      sku: 'KICT-WIFI-0408',
      barcode: '735001230004',
      name: 'Ubiquiti UniFi U6 Enterprise Wi-Fi 6E Access Point',
      category: 'Networking',
      brand: 'Ubiquiti',
      model: 'U6-Enterprise',
      serialNumber: 'UBQ-748392109',
      quantity: 14,
      minThreshold: 5,
      unitCost: 279,
      sellingPrice: 389,
      location: 'Central Karlskoga Warehouse Shelf W-03',
      condition: 'Brand New',
      supplier: 'Dustin Sweden AB',
      specs: {
        Bands: 'Tri-band Wi-Fi 6E (2.4GHz, 5GHz, 6GHz)',
        Uplink: '1x 2.5 GbE RJ45 with 802.3at PoE+',
        Capacity: '600+ concurrent clients, 10.2 Gbps aggregate throughput'
      },
      notes: 'High density Wi-Fi for industrial plants and corporate offices.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-005',
      sku: 'KICT-LAP-0512',
      barcode: '735001230005',
      name: 'Lenovo ThinkPad T14 Gen 4 Business Laptop',
      category: 'Workstations & Laptops',
      brand: 'Lenovo',
      model: '21HD001QSE (Intel i7-1355U, 32GB, 1TB NVMe, LTE)',
      serialNumber: 'PF49A201-SE',
      quantity: 6,
      minThreshold: 4,
      unitCost: 1420,
      sellingPrice: 1850,
      location: 'Staging Bench Tech Room 1',
      condition: 'Brand New',
      supplier: 'Also Nordic Distribution',
      specs: {
        CPU: 'Intel Core i7-1355U (10 Cores, up to 5.0GHz)',
        RAM: '32GB LPDDR5-4800 soldered',
        Storage: '1TB M.2 PCIe Gen4 NVMe SSD OPAL',
        Display: '14" WUXGA (1920x1200) IPS 400 nits Low Power',
        OS: 'Windows 11 Pro Nordic'
      },
      notes: 'Pre-imaged for executive client fleet standard.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-006',
      sku: 'KICT-STR-0602',
      barcode: '735001230006',
      name: 'Synology RackStation RS2423+ 12-Bay NAS',
      category: 'Storage & SAN',
      brand: 'Synology',
      model: 'RS2423+ (AMD Ryzen V1780B Quad-Core)',
      serialNumber: 'SYN-23A0RS242301',
      quantity: 1,
      minThreshold: 2,
      unitCost: 2190,
      sellingPrice: 2890,
      location: 'Kilsta Server Room Storage Rack A',
      condition: 'Brand New',
      supplier: 'Dustin Sweden AB',
      specs: {
        Bays: '12-bay 3.5"/2.5" SATA (expandable to 24 with RX1223RP)',
        CPU: 'AMD Ryzen V1780B 4-core 3.35 GHz',
        RAM: '8GB DDR4 ECC UDIMM (up to 32GB)',
        Networking: '1x 10GbE RJ45 + 2x 1GbE RJ45'
      },
      notes: 'CRITICAL LOW STOCK: Only 1 unit in inventory. Reserved for on-premise immutable backup.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-007',
      sku: 'KICT-DRV-0715',
      barcode: '735001230007',
      name: 'Seagate Exos X18 16TB Enterprise SATA HDD',
      category: 'Storage & SAN',
      brand: 'Seagate',
      model: 'ST16000NM000J',
      serialNumber: 'ZTF0AA91',
      quantity: 18,
      minThreshold: 6,
      unitCost: 265,
      sellingPrice: 345,
      location: 'Central Karlskoga Warehouse Bin D-09',
      condition: 'Brand New',
      supplier: 'Ingram Micro Nordic',
      specs: {
        Capacity: '16TB 7200 RPM Enterprise Drive',
        Interface: 'SATA 6Gb/s, 512e/4Kn format',
        MTBF: '2.5 Million Hours, 5-Year Warranty'
      },
      notes: 'Spare drive inventory for NAS arrays and server storage pools.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-008',
      sku: 'KICT-PWR-0801',
      barcode: '735001230008',
      name: 'APC Smart-UPS RT 3000VA On-Line 230V',
      category: 'Power & Cooling',
      brand: 'Schneider Electric / APC',
      model: 'SRT3000XLI',
      serialNumber: 'APC-AS2319320149',
      quantity: 3,
      minThreshold: 2,
      unitCost: 1980,
      sellingPrice: 2540,
      location: 'Power Storage Bay P-1',
      condition: 'Brand New',
      supplier: 'Dustin Sweden AB',
      specs: {
        Capacity: '3000VA / 2700W Pure Sine Wave',
        Topology: 'Double Conversion Online',
        Management: 'AP9641 Network Card pre-installed'
      },
      notes: 'Rack/Tower convertible UPS for mission-critical rack enclosures.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-009',
      sku: 'KICT-OPT-1022',
      barcode: '735001230009',
      name: '10G SFP+ SR Dual LC Multi-Mode Optical Transceiver',
      category: 'Cables & Optical',
      brand: 'FS.com / Cisco Compatible',
      model: 'SFP-10G-SR-850nm',
      serialNumber: 'OPT-FS-239102-12',
      quantity: 42,
      minThreshold: 15,
      unitCost: 24,
      sellingPrice: 48,
      location: 'Small Parts Bin Box 4-B',
      condition: 'Brand New',
      supplier: 'FS.com Europe',
      specs: {
        Wavelength: '850nm Multi-Mode LC duplex',
        MaxDistance: '300m over OM3 fiber',
        DataRate: '10.3125 Gbps'
      },
      notes: 'High turnover interconnect optics for switch-to-switch and server uplinks.',
      updatedAt: now,
      createdAt: now
    },
    {
      id: 'item-010',
      sku: 'KICT-MON-0905',
      barcode: '735001230010',
      name: 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
      category: 'Peripherals & Displays',
      brand: 'Dell',
      model: 'U2723QE IPS Black',
      serialNumber: 'CN-0P82F1-74445-31',
      quantity: 0,
      minThreshold: 4,
      unitCost: 510,
      sellingPrice: 680,
      location: 'Dispatched / Warehouse Staging',
      condition: 'Brand New',
      supplier: 'Dell Technologies Nordic',
      specs: {
        Panel: '27" 4K UHD 3840x2160 IPS Black 2000:1 contrast',
        Connectivity: 'USB-C (90W PD), RJ45 Ethernet, DP 1.4, HDMI 2.0, KVM switch'
      },
      notes: 'OUT OF STOCK! All units dispatched to Karlskoga Engineering Client site.',
      updatedAt: now,
      createdAt: now
    }
  ];

  const transactions: StockTransaction[] = [
    {
      id: 'tx-001',
      itemId: 'item-010',
      itemName: 'Dell UltraSharp 27" 4K USB-C Hub Monitor',
      sku: 'KICT-MON-0905',
      type: 'DEPLOYMENT',
      quantity: 4,
      previousQty: 4,
      newQty: 0,
      reference: 'WO-2026-1049',
      operator: 'Stallone Yabom (Lead Engineer)',
      recipient: 'Kilsta Industrial Park Engineering Dept',
      locationFrom: 'Karlskoga Warehouse',
      locationTo: 'Kilsta Industrial Park Bldg B',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      notes: 'Deployed 4 monitors to client engineering CAD workstations.'
    },
    {
      id: 'tx-002',
      itemId: 'item-009',
      itemName: '10G SFP+ SR Dual LC Multi-Mode Optical Transceiver',
      sku: 'KICT-OPT-1022',
      type: 'STOCK_IN',
      quantity: 20,
      previousQty: 22,
      newQty: 42,
      reference: 'PO-SE-88219',
      operator: 'Inventory Control Desk',
      recipient: 'Kilsta Central Stock',
      locationFrom: 'FS.com Europe Logistics',
      locationTo: 'Karlskoga Small Parts Box 4-B',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      notes: 'Scheduled replenishment batch for fiber patch jobs.'
    },
    {
      id: 'tx-003',
      itemId: 'item-003',
      itemName: 'Fortinet FortiGate 60F UTM Next-Gen Firewall',
      sku: 'KICT-SEC-0301',
      type: 'STOCK_OUT',
      quantity: 1,
      previousQty: 3,
      newQty: 2,
      reference: 'TICKET-9921',
      operator: 'Network Operations Team',
      recipient: 'Karlskoga Health Clinic Site',
      locationFrom: 'Security Cage Lockbox B-01',
      locationTo: 'Karlskoga Clinic Server Rack',
      timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
      notes: 'Emergency replacement for burnt surge protector firewall unit.'
    }
  ];

  const licenses: SoftwareLicense[] = [
    {
      id: 'lic-001',
      softwareName: 'Microsoft 365 Business Premium',
      vendor: 'Microsoft Corporation',
      licenseKey: 'MS365-PREM-KILSTA-50SEAT-CSP',
      type: 'Annual Subscription',
      totalSeats: 50,
      allocatedSeats: 46,
      assignedUsers: ['stalloneyabom65@gmail.com', 'admin@kilstabusiness.se', 'ops@kilstabusiness.se', 'dev@kilstabusiness.se'],
      expiryDate: '2027-04-15',
      costPerYear: 12600,
      status: 'Active',
      notes: 'Corporate productivity, Defender for Business, Intune MDM, and Exchange Online.'
    },
    {
      id: 'lic-002',
      softwareName: 'SentinelOne Singularity Complete EDR',
      vendor: 'SentinelOne Inc.',
      licenseKey: 'S1-COMPL-KILSTA-100EP-XDR',
      type: 'Annual Subscription',
      totalSeats: 100,
      allocatedSeats: 88,
      assignedUsers: ['Server Farm Fleet', 'Executive Laptops', 'Karlskoga Plant Workstations'],
      expiryDate: '2027-01-31',
      costPerYear: 7800,
      status: 'Active',
      notes: 'Autonomous real-time endpoint protection, behavioral AI, and ransomware rollback.'
    },
    {
      id: 'lic-003',
      softwareName: 'VMware vSphere 8 Standard (Per CPU)',
      vendor: 'Broadcom / VMware',
      licenseKey: 'VMW8-STD-4CPU-8931-KLST',
      type: 'Perpetual',
      totalSeats: 4,
      allocatedSeats: 4,
      assignedUsers: ['Dell R750xs Server Node 1', 'Dell R750xs Server Node 2'],
      expiryDate: '2026-11-20',
      costPerYear: 3200,
      status: 'Expiring Soon',
      notes: 'SnS Support contract expiring next month! Needs renewal with distributor.'
    }
  ];

  const deployments: ClientDeployment[] = [
    {
      id: 'dep-001',
      clientName: 'Karlskoga Central Healthcare Center',
      contactPerson: 'Dr. Henrik Lindqvist',
      clientEmail: 'it-support@karlskoga-health.se',
      siteLocation: 'Lasarettsvagen 1, Karlskoga, Sweden',
      workOrderNumber: 'WO-2026-0988',
      assignedTechnician: 'Stallone Yabom',
      items: [
        { itemId: 'item-003', itemName: 'Fortinet FortiGate 60F UTM Next-Gen Firewall', sku: 'KICT-SEC-0301', serialNumber: 'FGT60FTK2104921', qty: 1 },
        { itemId: 'item-004', itemName: 'Ubiquiti UniFi U6 Enterprise Access Point', sku: 'KICT-WIFI-0408', serialNumber: 'UBQ-748392109', qty: 3 }
      ],
      status: 'Active On-Site',
      deployedDate: '2026-09-15',
      notes: 'Managed network contract with 24/7 SLA and monthly monitoring.'
    },
    {
      id: 'dep-002',
      clientName: 'Kilsta Industrial Park Engineering Group',
      contactPerson: 'Magnus Bergstrom',
      clientEmail: 'm.bergstrom@kilsta-industrial.se',
      siteLocation: 'Kilstaverken Hall 4, Karlskoga',
      workOrderNumber: 'WO-2026-1049',
      assignedTechnician: 'Stallone Yabom',
      items: [
        { itemId: 'item-010', itemName: 'Dell UltraSharp 27" 4K USB-C Hub Monitor', sku: 'KICT-MON-0905', serialNumber: 'CN-0P82F1-74445-31', qty: 4 },
        { itemId: 'item-005', itemName: 'Lenovo ThinkPad T14 Gen 4 Business Laptop', sku: 'KICT-LAP-0512', serialNumber: 'PF49A201-SE', qty: 2 }
      ],
      status: 'Active On-Site',
      deployedDate: '2026-10-24',
      notes: 'High-performance engineering CAD workstation upgrade rollout.'
    }
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-001',
      name: 'Dell Technologies Nordic',
      contactPerson: 'Karin Nilsson',
      email: 'nordic.partner@dell.com',
      phone: '+46 8 590 051 00',
      categories: ['Servers & Infrastructure', 'Workstations & Laptops', 'Peripherals & Displays'],
      leadTimeDays: 7,
      rating: 4.9
    },
    {
      id: 'sup-002',
      name: 'Dustin Sweden AB',
      contactPerson: 'B2B Enterprise Team',
      email: 'order@dustin.se',
      phone: '+46 8 553 44 000',
      categories: ['Networking', 'Storage & SAN', 'Power & Cooling'],
      leadTimeDays: 2,
      rating: 4.8
    },
    {
      id: 'sup-003',
      name: 'Ingram Micro Nordic',
      contactPerson: 'Anders Eriksson',
      email: 'sales.se@ingrammicro.com',
      phone: '+46 8 602 30 00',
      categories: ['Networking', 'Cybersecurity & Firewalls', 'Components & Upgrades'],
      leadTimeDays: 3,
      rating: 4.7
    }
  ];

  const settings: SystemSettings = {
    companyName: 'Kilsta Business ICT',
    currency: 'USD',
    workerSyncUrl: 'https://kilsta-business-ict.stalloneyabom65.workers.dev/',
    lowStockAlerts: true,
    autoSKU: true,
    lastWorkerSync: now,
    lastWorkerSyncStatus: 'idle',
    lastWorkerSyncMessage: 'Worker bridge ready'
  };

  return {
    schemaVersion: '2.0.0',
    exportedAt: now,
    items,
    transactions,
    licenses,
    deployments,
    suppliers,
    settings
  };
}

class InventoryDatabase {
  private data: DatabaseSnapshot;
  private sseClients: Set<(msg: RealtimeMessage) => void> = new Set();

  constructor() {
    this.ensureDataDir();
    this.data = this.loadOrSeed();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadOrSeed(): DatabaseSnapshot {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.items && Array.isArray(parsed.items)) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse database file, re-seeding default data:', err);
      }
    }
    const seed = createDefaultSeed();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(snapshot: DatabaseSnapshot = this.data) {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    const serialized = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public registerSSEClient(callback: (msg: RealtimeMessage) => void): () => void {
    this.sseClients.add(callback);
    return () => {
      this.sseClients.delete(callback);
    };
  }

  public broadcast(type: RealtimeMessage['type'], data?: any) {
    const msg: RealtimeMessage = {
      type,
      timestamp: new Date().toISOString(),
      data
    };
    for (const client of this.sseClients) {
      try {
        client(msg);
      } catch (e) {
        // ignore dead client
      }
    }
    dbEvents.emit('change', msg);
  }

  // --- Statistics ---
  public getStats(): DatabaseStats {
    const totalItems = this.data.items.length;
    let totalQuantity = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of this.data.items) {
      totalQuantity += item.quantity;
      totalValuation += item.quantity * item.unitCost;
      if (item.quantity === 0) {
        outOfStockCount++;
      } else if (item.quantity <= item.minThreshold) {
        lowStockCount++;
      }
    }

    let dbFileSizeKb = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        dbFileSizeKb = Math.round(fs.statSync(DB_FILE).size / 1024);
      }
    } catch {
      dbFileSizeKb = 0;
    }

    return {
      totalItems,
      totalQuantity,
      totalValuation: Math.round(totalValuation * 100) / 100,
      lowStockCount,
      outOfStockCount,
      transactionsCount: this.data.transactions.length,
      licensesCount: this.data.licenses.length,
      activeDeploymentsCount: this.data.deployments.filter(d => d.status === 'Active On-Site').length,
      suppliersCount: this.data.suppliers.length,
      dbFileSizeKb,
      lastUpdated: new Date().toISOString(),
      sseClientsCount: this.sseClients.size
    };
  }

  // --- Inventory Item CRUD ---
  public getItems(): InventoryItem[] {
    return this.data.items;
  }

  public getItemById(id: string): InventoryItem | undefined {
    return this.data.items.find(i => i.id === id || i.sku === id || i.barcode === id || i.serialNumber === id);
  }

  public addItem(itemInput: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): InventoryItem {
    const now = new Date().toISOString();
    const id = itemInput.id || `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Auto SKU generation if needed
    let sku = itemInput.sku?.trim();
    if (!sku) {
      const prefix = itemInput.category ? itemInput.category.substring(0, 3).toUpperCase() : 'GEN';
      sku = `KICT-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newItem: InventoryItem = {
      ...itemInput,
      id,
      sku,
      barcode: itemInput.barcode?.trim() || `${Math.floor(735000000000 + Math.random() * 99999999)}`,
      createdAt: now,
      updatedAt: now,
      specs: itemInput.specs || {}
    };

    this.data.items.unshift(newItem);
    
    // Record initial stock transaction if quantity > 0
    if (newItem.quantity > 0) {
      this.recordTransaction({
        itemId: newItem.id,
        itemName: newItem.name,
        sku: newItem.sku,
        type: 'STOCK_IN',
        quantity: newItem.quantity,
        previousQty: 0,
        newQty: newItem.quantity,
        reference: 'INITIAL_REGISTRATION',
        operator: 'System Admin',
        locationTo: newItem.location,
        notes: 'Initial inventory asset cataloging.'
      });
    }

    this.saveToDisk();
    this.broadcast('ITEM_CREATED', newItem);
    return newItem;
  }

  public updateItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
    const index = this.data.items.findIndex(i => i.id === id);
    if (index === -1) return null;

    const existing = this.data.items[index];
    const previousQty = existing.quantity;

    const updated: InventoryItem = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    // If quantity was directly modified, record audit transaction
    if (updates.quantity !== undefined && updates.quantity !== previousQty) {
      const diff = updates.quantity - previousQty;
      this.recordTransaction({
        itemId: updated.id,
        itemName: updated.name,
        sku: updated.sku,
        type: diff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
        quantity: Math.abs(diff),
        previousQty,
        newQty: updates.quantity,
        reference: 'MANUAL_EDIT',
        operator: 'Admin / Inventory Officer',
        notes: `Direct quantity update from ${previousQty} to ${updates.quantity}.`
      });
    }

    this.data.items[index] = updated;
    this.saveToDisk();
    this.broadcast('ITEM_UPDATED', updated);
    return updated;
  }

  public deleteItem(id: string): boolean {
    const index = this.data.items.findIndex(i => i.id === id);
    if (index === -1) return false;

    const deleted = this.data.items.splice(index, 1)[0];
    this.saveToDisk();
    this.broadcast('ITEM_DELETED', { id: deleted.id, name: deleted.name, sku: deleted.sku });
    return true;
  }

  // --- Transactions & Stock Operations ---
  public getTransactions(limit = 100): StockTransaction[] {
    return this.data.transactions.slice(0, limit);
  }

  public recordTransaction(txInput: Omit<StockTransaction, 'id' | 'timestamp'>): StockTransaction {
    const tx: StockTransaction = {
      ...txInput,
      id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.data.transactions.unshift(tx);
    if (this.data.transactions.length > 500) {
      this.data.transactions = this.data.transactions.slice(0, 500);
    }
    this.saveToDisk();
    this.broadcast('TRANSACTION_RECORDED', tx);
    return tx;
  }

  public processStockOperation(params: {
    itemId: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'DEPLOYMENT' | 'TRANSFER' | 'RMA_RETURN' | 'AUDIT_ADJUSTMENT';
    quantity: number;
    reference: string;
    operator: string;
    recipient?: string;
    locationFrom?: string;
    locationTo?: string;
    notes?: string;
  }): { success: boolean; item?: InventoryItem; transaction?: StockTransaction; error?: string } {
    const item = this.data.items.find(i => i.id === params.itemId || i.sku === params.itemId || i.barcode === params.itemId);
    if (!item) {
      return { success: false, error: 'Item not found in inventory catalog' };
    }

    const previousQty = item.quantity;
    let newQty = previousQty;

    if (params.type === 'STOCK_IN' || params.type === 'RMA_RETURN') {
      newQty = previousQty + params.quantity;
    } else if (params.type === 'STOCK_OUT' || params.type === 'DEPLOYMENT') {
      if (previousQty < params.quantity) {
        return {
          success: false,
          error: `Insufficient stock: Requested ${params.quantity}, but only ${previousQty} available in warehouse.`
        };
      }
      newQty = previousQty - params.quantity;
    } else if (params.type === 'AUDIT_ADJUSTMENT') {
      newQty = params.quantity; // Direct set to counted physical quantity
    } else if (params.type === 'TRANSFER') {
      // Transfer stays within company, quantity doesn't necessarily change total unless tracked by sublocation
      if (params.locationTo) {
        item.location = params.locationTo;
      }
    }

    item.quantity = newQty;
    item.updatedAt = new Date().toISOString();

    const tx = this.recordTransaction({
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: params.type,
      quantity: params.quantity,
      previousQty,
      newQty,
      reference: params.reference || 'QUICK_OP',
      operator: params.operator || 'Stallone Yabom',
      recipient: params.recipient,
      locationFrom: params.locationFrom || item.location,
      locationTo: params.locationTo,
      notes: params.notes
    });

    this.saveToDisk();
    this.broadcast('ITEM_UPDATED', item);
    return { success: true, item, transaction: tx };
  }

  // --- Licenses ---
  public getLicenses(): SoftwareLicense[] {
    return this.data.licenses;
  }

  public saveLicense(license: SoftwareLicense): SoftwareLicense {
    const index = this.data.licenses.findIndex(l => l.id === license.id);
    if (index >= 0) {
      this.data.licenses[index] = license;
    } else {
      this.data.licenses.unshift(license);
    }
    this.saveToDisk();
    this.broadcast('LICENSE_UPDATED', license);
    return license;
  }

  public deleteLicense(id: string): boolean {
    const idx = this.data.licenses.findIndex(l => l.id === id);
    if (idx === -1) return false;
    this.data.licenses.splice(idx, 1);
    this.saveToDisk();
    this.broadcast('LICENSE_UPDATED', { id, deleted: true });
    return true;
  }

  // --- Deployments ---
  public getDeployments(): ClientDeployment[] {
    return this.data.deployments;
  }

  public saveDeployment(deployment: ClientDeployment): ClientDeployment {
    const index = this.data.deployments.findIndex(d => d.id === deployment.id);
    if (index >= 0) {
      this.data.deployments[index] = deployment;
    } else {
      this.data.deployments.unshift(deployment);
    }
    this.saveToDisk();
    this.broadcast('DEPLOYMENT_UPDATED', deployment);
    return deployment;
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveToDisk();
    return this.data.settings;
  }

  // --- Database Management & Backups ---
  public getFullSnapshot(): DatabaseSnapshot {
    return {
      ...this.data,
      exportedAt: new Date().toISOString()
    };
  }

  public restoreSnapshot(snapshot: DatabaseSnapshot): boolean {
    if (!snapshot || !Array.isArray(snapshot.items)) {
      throw new Error('Invalid snapshot format: missing items array');
    }
    this.data = {
      schemaVersion: snapshot.schemaVersion || '2.0.0',
      exportedAt: new Date().toISOString(),
      items: snapshot.items || [],
      transactions: snapshot.transactions || [],
      licenses: snapshot.licenses || [],
      deployments: snapshot.deployments || [],
      suppliers: snapshot.suppliers || [],
      settings: snapshot.settings || this.data.settings
    };
    this.saveToDisk();
    this.broadcast('DB_IMPORTED', { count: this.data.items.length });
    return true;
  }

  public resetDatabase(): DatabaseSnapshot {
    this.data = createDefaultSeed();
    this.saveToDisk();
    this.broadcast('DB_RESET', { timestamp: new Date().toISOString() });
    return this.data;
  }

  public executeCustomQuery(query: {
    table: 'items' | 'transactions' | 'licenses' | 'deployments' | 'suppliers';
    filterField?: string;
    filterValue?: string;
    minQuantity?: number;
    maxQuantity?: number;
    limit?: number;
  }) {
    const table = query.table || 'items';
    let results: any[] = (this.data as any)[table] || [];

    if (query.filterField && query.filterValue !== undefined) {
      const qVal = String(query.filterValue).toLowerCase();
      results = results.filter(row => {
        const val = row[query.filterField!];
        if (val === undefined || val === null) return false;
        return String(val).toLowerCase().includes(qVal);
      });
    }

    if (query.minQuantity !== undefined && table === 'items') {
      results = results.filter((item: InventoryItem) => item.quantity >= query.minQuantity!);
    }

    if (query.maxQuantity !== undefined && table === 'items') {
      results = results.filter((item: InventoryItem) => item.quantity <= query.maxQuantity!);
    }

    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return {
      table,
      matchedCount: results.length,
      data: results
    };
  }
}

export const db = new InventoryDatabase();
