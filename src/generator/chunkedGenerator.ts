import seedrandom from 'seedrandom';
import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import type {
  Vendor,
  PurchaseOrder,
  GRN,
  Invoice,
  Payment,
  PRHeader,
  PRLine,
} from '../schemas';
import {
  generateVendorId,
  generatePONumber,
  generateGRNNumber,
  generateInvoiceNumber,
  generatePaymentId,
  generatePRNumber,
  generatePRLineId,
} from '../schemas';
import { generateVendors } from './baseGenerator';
// We'll generate PRs inline for chunked mode
import type { GeneratorConfig } from './baseGenerator';

// ============================================================================
// Index Maps (Minimal)
// ============================================================================

export interface POIndex {
  po_no: string;
  po_date: Date;
  vendor_id: string;
  total_amount: number;
}

export interface InvoiceIndex {
  invoice_no: string;
  invoice_date: Date;
  vendor_id: string;
  total_amount: number;
  po_no?: string;
}

export interface VendorIndex {
  vendor_id: string;
  status: 'active' | 'inactive';
  created_date?: Date;
}

// ============================================================================
// Chunked Generator Types
// ============================================================================

export interface ChunkedData {
  prHeaders: PRHeader[];
  prLines: PRLine[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  invoices: Invoice[];
  payments: Payment[];
  chunkIndex: number;
  isLastChunk: boolean;
}

export interface ChunkedGeneratorContext {
  vendors: Vendor[];
  vendorMap: Map<string, VendorIndex>;
  poIndexMap: Map<string, POIndex>;
  invoiceIndexMap: Map<string, InvoiceIndex>;
  rng: () => number;
  startYear: number;
  endYear: number;
  grnRatio: number;
  invoiceRatio: number;
  paymentRatio: number;
  chunkSize: number;
  totalChunks: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculateTax(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

function generatePAN(rng: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const firstPart = Array.from({ length: 3 }, () => chars[Math.floor(rng() * chars.length)]).join('');
  const secondPart = Array.from({ length: 4 }, () => digits[Math.floor(rng() * digits.length)]).join('');
  const thirdPart = Array.from({ length: 1 }, () => chars[Math.floor(rng() * chars.length)]).join('');
  return `${firstPart}${secondPart}${thirdPart}`;
}

function generateGSTIN(stateCode: string, rng: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const pan = generatePAN(rng);
  const randomChars = Array.from({ length: 3 }, () => chars[Math.floor(rng() * chars.length)]).join('');
  return `${stateCode}${pan}${randomChars}Z`;
}

function generateIFSC(rng: () => number): string {
  const bankCodes = ['HDFC', 'ICIC', 'SBIN', 'PNBA', 'UTIB'];
  const bankCode = bankCodes[Math.floor(rng() * bankCodes.length)];
  const branchCode = String(Math.floor(rng() * 10000)).padStart(4, '0');
  return `${bankCode}0${branchCode}`;
}

// ============================================================================
// Chunked PO Generator
// ============================================================================

function generatePOsChunk(
  startIndex: number,
  count: number,
  context: ChunkedGeneratorContext
): PurchaseOrder[] {
  const purchaseOrders: PurchaseOrder[] = [];
  const activeVendors = context.vendors.filter(v => v.status === 'active');
  
  if (activeVendors.length === 0) {
    return purchaseOrders;
  }

  let poSequence = startIndex + 1;

  for (let i = 0; i < count; i++) {
    const vendor = activeVendors[Math.floor(context.rng() * activeVendors.length)];
    const year = context.startYear + Math.floor(context.rng() * (context.endYear - context.startYear + 1));
    const poNo = generatePONumber(year, poSequence++);
    
    const poDate = dayjs(new Date(year, Math.floor(context.rng() * 12), Math.floor(context.rng() * 28) + 1)).toDate();
    const orderAmount = Math.round((context.rng() * 990000 + 10000) * 100) / 100;
    const taxRate = [5, 12, 18, 28][Math.floor(context.rng() * 4)] / 100;
    const taxAmount = calculateTax(orderAmount, taxRate);
    const totalAmount = orderAmount + taxAmount;

    const statusOptions: PurchaseOrder['status'][] = ['draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed'];
    const status = statusOptions[Math.floor(context.rng() * statusOptions.length)];
    
    const approvalStatus: PurchaseOrder['approval_status'] = 
      status === 'approved' ? 'approved' : 
      status === 'rejected' ? 'rejected' : 
      'pending';

    const po: PurchaseOrder = {
      po_no: poNo,
      vendor_id: vendor.vendor_id,
      po_date: poDate,
      order_amount: orderAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: 'INR',
      status,
      approval_status: approvalStatus,
      approved_by: approvalStatus === 'approved' ? faker.person.fullName() : undefined,
      approval_date: approvalStatus === 'approved' ? addDays(poDate, Math.floor(context.rng() * 5)) : undefined,
      created_by: faker.person.fullName(),
      created_date: poDate,
    };

    purchaseOrders.push(po);

    // Update index map
    context.poIndexMap.set(poNo, {
      po_no: poNo,
      po_date: poDate,
      vendor_id: vendor.vendor_id,
      total_amount: totalAmount,
    });
  }

  return purchaseOrders;
}

// ============================================================================
// Chunked GRN Generator
// ============================================================================

function generateGRNsChunk(
  purchaseOrders: PurchaseOrder[],
  context: ChunkedGeneratorContext
): GRN[] {
  const grns: GRN[] = [];
  const posForGRN = purchaseOrders.filter(() => context.rng() < context.grnRatio);

  let grnSequence = context.poIndexMap.size - posForGRN.length + 1;

  for (const po of posForGRN) {
    const year = po.po_date.getFullYear();
    const grnNo = generateGRNNumber(year, grnSequence++);
    
    const grnDate = addDays(po.po_date, Math.floor(context.rng() * 30) + 1);
    const quantityOrdered = Math.floor(context.rng() * 100) + 1;
    const quantityReceived = quantityOrdered;
    const receivedAmount = po.order_amount;
    const taxAmount = po.tax_amount;
    const totalAmount = receivedAmount + taxAmount;

    grns.push({
      grn_no: grnNo,
      po_no: po.po_no,
      vendor_id: po.vendor_id,
      grn_date: grnDate,
      quantity_ordered: quantityOrdered,
      quantity_received: quantityReceived,
      received_amount: receivedAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'completed',
      received_by: faker.person.fullName(),
      remarks: undefined,
    });
  }

  return grns;
}

// ============================================================================
// Chunked Invoice Generator
// ============================================================================

function generateInvoicesChunk(
  purchaseOrders: PurchaseOrder[],
  grns: GRN[],
  context: ChunkedGeneratorContext
): Invoice[] {
  const invoices: Invoice[] = [];
  const grnMap = new Map(grns.map(grn => [grn.po_no, grn]));
  
  const eligiblePOs = purchaseOrders.filter(() => context.rng() < context.invoiceRatio);
  let invoiceSequence = context.invoiceIndexMap.size + 1;

  for (const po of eligiblePOs) {
    const year = po.po_date.getFullYear();
    const invoiceNo = generateInvoiceNumber(year, invoiceSequence++);
    
    const grn = grnMap.get(po.po_no);
    const invoiceDate = grn ? addDays(grn.grn_date, Math.floor(context.rng() * 10) + 1) : addDays(po.po_date, Math.floor(context.rng() * 45) + 1);
    
    const invoiceAmount = po.order_amount;
    const taxAmount = po.tax_amount;
    const totalAmount = invoiceAmount + taxAmount;
    const dueDate = addDays(invoiceDate, 30);

    const invoice: Invoice = {
      invoice_no: invoiceNo,
      vendor_id: po.vendor_id,
      po_no: po.po_no,
      grn_no: grn?.grn_no,
      invoice_date: invoiceDate,
      due_date: dueDate,
      invoice_amount: invoiceAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: 'INR',
      status: 'pending_approval',
      approval_status: 'pending',
      approved_by: undefined,
      approval_date: undefined,
      created_by: faker.person.fullName(),
      created_date: invoiceDate,
    };

    invoices.push(invoice);

    // Update index map
    context.invoiceIndexMap.set(invoiceNo, {
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      vendor_id: po.vendor_id,
      total_amount: totalAmount,
      po_no: po.po_no,
    });
  }

  return invoices;
}

// ============================================================================
// Chunked Payment Generator
// ============================================================================

function generatePaymentsChunk(
  invoices: Invoice[],
  context: ChunkedGeneratorContext
): Payment[] {
  const payments: Payment[] = [];
  const eligibleInvoices = invoices.filter(() => context.rng() < context.paymentRatio);
  let paymentSequence = 1;

  for (const invoice of eligibleInvoices) {
    const year = invoice.invoice_date.getFullYear();
    const paymentId = generatePaymentId(year, paymentSequence++);
    
    const paymentDate = addDays(invoice.invoice_date, Math.floor(context.rng() * 30) + 5);
    const paymentAmount = invoice.total_amount;

    payments.push({
      payment_id: paymentId,
      invoice_no: invoice.invoice_no,
      vendor_id: invoice.vendor_id,
      payment_date: paymentDate,
      payment_amount: paymentAmount,
      currency: 'INR',
      payment_method: ['bank_transfer', 'cheque', 'cash'][Math.floor(context.rng() * 3)] as Payment['payment_method'],
      status: 'completed',
      approval_status: 'approved',
      approved_by: faker.person.fullName(),
      approval_date: addDays(paymentDate, -1),
      processed_by: faker.person.fullName(),
      processed_date: paymentDate,
      created_date: paymentDate,
      remarks: undefined,
    });
  }

  return payments;
}

// ============================================================================
// Main Chunked Generator
// ============================================================================

/**
 * Generator function for chunked data generation
 * Yields chunks of PR/PO/GRN/Invoice/Payment data
 */
export function* generateChunkedData(
  config: GeneratorConfig
): Generator<ChunkedData, void, unknown> {
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  const startYear = config.startYear || new Date().getFullYear() - 1;
  const endYear = config.endYear || new Date().getFullYear();
  const grnRatio = config.grnRatio ?? 0.8;
  const invoiceRatio = config.invoiceRatio ?? 0.9;
  const paymentRatio = config.paymentRatio ?? 0.85;
  const chunkSize = config.chunkSize || 10000;

  // Generate all vendors upfront (small dataset)
  const vendors = generateVendors(config.vendorCount, random, startYear);
  const vendorMap = new Map<string, VendorIndex>(
    vendors.map(v => [v.vendor_id, {
      vendor_id: v.vendor_id,
      status: v.status,
      created_date: v.created_date,
    }])
  );

  // Initialize index maps
  const poIndexMap = new Map<string, POIndex>();
  const invoiceIndexMap = new Map<string, InvoiceIndex>();

  const context: ChunkedGeneratorContext = {
    vendors,
    vendorMap,
    poIndexMap,
    invoiceIndexMap,
    rng: random,
    startYear,
    endYear,
    grnRatio,
    invoiceRatio,
    paymentRatio,
    chunkSize,
    totalChunks: Math.ceil(config.poCount / chunkSize),
  };

  // Generate in chunks
  const totalChunks = Math.ceil(config.poCount / chunkSize);
  let poSequenceCounter = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const remainingPOs = config.poCount - poSequenceCounter;
    const chunkPOCount = Math.min(chunkSize, remainingPOs);
    
    // Generate PRs and PR lines for this chunk (simplified inline generation)
    const prCount = Math.floor(chunkPOCount * 0.8);
    const prHeaders: PRHeader[] = [];
    const prLines: PRLine[] = [];
    const prSequenceStart = chunkIndex * context.chunkSize + 1;
    
    for (let i = 0; i < prCount; i++) {
      const year = startYear + Math.floor(random() * (endYear - startYear + 1));
      const prSequence = prSequenceStart + i;
      const prNo = generatePRNumber(year, prSequence);
      const requestDate = dayjs(new Date(year, Math.floor(random() * 12), Math.floor(random() * 28) + 1)).toDate();
      const totalAmount = parseFloat(faker.finance.amount({ min: 100, max: 100000, dec: 2 }));

      prHeaders.push({
        pr_no: prNo,
        requested_by: faker.person.fullName(),
        request_date: requestDate,
        department: faker.commerce.department(),
        total_amount: totalAmount,
        currency: 'INR',
        status: random() > 0.1 ? 'approved' : 'pending_approval',
        approval_status: random() > 0.1 ? 'approved' : 'pending',
        approved_by: random() > 0.2 ? faker.person.fullName() : undefined,
        approval_date: random() > 0.2 ? addDays(requestDate, Math.floor(random() * 10)) : undefined,
      });

      // Generate 1-3 PR lines
      const numLines = Math.floor(random() * 3) + 1;
      for (let j = 0; j < numLines; j++) {
        const lineId = generatePRLineId(year, prSequence, j + 1);
        const quantity = Math.floor(random() * 100) + 1;
        const unitPrice = parseFloat(faker.finance.amount({ min: 10, max: 1000, dec: 2 }));
        const lineAmount = quantity * unitPrice;

        prLines.push({
          pr_line_id: lineId,
          pr_no: prNo,
          item_description: faker.commerce.productName(),
          quantity,
          unit_price: unitPrice,
          line_amount: lineAmount,
          item_type: random() > 0.3 ? 'goods' : 'service',
          expected_delivery_date: addDays(requestDate, Math.floor(random() * 60)),
        });
      }
    }

    // Generate POs for this chunk
    const purchaseOrders = generatePOsChunk(poSequenceCounter, chunkPOCount, context);
    poSequenceCounter += chunkPOCount;

    // Link PRs to POs (simple linking based on index)
    const prHeadersLinked = prHeaders.map((pr, idx) => {
      if (idx < purchaseOrders.length && context.rng() > 0.3) {
        return { ...pr, po_no: purchaseOrders[idx].po_no };
      }
      return pr;
    });

    // Generate GRNs for this chunk
    const grns = generateGRNsChunk(purchaseOrders, context);

    // Generate invoices for this chunk
    const invoices = generateInvoicesChunk(purchaseOrders, grns, context);

    // Generate payments for this chunk
    const payments = generatePaymentsChunk(invoices, context);

    yield {
      prHeaders: prHeadersLinked,
      prLines,
      purchaseOrders,
      grns,
      invoices,
      payments,
      chunkIndex,
      isLastChunk: chunkIndex === totalChunks - 1,
    };
  }
}

/**
 * Get index maps for use in anomaly injection
 */
export function getIndexMaps(context: ChunkedGeneratorContext) {
  return {
    vendorMap: context.vendorMap,
    poIndexMap: context.poIndexMap,
    invoiceIndexMap: context.invoiceIndexMap,
  };
}

