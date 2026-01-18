import { faker } from '@faker-js/faker';
import seedrandom from 'seedrandom';
import dayjs from 'dayjs';
import type {
  Vendor,
  PurchaseOrder,
  GRN,
  Invoice,
  Payment,
  PRHeader,
  PRLine,
  Quotation,
  ContractMaster,
  RoleMaster,
  PRWorkflowLog,
  POWorkflowLog,
  PaymentWorkflowLog,
  VendorBankChangeLog,
  POChangeLog,
} from '../schemas';
import {
  generateVendorId,
  generatePONumber,
  generateGRNNumber,
  generateInvoiceNumber,
  generatePaymentId,
  generatePRNumber,
  generatePRLineId,
  generateQuotationId,
  generateContractId,
  generateRoleAssignmentId,
  generateWorkflowLogId,
  generateChangeLogId,
} from '../schemas';

// ============================================================================
// Types and Configuration
// ============================================================================

export interface GeneratorConfig {
  seed: string | number;
  vendorCount: number;
  poCount: number;
  grnRatio?: number; // Ratio of POs that have GRNs (0-1, default 0.8)
  invoiceRatio?: number; // Ratio of POs/GRNs that have invoices (0-1, default 0.9)
  paymentRatio?: number; // Ratio of invoices that have payments (0-1, default 0.85)
  startYear?: number;
  endYear?: number;
  chunkSize?: number; // For streaming large datasets
  applyConstraints?: boolean; // Whether to apply constraints (default true)
  topVendorRatio?: number; // Percentage of POs going to top vendors (default 0.4)
  topVendorCount?: number; // Number of top vendors (default 20% of total)
  goodsServiceSplit?: number; // Ratio of goods vs service (0-1, default 0.7)
  creditDays?: number; // Standard credit days (default 30)
}

