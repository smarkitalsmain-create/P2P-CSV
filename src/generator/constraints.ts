import seedrandom from 'seedrandom';
import type {
  Vendor,
  PurchaseOrder,
  GRN,
  Invoice,
  Payment,
  PRHeader,
  PRLine,
} from '../schemas';

// ============================================================================
// Constraint Configuration
// ============================================================================

export interface ConstraintConfig {
  seed: string | number;
  topVendorRatio?: number; // Percentage of POs going to top vendors (default 0.4 = 40%)
  topVendorCount?: number; // Number of top vendors (default 20% of total vendors)
  goodsServiceSplit?: number; // Ratio of goods vs service (0-1, default 0.7 = 70% goods)
  creditDays?: number; // Standard credit days for payment terms (default 30)
}

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================================================
// Vendor Distribution Constraints
// ============================================================================

/**
 * Redistributes POs to ensure top vendors get more POs
 */
export function applyVendorDistribution(
  purchaseOrders: PurchaseOrder[],
  vendors: Vendor[],
  config: ConstraintConfig
): void {
  const rng = seedrandom(String(config.seed));
  const random = () => rng();
  
  const topVendorRatio = config.topVendorRatio ?? 0.4;
  const topVendorCount = config.topVendorCount ?? Math.max(1, Math.floor(vendors.length * 0.2));
  
  // Sort vendors by some criteria (e.g., creation date, or use existing order)
  const sortedVendors = [...vendors].sort((a, b) => {
    const aDate = a.created_date?.getTime() || 0;
    const bDate = b.created_date?.getTime() || 0;
    return aDate - bDate; // Earlier vendors are "top vendors"
  });
  
  const topVendors = sortedVendors.slice(0, topVendorCount);
  const topVendorIds = new Set(topVendors.map(v => v.vendor_id));
  const otherVendors = sortedVendors.slice(topVendorCount);
  
  // Calculate target distribution
  const totalPOs = purchaseOrders.length;
  const topVendorPOs = Math.floor(totalPOs * topVendorRatio);
  const otherVendorPOs = totalPOs - topVendorPOs;
  
  // Redistribute POs
  let topVendorPOsAssigned = 0;
  let otherVendorPOsAssigned = 0;
  
  for (const po of purchaseOrders) {
    if (topVendorPOsAssigned < topVendorPOs && topVendorIds.has(po.vendor_id)) {
      // Keep current assignment if it's a top vendor
      topVendorPOsAssigned++;
    } else if (topVendorPOsAssigned < topVendorPOs) {
      // Reassign to top vendor
      const randomTopVendor = topVendors[Math.floor(random() * topVendors.length)];
      po.vendor_id = randomTopVendor.vendor_id;
      topVendorPOsAssigned++;
    } else if (otherVendorPOsAssigned < otherVendorPOs) {
      // Assign to other vendors
      if (!topVendorIds.has(po.vendor_id)) {
        otherVendorPOsAssigned++;
      } else {
        // Reassign from top vendor to other vendor
        const randomOtherVendor = otherVendors[Math.floor(random() * otherVendors.length)];
        po.vendor_id = randomOtherVendor.vendor_id;
        otherVendorPOsAssigned++;
      }
    }
  }
}

// ============================================================================
// Goods/Service Split Constraints
// ============================================================================

/**
 * Ensures only goods POs require GRN (service POs don't have GRNs)
 */
export function applyGoodsServiceSplit(
  purchaseOrders: PurchaseOrder[],
  grns: GRN[],
  config: ConstraintConfig
): void {
  const rng = seedrandom(String(config.seed));
  const random = () => rng();
  
  const goodsServiceSplit = config.goodsServiceSplit ?? 0.7;
  const goodsPOs = Math.floor(purchaseOrders.length * goodsServiceSplit);
  
  // Mark POs as goods or service (we'll use a heuristic based on amount or category)
  // For simplicity, we'll use the order amount - higher amounts more likely to be goods
  const sortedPOs = [...purchaseOrders].sort((a, b) => b.total_amount - a.total_amount);
  
  const goodsPONos = new Set(sortedPOs.slice(0, goodsPOs).map(po => po.po_no));
  
  // Filter out GRNs for service POs (create new array to avoid mutation issues)
  const goodsGRNs: GRN[] = [];
  for (const grn of grns) {
    if (goodsPONos.has(grn.po_no)) {
      goodsGRNs.push(grn);
    }
  }
  
  // Replace grns array with filtered version
  grns.length = 0;
  grns.push(...goodsGRNs);
}

// ============================================================================
// Invoice Amount Constraints
// ============================================================================

/**
 * Ensures invoice amounts are consistent (amount = sum of line amounts + tax)
 * Note: Since we don't have invoice lines in our schema, we validate that
 * invoice_amount + tax_amount = total_amount
 */
export function applyInvoiceAmountConstraints(invoices: Invoice[]): void {
  for (const invoice of invoices) {
    // Recalculate total to ensure consistency
    const calculatedTotal = invoice.invoice_amount + invoice.tax_amount;
    invoice.total_amount = Math.round(calculatedTotal * 100) / 100;
  }
}

// ============================================================================
// Payment Due Date Constraints
// ============================================================================

/**
 * Ensures payment due dates are consistent with invoice dates and credit days
 */
export function applyPaymentDueDateConstraints(
  invoices: Invoice[],
  payments: Payment[],
  config: ConstraintConfig
): void {
  const creditDays = config.creditDays ?? 30;
  const invoiceMap = new Map(invoices.map(inv => [inv.invoice_no, inv]));
  
  for (const invoice of invoices) {
    if (!invoice.due_date && invoice.invoice_date) {
      invoice.due_date = addDays(invoice.invoice_date, creditDays);
    }
  }
  
  // Ensure payment dates are after invoice dates (except for anomalies)
  for (const payment of payments) {
    const invoice = invoiceMap.get(payment.invoice_no);
    if (invoice && payment.payment_date < invoice.invoice_date) {
      // Adjust payment date to be at least invoice date (anomalies will override this)
      payment.payment_date = new Date(invoice.invoice_date);
    }
  }
}

// ============================================================================
// Apply All Constraints
// ============================================================================

export interface Dataset {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  invoices: Invoice[];
  payments: Payment[];
  prHeaders?: PRHeader[];
  prLines?: PRLine[];
}

/**
 * Applies all constraints to normalize the dataset
 */
export function applyConstraints(
  data: Dataset,
  config: ConstraintConfig
): void {
  // 1. Vendor distribution
  applyVendorDistribution(data.purchaseOrders, data.vendors, config);
  
  // 2. Goods/service split
  applyGoodsServiceSplit(data.purchaseOrders, data.grns, config);
  
  // 3. Invoice amount consistency
  applyInvoiceAmountConstraints(data.invoices);
  
  // 4. Payment due date consistency
  applyPaymentDueDateConstraints(data.invoices, data.payments, config);
}

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  violations: {
    vendorDistribution?: number;
    goodsServiceGRN?: number;
    invoiceAmount?: number;
    paymentDueDate?: number;
    poGrnLinkage?: number;
    poInvoiceLinkage?: number;
    invoicePaymentLinkage?: number;
    dateSequencing?: number;
    totalViolations: number;
  };
  messages: string[];
}

/**
 * Validates dataset for constraint violations
 */