export interface GeneratedData {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  invoices: Invoice[];
  payments: Payment[];
  prHeaders: PRHeader[];
  prLines: PRLine[];
  quotations: Quotation[];
  contracts: ContractMaster[];
  roleMaster: RoleMaster[];
  prWorkflowLogs: PRWorkflowLog[];
  poWorkflowLogs: POWorkflowLog[];
  paymentWorkflowLogs: PaymentWorkflowLog[];
  vendorBankChangeLogs: VendorBankChangeLog[];
  poChangeLogs: POChangeLog[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a valid PAN number (ABCDE1234F format)
 */
function generatePAN(rng: () => number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let pan = '';
  for (let i = 0; i < 5; i++) {
    pan += letters[Math.floor(rng() * 26)];
  }
  for (let i = 0; i < 4; i++) {
    pan += Math.floor(rng() * 10).toString();
  }
  pan += letters[Math.floor(rng() * 26)];
  return pan;
}

/**
 * Generates a valid GSTIN (15 characters)
 */
function generateGSTIN(stateCode: string, rng: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let gstin = stateCode.padStart(2, '0');
  // 10 chars for PAN-like structure
  for (let i = 0; i < 10; i++) {
    gstin += chars[Math.floor(rng() * chars.length)];
  }
  gstin += 'Z';
  gstin += chars[Math.floor(rng() * chars.length)];
  return gstin;
}

/**
 * Generates a valid IFSC code (ABCD0123456 format)
 */
function generateIFSC(rng: () => number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ifsc = '';
  for (let i = 0; i < 4; i++) {
    ifsc += letters[Math.floor(rng() * 26)];
  }
  ifsc += '0';
  const alphanum = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    ifsc += alphanum[Math.floor(rng() * alphanum.length)];
  }
  return ifsc;
}

/**
 * Adds days to a date
 */
function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

/**
 * Adds variance to amount (typically ±2-5%)
 */
function applyAmountVariance(amount: number, variancePercent: number, rng: () => number): number {
  const variance = (rng() * 2 - 1) * variancePercent; // -variancePercent to +variancePercent
  return Math.round(amount * (1 + variance / 100) * 100) / 100;
}

/**
 * Calculates tax amount based on order amount and tax rate
 */
function calculateTax(orderAmount: number, taxRate: number): number {
  return Math.round(orderAmount * taxRate * 100) / 100;
}

// ============================================================================
// Vendor Generator
// ============================================================================

export function generateVendors(
  count: number,
  rng: () => number,
  startYear: number
): Vendor[] {
  const vendors: Vendor[] = [];
  const baseDate = new Date(startYear, 0, 1);

  for (let i = 1; i <= count; i++) {
    const vendorId = generateVendorId(i);
    const companyName = faker.company.name();
    const createdDate = dayjs(baseDate)
      .add(Math.floor(rng() * 365), 'day')
      .toDate();

    vendors.push({
      vendor_id: vendorId,
      vendor_name: companyName,
      pan: rng() > 0.1 ? generatePAN(rng) : undefined, // 90% have PAN
      gstin: rng() > 0.15 ? generateGSTIN(String(Math.floor(rng() * 36)).padStart(2, '0'), rng) : undefined, // 85% have GSTIN
      bank_account: String(Math.floor(rng() * 9000000000) + 1000000000), // 10 digit account
      ifsc: rng() > 0.05 ? generateIFSC(rng) : undefined, // 95% have IFSC
      bank_name: faker.company.name() + ' Bank',
      account_holder_name: companyName,
      address: faker.location.streetAddress({ useFullAddress: true }),
      contact_email: faker.internet.email({ provider: 'example.com' }),
      contact_phone: faker.phone.number('+91##########'),
      status: rng() > 0.1 ? 'active' : 'inactive', // 90% active
      bank_change_verification: rng() > 0.7, // 30% have bank changes
      created_date: createdDate,
      updated_date: rng() > 0.5 ? dayjs(createdDate).add(Math.floor(rng() * 100), 'day').toDate() : undefined,
      verified_by: rng() > 0.3 ? faker.person.fullName() : undefined,
      verification_date: rng() > 0.4 ? dayjs(createdDate).add(Math.floor(rng() * 50), 'day').toDate() : undefined,
    });
  }

  return vendors;
}

// ============================================================================
// Purchase Order Generator
// ============================================================================

export function generatePurchaseOrders(
  count: number,
  vendors: Vendor[],
  rng: () => number,
  startYear: number,
  endYear: number
): PurchaseOrder[] {
  const purchaseOrders: PurchaseOrder[] = [];
  const activeVendors = vendors.filter(v => v.status === 'active');

  if (activeVendors.length === 0) {
    throw new Error('No active vendors available for PO generation');
  }

  let poSequence = 1;

  for (let year = startYear; year <= endYear && purchaseOrders.length < count; year++) {
    const yearEnd = year === endYear ? count - purchaseOrders.length : Infinity;
    
    for (let i = 0; i < yearEnd; i++) {
      const vendor = activeVendors[Math.floor(rng() * activeVendors.length)];
      const poNo = generatePONumber(year, poSequence++);
      
      const poDate = dayjs(new Date(year, Math.floor(rng() * 12), Math.floor(rng() * 28) + 1)).toDate();
      const orderAmount = Math.round((rng() * 990000 + 10000) * 100) / 100; // 10k to 1M
      const taxRate = [5, 12, 18, 28][Math.floor(rng() * 4)] / 100; // Common GST rates
      const taxAmount = calculateTax(orderAmount, taxRate);
      const totalAmount = orderAmount + taxAmount;

      const statusOptions: PurchaseOrder['status'][] = ['draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed'];
      const status = statusOptions[Math.floor(rng() * statusOptions.length)];
      
      const approvalStatus: PurchaseOrder['approval_status'] = 
        status === 'approved' ? 'approved' : 
        status === 'rejected' ? 'rejected' : 
        'pending';

      purchaseOrders.push({
        po_no: poNo,
        vendor_id: vendor.vendor_id,
        po_date: poDate,
        expected_delivery_date: rng() > 0.2 ? addDays(poDate, Math.floor(rng() * 60) + 7) : undefined, // 80% have expected date
        order_amount: orderAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: 'INR',
        status,
        approval_status: approvalStatus,
        approved_by: approvalStatus === 'approved' && rng() > 0.3 ? faker.person.fullName() : undefined,
        approval_date: approvalStatus === 'approved' && rng() > 0.3 ? addDays(poDate, Math.floor(rng() * 7)) : undefined,
        rejected_reason: approvalStatus === 'rejected' && rng() > 0.5 ? faker.lorem.sentence() : undefined,
        created_by: faker.person.fullName(),
        created_date: poDate,
        updated_date: rng() > 0.4 ? addDays(poDate, Math.floor(rng() * 30)) : undefined,
        remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
      });
    }
  }

  return purchaseOrders;
}

// ============================================================================
// GRN Generator
// ============================================================================

export function generateGRNs(
  purchaseOrders: PurchaseOrder[],
  grnRatio: number,
  rng: () => number
): GRN[] {
  const grns: GRN[] = [];
  // Only generate GRNs for approved/completed POs
  const eligiblePOs = purchaseOrders.filter(po => 
    po.status === 'approved' || po.status === 'completed'
  );
  
  const posToGrn = Math.floor(eligiblePOs.length * grnRatio);
  const selectedPOs = eligiblePOs
    .sort(() => rng() - 0.5) // Shuffle
    .slice(0, posToGrn)
    .sort((a, b) => a.po_date.getTime() - b.po_date.getTime()); // Sort by date

  const grnByYear = new Map<number, number>();

  for (const po of selectedPOs) {
    const year = po.po_date.getFullYear();
    if (!grnByYear.has(year)) {
      grnByYear.set(year, 1);
    } else {
      grnByYear.set(year, grnByYear.get(year)! + 1);
    }

    const grnNo = generateGRNNumber(year, grnByYear.get(year)!);
    
    // GRN date should be >= PO date
    const minDate = po.po_date;
    const maxDaysAfterPO = 90; // GRN within 90 days of PO
    const grnDate = addDays(minDate, Math.floor(rng() * maxDaysAfterPO));
    
    // Amounts should match PO (with small variance)
    const variance = 2; // ±2%
    const receivedAmount = applyAmountVariance(po.order_amount, variance, rng);
    const taxAmount = calculateTax(receivedAmount, po.tax_amount / po.order_amount);
    const totalAmount = receivedAmount + taxAmount;

    const quantityOrdered = Math.floor(rng() * 1000) + 10;
    const quantityReceived = Math.floor(quantityOrdered * (0.8 + rng() * 0.2)); // 80-100% of ordered

    const statusOptions: GRN['status'][] = ['pending', 'partial', 'completed', 'rejected', 'cancelled'];
    const status = quantityReceived >= quantityOrdered ? 'completed' : 
                   quantityReceived > 0 ? 'partial' : 
                   statusOptions[Math.floor(rng() * statusOptions.length)];

    grns.push({
      grn_no: grnNo,
      po_no: po.po_no,
      vendor_id: po.vendor_id,
      grn_date: grnDate,
      received_date: rng() > 0.2 ? grnDate : undefined,
      received_amount: receivedAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      quantity_received: quantityReceived,
      quantity_ordered: quantityOrdered,
      status,
      quality_check_status: rng() > 0.3 ? (rng() > 0.1 ? 'passed' : 'failed') : undefined,
      received_by: faker.person.fullName(),
      created_date: grnDate,
      updated_date: rng() > 0.4 ? addDays(grnDate, Math.floor(rng() * 10)) : undefined,
      remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
    });
  }

  return grns;
}

// ============================================================================
// Invoice Generator
// ============================================================================

export function generateInvoices(
  purchaseOrders: PurchaseOrder[],
  grns: GRN[],
  invoiceRatio: number,
  rng: () => number
): Invoice[] {
  const invoices: Invoice[] = [];
  
  // Create map of GRNs by PO
  const grnByPO = new Map<string, GRN[]>();
  for (const grn of grns) {
    if (!grnByPO.has(grn.po_no)) {
      grnByPO.set(grn.po_no, []);
    }
    grnByPO.get(grn.po_no)!.push(grn);
  }

  // Generate invoices for POs (with preference for those with GRNs)
  const eligiblePOs = purchaseOrders.filter(po => 
    po.status === 'approved' || po.status === 'completed'
  );

  const posToInvoice = Math.floor(eligiblePOs.length * invoiceRatio);
  const selectedPOs = eligiblePOs
    .sort((a, b) => {
      // Prioritize POs with GRNs
      const aHasGRN = grnByPO.has(a.po_no);
      const bHasGRN = grnByPO.has(b.po_no);
      if (aHasGRN && !bHasGRN) return -1;
      if (!aHasGRN && bHasGRN) return 1;
      return rng() - 0.5;
    })
    .slice(0, posToInvoice)
    .sort((a, b) => a.po_date.getTime() - b.po_date.getTime());

  const invoiceByYear = new Map<number, number>();

  for (const po of selectedPOs) {
    const year = po.po_date.getFullYear();
    if (!invoiceByYear.has(year)) {
      invoiceByYear.set(year, 1);
    } else {
      invoiceByYear.set(year, invoiceByYear.get(year)! + 1);
    }

    const invoiceNo = generateInvoiceNumber(year, invoiceByYear.get(year)!);
    
    // Get corresponding GRN if exists
    const poGRNs = grnByPO.get(po.po_no) || [];
    const grn = poGRNs.length > 0 ? poGRNs[0] : undefined;

    // Invoice date should be >= max(PO date, GRN date if exists)
    const baseDate = grn ? (grn.grn_date > po.po_date ? grn.grn_date : po.po_date) : po.po_date;
    const invoiceDate = addDays(baseDate, Math.floor(rng() * 30)); // Invoice within 30 days

    // Amount should match PO (with small variance, typically ±3%)
    const variance = 3;
    const invoiceAmount = applyAmountVariance(po.order_amount, variance, rng);
    const taxRate = po.tax_amount / po.order_amount;
    const taxAmount = calculateTax(invoiceAmount, taxRate);
    const totalAmount = invoiceAmount + taxAmount;

    const statusOptions: Invoice['status'][] = ['draft', 'pending_approval', 'approved', 'rejected', 'paid', 'cancelled'];
    const status = statusOptions[Math.floor(rng() * statusOptions.length)];
    
    const approvalStatus: Invoice['approval_status'] = 
      status === 'approved' || status === 'paid' ? 'approved' : 
      status === 'rejected' ? 'rejected' : 
      'pending';

    invoices.push({
      invoice_no: invoiceNo,
      vendor_id: po.vendor_id,
      po_no: po.po_no,
      grn_no: grn?.grn_no,
      invoice_date: invoiceDate,
      due_date: rng() > 0.2 ? addDays(invoiceDate, Math.floor(rng() * 60) + 15) : undefined, // 80% have due date
      invoice_amount: invoiceAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: 'INR',
      status,
      approval_status: approvalStatus,
      approved_by: approvalStatus === 'approved' && rng() > 0.3 ? faker.person.fullName() : undefined,
      approval_date: approvalStatus === 'approved' && rng() > 0.3 ? addDays(invoiceDate, Math.floor(rng() * 7)) : undefined,
      rejected_reason: approvalStatus === 'rejected' && rng() > 0.5 ? faker.lorem.sentence() : undefined,
      created_by: faker.person.fullName(),
      created_date: invoiceDate,
      updated_date: rng() > 0.4 ? addDays(invoiceDate, Math.floor(rng() * 30)) : undefined,
      remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
      tax_rate: taxRate * 100, // Store as percentage
    });
  }

  return invoices;
}

// ============================================================================
// Payment Generator
// ============================================================================

export function generatePayments(
  invoices: Invoice[],
  vendors: Vendor[],
  paymentRatio: number,
  rng: () => number
): Payment[] {
  const payments: Payment[] = [];
  
  // Only generate payments for approved/paid invoices
  const eligibleInvoices = invoices.filter(inv => 
    inv.status === 'approved' || inv.status === 'paid'
  );

  const invoicesToPay = Math.floor(eligibleInvoices.length * paymentRatio);
  const selectedInvoices = eligibleInvoices
    .sort(() => rng() - 0.5) // Shuffle
    .slice(0, invoicesToPay)
    .sort((a, b) => a.invoice_date.getTime() - b.invoice_date.getTime()); // Sort by date

  const vendorMap = new Map<string, Vendor>();
  for (const vendor of vendors) {
    vendorMap.set(vendor.vendor_id, vendor);
  }

  const paymentByYear = new Map<number, number>();

  for (const invoice of selectedInvoices) {
    const year = invoice.invoice_date.getFullYear();
    if (!paymentByYear.has(year)) {
      paymentByYear.set(year, 1);
    } else {
      paymentByYear.set(year, paymentByYear.get(year)! + 1);
    }

    const paymentId = generatePaymentId(year, paymentByYear.get(year)!);
    
    const vendor = vendorMap.get(invoice.vendor_id);
    
    // Payment date should be >= Invoice date
    const paymentDate = addDays(invoice.invoice_date, Math.floor(rng() * 60)); // Payment within 60 days

    const paymentModes: Payment['payment_mode'][] = ['cheque', 'neft', 'rtgs', 'upi', 'card', 'cash', 'other'];
    const paymentMode = paymentModes[Math.floor(rng() * paymentModes.length)];

    const statusOptions: Payment['status'][] = ['pending', 'initiated', 'completed', 'failed', 'cancelled'];
    const status = statusOptions[Math.floor(rng() * statusOptions.length)];
    
    const approvalStatus: Payment['approval_status'] = 
      status === 'completed' ? 'approved' : 
      status === 'failed' ? 'rejected' : 
      'pending';

    payments.push({
      payment_id: paymentId,
      invoice_no: invoice.invoice_no,
      vendor_id: invoice.vendor_id,
      payment_date: paymentDate,
      payment_amount: invoice.total_amount, // Full payment (could be extended for partial payments)
      payment_mode: paymentMode,
      bank_account: vendor?.bank_account || String(Math.floor(rng() * 9000000000) + 1000000000),
      ifsc: vendor?.ifsc || generateIFSC(rng),
      cheque_number: paymentMode === 'cheque' ? String(Math.floor(rng() * 9000000) + 1000000) : undefined,
      transaction_reference: paymentMode !== 'cash' ? `TXN${String(Math.floor(rng() * 10000000000)).padStart(10, '0')}` : undefined,
      status,
      approval_status: approvalStatus,
      approved_by: approvalStatus === 'approved' && rng() > 0.3 ? faker.person.fullName() : undefined,
      approval_date: approvalStatus === 'approved' && rng() > 0.3 ? addDays(paymentDate, -Math.floor(rng() * 3)) : undefined,
      processed_by: status === 'completed' && rng() > 0.4 ? faker.person.fullName() : undefined,
      processed_date: status === 'completed' && rng() > 0.4 ? paymentDate : undefined,
      created_date: paymentDate,
      updated_date: rng() > 0.4 ? addDays(paymentDate, Math.floor(rng() * 5)) : undefined,
      remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
    });
  }

  return payments;
}

// ============================================================================
// Main Generator Function
// ============================================================================

export function generateBaseData(config: GeneratorConfig): GeneratedData {
  // Initialize seeded random number generator
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  // Set faker locale seed for reproducibility (faker v10 uses locale-based seeding)
  // We'll use our seeded random function for faker values instead

  const startYear = config.startYear || new Date().getFullYear() - 1;
  const endYear = config.endYear || new Date().getFullYear();
  const grnRatio = config.grnRatio ?? 0.8;
  const invoiceRatio = config.invoiceRatio ?? 0.9;
  const paymentRatio = config.paymentRatio ?? 0.85;

  // Generate in dependency order
  const vendors = generateVendors(config.vendorCount, random, startYear);
  const purchaseOrders = generatePurchaseOrders(
    config.poCount,
    vendors,
    random,
    startYear,
    endYear
  );
  const grns = generateGRNs(purchaseOrders, grnRatio, random);
  const invoices = generateInvoices(purchaseOrders, grns, invoiceRatio, random);
  const payments = generatePayments(invoices, vendors, paymentRatio, random);

  // Generate extended entities
  const prCount = Math.floor(config.poCount * 0.8); // 80% of POs have PRs
  const { prHeaders, prLines } = generatePRHeadersAndLines(prCount, purchaseOrders, random, startYear, endYear);
  const quotations = generateQuotations(purchaseOrders, random);
  const contracts = generateContracts(vendors, purchaseOrders, random, startYear, endYear);
  
  // Link contracts to POs (30-40% of POs)
  const contractMap = new Map<string, ContractMaster[]>();
  for (const contract of contracts) {
    if (!contractMap.has(contract.vendor_id)) {
      contractMap.set(contract.vendor_id, []);
    }
    contractMap.get(contract.vendor_id)!.push(contract);
  }
  
  for (const po of purchaseOrders) {
    if (random() > 0.65 && contractMap.has(po.vendor_id)) {
      const vendorContracts = contractMap.get(po.vendor_id)!;
      const matchingContract = vendorContracts.find(c => 
        po.po_date >= c.start_date && (!c.end_date || po.po_date <= c.end_date)
      );
      if (matchingContract) {
        po.contract_id = matchingContract.contract_id;
      }
    }
  }

  const userCount = Math.floor(config.vendorCount * 0.5); // 50% of vendor count as users
  const roleMaster = generateRoleMaster(userCount, random, startYear, endYear);
  const prWorkflowLogs = generatePRWorkflowLogs(prHeaders, random);
  const poWorkflowLogs = generatePOWorkflowLogs(purchaseOrders, random);
  const paymentWorkflowLogs = generatePaymentWorkflowLogs(payments, random);
  const vendorBankChangeLogs = generateVendorBankChangeLogs(vendors, random);
  const poChangeLogs = generatePOChangeLogs(purchaseOrders, random);

  return {
    vendors,
    purchaseOrders,
    grns,
    invoices,
    payments,
    prHeaders,
    prLines,
    quotations,
    contracts,
    roleMaster,
    prWorkflowLogs,
    poWorkflowLogs,
    paymentWorkflowLogs,
    vendorBankChangeLogs,
    poChangeLogs,
  };
}

// ============================================================================
// Streaming/Chunked Generator Functions
// ============================================================================

/**
 * Generator function that yields data in chunks to handle large datasets.
 * Vendors and POs are generated upfront (needed for linking).
 * GRNs, invoices, and payments are generated and yielded in chunks.
 */
export function* generateBaseDataChunked(config: GeneratorConfig): Generator<Partial<GeneratedData>, void, unknown> {
  const chunkSize = config.chunkSize || 10000;
  
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  const startYear = config.startYear || new Date().getFullYear() - 1;
  const endYear = config.endYear || new Date().getFullYear();
  const grnRatio = config.grnRatio ?? 0.8;
  const invoiceRatio = config.invoiceRatio ?? 0.9;
  const paymentRatio = config.paymentRatio ?? 0.85;

  // Generate base data (vendors and POs) - these are needed for linking
  // but are typically smaller datasets
  const vendors = generateVendors(config.vendorCount, random, startYear);
  const purchaseOrders = generatePurchaseOrders(
    config.poCount,
    vendors,
    random,
    startYear,
    endYear
  );

  // Yield vendors in chunks if needed
  if (vendors.length > chunkSize) {
    for (let i = 0; i < vendors.length; i += chunkSize) {
      yield {
        vendors: vendors.slice(i, i + chunkSize),
        purchaseOrders: [],
        grns: [],
        invoices: [],
        payments: [],
      };
    }
  } else {
    yield {
      vendors,
      purchaseOrders: [],
      grns: [],
      invoices: [],
      payments: [],
    };
  }

  // Yield POs in chunks if needed
  if (purchaseOrders.length > chunkSize) {
    for (let i = 0; i < purchaseOrders.length; i += chunkSize) {
      yield {
        vendors: [],
        purchaseOrders: purchaseOrders.slice(i, i + chunkSize),
        grns: [],
        invoices: [],
        payments: [],
      };
    }
  } else {
    yield {
      vendors: [],
      purchaseOrders,
      grns: [],
      invoices: [],
      payments: [],
    };
  }

  // Generate and yield GRNs in chunks
  const grns = generateGRNs(purchaseOrders, grnRatio, random);
  for (let i = 0; i < grns.length; i += chunkSize) {
    yield {
      vendors: [],
      purchaseOrders: [],
      grns: grns.slice(i, i + chunkSize),
      invoices: [],
      payments: [],
    };
  }

  // Generate and yield invoices in chunks
  const invoices = generateInvoices(purchaseOrders, grns, invoiceRatio, random);
  for (let i = 0; i < invoices.length; i += chunkSize) {
    yield {
      vendors: [],
      purchaseOrders: [],
      grns: [],
      invoices: invoices.slice(i, i + chunkSize),
      payments: [],
    };
  }

  // Generate and yield payments in chunks
  const payments = generatePayments(invoices, vendors, paymentRatio, random);
  for (let i = 0; i < payments.length; i += chunkSize) {
    yield {
      vendors: [],
      purchaseOrders: [],
      grns: [],
      invoices: [],
      payments: payments.slice(i, i + chunkSize),
    };
  }
}

/**
 * Async generator version for better memory management with very large datasets.
 * This version generates dependent entities on-demand as chunks are requested.
 */
export async function* generateBaseDataStream(
  config: GeneratorConfig
): AsyncGenerator<Partial<GeneratedData>, void, unknown> {
  const chunkSize = config.chunkSize || 10000;
  
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  const startYear = config.startYear || new Date().getFullYear() - 1;
  const endYear = config.endYear || new Date().getFullYear();

  // Generate base data
  const vendors = generateVendors(config.vendorCount, random, startYear);
  yield { vendors, purchaseOrders: [], grns: [], invoices: [], payments: [] };

  const purchaseOrders = generatePurchaseOrders(
    config.poCount,
    vendors,
    random,
    startYear,
    endYear
  );
  yield { vendors: [], purchaseOrders, grns: [], invoices: [], payments: [] };

  // Generate and yield GRNs
  const grnRatio = config.grnRatio ?? 0.8;
  const grns = generateGRNs(purchaseOrders, grnRatio, random);
  for (let i = 0; i < grns.length; i += chunkSize) {
    yield {
      vendors: [],
      purchaseOrders: [],
      grns: grns.slice(i, i + chunkSize),
      invoices: [],
      payments: [],
    };
  }

  // Generate and yield invoices
  const invoiceRatio = config.invoiceRatio ?? 0.9;
  const invoices = generateInvoices(purchaseOrders, grns, invoiceRatio, random);
  for (let i = 0; i < invoices.length; i += chunkSize) {
    yield {
      vendors: [],
      purchaseOrders: [],
      grns: [],
      invoices: invoices.slice(i, i + chunkSize),
      payments: [],
    };
  }

  // Generate and yield payments
  const paymentRatio = config.paymentRatio ?? 0.85;
  const payments = generatePayments(invoices, vendors, paymentRatio, random);
  for (let i = 0; i < payments.length; i += chunkSize) {
    yield {
      vendors: [],
      purchaseOrders: [],
      grns: [],
      invoices: [],
      payments: payments.slice(i, i + chunkSize),
    };
  }
}