export function validateDataset(data: Dataset, config?: ConstraintConfig): ValidationResult {
  const violations = {
    vendorDistribution: 0,
    goodsServiceGRN: 0,
    invoiceAmount: 0,
    paymentDueDate: 0,
    poGrnLinkage: 0,
    poInvoiceLinkage: 0,
    invoicePaymentLinkage: 0,
    dateSequencing: 0,
    totalViolations: 0,
  };
  const messages: string[] = [];

  // 1. Vendor Distribution Check
  if (config) {
    const topVendorRatio = config.topVendorRatio ?? 0.4;
    const topVendorCount = config.topVendorCount ?? Math.max(1, Math.floor(data.vendors.length * 0.2));
    
    const sortedVendors = [...data.vendors].sort((a, b) => {
      const aDate = a.created_date?.getTime() || 0;
      const bDate = b.created_date?.getTime() || 0;
      return aDate - bDate;
    });
    const topVendors = sortedVendors.slice(0, topVendorCount);
    const topVendorIds = new Set(topVendors.map(v => v.vendor_id));
    
    const topVendorPOs = data.purchaseOrders.filter(po => topVendorIds.has(po.vendor_id)).length;
    const expectedTopVendorPOs = Math.floor(data.purchaseOrders.length * topVendorRatio);
    const variance = Math.abs(topVendorPOs - expectedTopVendorPOs);
    
    if (variance > data.purchaseOrders.length * 0.1) { // Allow 10% variance
      violations.vendorDistribution = variance;
      messages.push(`Vendor distribution: ${topVendorPOs} POs to top vendors, expected ~${expectedTopVendorPOs}`);
    }
  }

  // 2. Goods/Service GRN Check
  const goodsServiceSplit = config?.goodsServiceSplit ?? 0.7;
  const expectedGoodsPOs = Math.floor(data.purchaseOrders.length * goodsServiceSplit);
  const posWithGRN = new Set(data.grns.map(grn => grn.po_no));
  const goodsPOsWithGRN = data.purchaseOrders.filter(po => posWithGRN.has(po.po_no)).length;
  
  // Service POs should not have GRNs
  const servicePOsWithGRN = data.purchaseOrders.length - expectedGoodsPOs - (data.purchaseOrders.length - goodsPOsWithGRN);
  if (servicePOsWithGRN > 0) {
    violations.goodsServiceGRN = servicePOsWithGRN;
    messages.push(`Goods/Service split: ${servicePOsWithGRN} service POs have GRNs (should be 0)`);
  }

  // 3. Invoice Amount Consistency
  for (const invoice of data.invoices) {
    const calculatedTotal = invoice.invoice_amount + invoice.tax_amount;
    const variance = Math.abs(invoice.total_amount - calculatedTotal);
    if (variance > 0.01) { // Allow 0.01 rounding error
      violations.invoiceAmount++;
      if (violations.invoiceAmount === 1) {
        messages.push(`Invoice amount inconsistency: ${invoice.invoice_no} total=${invoice.total_amount}, calculated=${calculatedTotal}`);
      }
    }
  }
  if (violations.invoiceAmount > 0) {
    messages.push(`Invoice amount violations: ${violations.invoiceAmount} invoices`);
  }

  // 4. Payment Due Date Consistency
  const creditDays = config?.creditDays ?? 30;
  const invoiceMap = new Map(data.invoices.map(inv => [inv.invoice_no, inv]));
  for (const invoice of data.invoices) {
    if (invoice.due_date && invoice.invoice_date) {
      const expectedDueDate = addDays(invoice.invoice_date, creditDays);
      const daysDiff = Math.abs((invoice.due_date.getTime() - expectedDueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 1) { // Allow 1 day variance
        violations.paymentDueDate++;
        if (violations.paymentDueDate === 1) {
          messages.push(`Due date inconsistency: ${invoice.invoice_no} due_date differs from invoice_date + ${creditDays} days`);
        }
      }
    }
  }
  if (violations.paymentDueDate > 0) {
    messages.push(`Due date violations: ${violations.paymentDueDate} invoices`);
  }

  // 5. PO-GRN Linkage
  const validPOs = new Set(data.purchaseOrders.map(po => po.po_no));
  for (const grn of data.grns) {
    if (!validPOs.has(grn.po_no)) {
      violations.poGrnLinkage++;
      if (violations.poGrnLinkage === 1) {
        messages.push(`PO-GRN linkage: GRN ${grn.grn_no} references invalid PO ${grn.po_no}`);
      }
    }
  }
  if (violations.poGrnLinkage > 0) {
    messages.push(`PO-GRN linkage violations: ${violations.poGrnLinkage} GRNs`);
  }

  // 6. PO-Invoice Linkage
  for (const invoice of data.invoices) {
    if (invoice.po_no && !validPOs.has(invoice.po_no)) {
      violations.poInvoiceLinkage++;
      if (violations.poInvoiceLinkage === 1) {
        messages.push(`PO-Invoice linkage: Invoice ${invoice.invoice_no} references invalid PO ${invoice.po_no}`);
      }
    }
  }
  if (violations.poInvoiceLinkage > 0) {
    messages.push(`PO-Invoice linkage violations: ${violations.poInvoiceLinkage} invoices`);
  }

  // 7. Invoice-Payment Linkage
  const validInvoices = new Set(data.invoices.map(inv => inv.invoice_no));
  for (const payment of data.payments) {
    if (!validInvoices.has(payment.invoice_no)) {
      violations.invoicePaymentLinkage++;
      if (violations.invoicePaymentLinkage === 1) {
        messages.push(`Invoice-Payment linkage: Payment ${payment.payment_id} references invalid invoice ${payment.invoice_no}`);
      }
    }
  }
  if (violations.invoicePaymentLinkage > 0) {
    messages.push(`Invoice-Payment linkage violations: ${violations.invoicePaymentLinkage} payments`);
  }

  // 8. Date Sequencing: PO <= GRN <= Invoice <= Payment
  const poMap = new Map(data.purchaseOrders.map(po => [po.po_no, po]));
  const grnMap = new Map(data.grns.map(grn => [grn.grn_no, grn]));
  
  for (const grn of data.grns) {
    const po = poMap.get(grn.po_no);
    if (po && grn.grn_date < po.po_date) {
      violations.dateSequencing++;
      if (violations.dateSequencing === 1) {
        messages.push(`Date sequencing: GRN ${grn.grn_no} date (${grn.grn_date}) is before PO ${grn.po_no} date (${po.po_date})`);
      }
    }
  }
  
  for (const invoice of data.invoices) {
    if (invoice.po_no) {
      const po = poMap.get(invoice.po_no);
      if (po && invoice.invoice_date < po.po_date) {
        violations.dateSequencing++;
        if (violations.dateSequencing === 1) {
          messages.push(`Date sequencing: Invoice ${invoice.invoice_no} date is before PO ${invoice.po_no} date`);
        }
      }
    }
    if (invoice.grn_no) {
      const grn = grnMap.get(invoice.grn_no);
      if (grn && invoice.invoice_date < grn.grn_date) {
        violations.dateSequencing++;
        if (violations.dateSequencing === 1) {
          messages.push(`Date sequencing: Invoice ${invoice.invoice_no} date is before GRN ${invoice.grn_no} date`);
        }
      }
    }
  }
  
  for (const payment of data.payments) {
    const invoice = invoiceMap.get(payment.invoice_no);
    if (invoice && payment.payment_date < invoice.invoice_date) {
      violations.dateSequencing++;
      if (violations.dateSequencing === 1) {
        messages.push(`Date sequencing: Payment ${payment.payment_id} date is before invoice ${payment.invoice_no} date`);
      }
    }
  }
  
  if (violations.dateSequencing > 0) {
    messages.push(`Date sequencing violations: ${violations.dateSequencing} records`);
  }

  // Calculate total
  violations.totalViolations = 
    violations.vendorDistribution +
    violations.goodsServiceGRN +
    violations.invoiceAmount +
    violations.paymentDueDate +
    violations.poGrnLinkage +
    violations.poInvoiceLinkage +
    violations.invoicePaymentLinkage +
    violations.dateSequencing;

  return {
    isValid: violations.totalViolations === 0,
    violations,
    messages,
  };
}

/**
 * Prints validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  console.log('\n=== Dataset Validation Results ===');
  console.log(`Valid: ${result.isValid ? 'YES' : 'NO'}`);
  console.log(`Total Violations: ${result.violations.totalViolations}`);
  console.log('\nViolation Breakdown:');
  console.log(`  Vendor Distribution: ${result.violations.vendorDistribution}`);
  console.log(`  Goods/Service GRN: ${result.violations.goodsServiceGRN}`);
  console.log(`  Invoice Amount: ${result.violations.invoiceAmount}`);
  console.log(`  Payment Due Date: ${result.violations.paymentDueDate}`);
  console.log(`  PO-GRN Linkage: ${result.violations.poGrnLinkage}`);
  console.log(`  PO-Invoice Linkage: ${result.violations.poInvoiceLinkage}`);
  console.log(`  Invoice-Payment Linkage: ${result.violations.invoicePaymentLinkage}`);
  console.log(`  Date Sequencing: ${result.violations.dateSequencing}`);
  
  if (result.messages.length > 0) {
    console.log('\nDetails:');
    result.messages.slice(0, 10).forEach(msg => console.log(`  - ${msg}`));
    if (result.messages.length > 10) {
      console.log(`  ... and ${result.messages.length - 10} more messages`);
    }
  }
  console.log('===================================\n');
}


