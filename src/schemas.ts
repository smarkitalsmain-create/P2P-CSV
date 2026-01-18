import { z } from 'zod';

// ============================================================================
// ID Generation Helper Functions
// ============================================================================

/**
 * Generates a vendor ID with format VND000001
 */
export function generateVendorId(sequence: number): string {
  return `VND${String(sequence).padStart(6, '0')}`;
}

/**
 * Generates a PO number with format PO2026-00001
 */
export function generatePONumber(year: number, sequence: number): string {
  return `PO${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generates a GRN number with format GRN2026-00001
 */
export function generateGRNNumber(year: number, sequence: number): string {
  return `GRN${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generates an invoice number with format INV2026-00001
 */
export function generateInvoiceNumber(year: number, sequence: number): string {
  return `INV${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generates a payment ID with format PAY2026-00001
 */
export function generatePaymentId(year: number, sequence: number): string {
  return `PAY${year}-${String(sequence).padStart(5, '0')}`;
}

// ============================================================================
// Vendor Schema
// ============================================================================

export const vendorSchema = z.object({
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be in format VND000001'),
  vendor_name: z.string().min(1, 'Vendor name is required'),
  pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'PAN must be in format ABCDE1234F').optional(),
  gstin: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'GSTIN must be in valid format').optional(),
  bank_account: z.string().min(1, 'Bank account is required'),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC must be in format ABCD0123456').optional(),
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email('Invalid email format').optional(),
  contact_phone: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  bank_change_verification: z.boolean().default(false),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  verified_by: z.string().optional(),
  verification_date: z.coerce.date().optional(),
});

export type Vendor = z.infer<typeof vendorSchema>;

// ============================================================================
// Purchase Order (PO) Schema
// ============================================================================

export const purchaseOrderSchema = z.object({
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be in format PO2026-00001'),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  contract_id: z.string().regex(/^CNT\d{4}-\d{5}$/, 'Must be a valid contract ID').optional(),
  po_date: z.coerce.date(),
  expected_delivery_date: z.coerce.date().optional(),
  order_amount: z.number().nonnegative('Order amount must be non-negative'),
  tax_amount: z.number().nonnegative('Tax amount must be non-negative').default(0),
  total_amount: z.number().nonnegative('Total amount must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'cancelled', 'completed']).default('draft'),
  approval_status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  approved_by: z.string().optional(),
  approval_date: z.coerce.date().optional(),
  rejected_reason: z.string().optional(),
  created_by: z.string().optional(),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

// ============================================================================
// Goods Receipt Note (GRN) Schema
// ============================================================================

export const grnSchema = z.object({
  grn_no: z.string().regex(/^GRN\d{4}-\d{5}$/, 'Must be in format GRN2026-00001'),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number'),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  grn_date: z.coerce.date(),
  received_date: z.coerce.date().optional(),
  received_amount: z.number().nonnegative('Received amount must be non-negative'),
  tax_amount: z.number().nonnegative('Tax amount must be non-negative').default(0),
  total_amount: z.number().nonnegative('Total amount must be non-negative'),
  quantity_received: z.number().nonnegative().optional(),
  quantity_ordered: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'partial', 'completed', 'rejected', 'cancelled']).default('pending'),
  quality_check_status: z.enum(['pending', 'passed', 'failed']).optional(),
  received_by: z.string().optional(),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export type GRN = z.infer<typeof grnSchema>;

// ============================================================================
// Invoice Schema
// ============================================================================

export const invoiceSchema = z.object({
  invoice_no: z.string().regex(/^INV\d{4}-\d{5}$/, 'Must be in format INV2026-00001'),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number').optional(),
  grn_no: z.string().regex(/^GRN\d{4}-\d{5}$/, 'Must be a valid GRN number').optional(),
  invoice_date: z.coerce.date(),
  due_date: z.coerce.date().optional(),
  invoice_amount: z.number().nonnegative('Invoice amount must be non-negative'),
  tax_amount: z.number().nonnegative('Tax amount must be non-negative').default(0),
  total_amount: z.number().nonnegative('Total amount must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'paid', 'cancelled']).default('draft'),
  approval_status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  approved_by: z.string().optional(),
  approval_date: z.coerce.date().optional(),
  rejected_reason: z.string().optional(),
  created_by: z.string().optional(),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

// ============================================================================
// Payment Schema
// ============================================================================

export const paymentSchema = z.object({
  payment_id: z.string().regex(/^PAY\d{4}-\d{5}$/, 'Must be in format PAY2026-00001'),
  invoice_no: z.string().regex(/^INV\d{4}-\d{5}$/, 'Must be a valid invoice number'),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  payment_date: z.coerce.date(),
  payment_amount: z.number().nonnegative('Payment amount must be non-negative'),
  payment_mode: z.enum(['cheque', 'neft', 'rtgs', 'upi', 'card', 'cash', 'other']).default('neft'),
  bank_account: z.string().min(1, 'Bank account is required'),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC must be in format ABCD0123456').optional(),
  cheque_number: z.string().optional(),
  transaction_reference: z.string().optional(),
  status: z.enum(['pending', 'initiated', 'completed', 'failed', 'cancelled']).default('pending'),
  approval_status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  approved_by: z.string().optional(),
  approval_date: z.coerce.date().optional(),
  processed_by: z.string().optional(),
  processed_date: z.coerce.date().optional(),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

// ============================================================================
// Truth Table / Master Data Schema
// ============================================================================

export const truthSchema = z.object({
  id: z.string().optional(),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID').optional(),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number').optional(),
  grn_no: z.string().regex(/^GRN\d{4}-\d{5}$/, 'Must be a valid GRN number').optional(),
  invoice_no: z.string().regex(/^INV\d{4}-\d{5}$/, 'Must be a valid invoice number').optional(),
  payment_id: z.string().regex(/^PAY\d{4}-\d{5}$/, 'Must be a valid payment ID').optional(),
  record_type: z.enum(['vendor', 'po', 'grn', 'invoice', 'payment', 'link']),
  field_name: z.string().min(1, 'Field name is required'),
  field_value: z.string().optional(),
  field_value_numeric: z.number().optional(),
  field_value_date: z.coerce.date().optional(),
  field_value_boolean: z.boolean().optional(),
  is_active: z.boolean().default(true),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  source_system: z.string().optional(),
  validation_status: z.enum(['valid', 'invalid', 'pending']).optional(),
  remarks: z.string().optional(),
});

export type Truth = z.infer<typeof truthSchema>;

// ============================================================================
// Purchase Requisition (PR) Schemas
// ============================================================================

export const prHeaderSchema = z.object({
  pr_no: z.string().regex(/^PR\d{4}-\d{5}$/, 'Must be in format PR2026-00001'),
  pr_date: z.coerce.date(),
  requested_by: z.string().min(1, 'Requested by is required'),
  department: z.string().optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'converted', 'cancelled']).default('draft'),
  approval_status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  approved_by: z.string().optional(),
  approval_date: z.coerce.date().optional(),
  total_amount: z.number().nonnegative('Total amount must be non-negative').optional(),
  created_by: z.string().optional(),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export type PRHeader = z.infer<typeof prHeaderSchema>;

export const prLineSchema = z.object({
  pr_line_id: z.string().regex(/^PRL\d{4}-\d{5}-\d{3}$/, 'Must be in format PRL2026-00001-001'),
  pr_no: z.string().regex(/^PR\d{4}-\d{5}$/, 'Must be a valid PR number'),
  line_number: z.number().int().positive(),
  item_description: z.string().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
  line_amount: z.number().nonnegative('Line amount must be non-negative'),
  category: z.enum(['goods', 'services', 'capex', 'other']).default('goods'),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number').optional(),
  status: z.enum(['open', 'converted', 'cancelled']).default('open'),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
});

export type PRLine = z.infer<typeof prLineSchema>;

// ============================================================================
// Quotation Schema
// ============================================================================

export const quotationSchema = z.object({
  quotation_id: z.string().regex(/^QUO\d{4}-\d{5}$/, 'Must be in format QUO2026-00001'),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number').optional(),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  quotation_date: z.coerce.date(),
  quote_amount: z.number().nonnegative('Quote amount must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
  validity_days: z.number().int().positive().optional(),
  status: z.enum(['received', 'accepted', 'rejected', 'expired']).default('received'),
  is_selected: z.boolean().default(false),
  created_by: z.string().optional(),
  created_ip: z.string().optional(), // IP address for TS-034
  created_timestamp: z.coerce.date().optional(), // Timestamp for TS-034
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export type Quotation = z.infer<typeof quotationSchema>;

// ============================================================================
// Contract Master Schema
// ============================================================================

export const contractMasterSchema = z.object({
  contract_id: z.string().regex(/^CNT\d{4}-\d{5}$/, 'Must be in format CNT2026-00001'),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  contract_number: z.string().min(1, 'Contract number is required'),
  contract_date: z.coerce.date(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  contract_amount: z.number().nonnegative('Contract amount must be non-negative').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'cancelled']).default('active'),
  contract_type: z.enum(['rate_contract', 'framework', 'one_time', 'other']).default('rate_contract'),
  created_by: z.string().optional(),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  approved_by: z.string().optional(),
  approval_date: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export type ContractMaster = z.infer<typeof contractMasterSchema>;

// ============================================================================
// Role Master Schema
// ============================================================================

export const roleMasterSchema = z.object({
  role_assignment_id: z.string().regex(/^ROL\d{4}-\d{6}$/, 'Must be in format ROL2026-000001'),
  user_id: z.string().min(1, 'User ID is required'),
  role_name: z.string().min(1, 'Role name is required'),
  department: z.string().optional(),
  effective_from: z.coerce.date(),
  effective_to: z.coerce.date().optional(), // NULL means current
  is_active: z.boolean().default(true),
  created_date: z.coerce.date().optional(),
  updated_date: z.coerce.date().optional(),
  created_by: z.string().optional(),
});

export type RoleMaster = z.infer<typeof roleMasterSchema>;

// ============================================================================
// Workflow Log Schemas
// ============================================================================

export const prWorkflowLogSchema = z.object({
  log_id: z.string().regex(/^PRW\d{4}-\d{8}$/, 'Must be in format PRW2026-00000001'),
  pr_no: z.string().regex(/^PR\d{4}-\d{5}$/, 'Must be a valid PR number'),
  action: z.enum(['created', 'submitted', 'approved', 'rejected', 'cancelled', 'converted']),
  performed_by: z.string().optional(),
  performed_date: z.coerce.date(),
  comments: z.string().optional(),
  from_status: z.string().optional(),
  to_status: z.string().optional(),
});

export type PRWorkflowLog = z.infer<typeof prWorkflowLogSchema>;

export const poWorkflowLogSchema = z.object({
  log_id: z.string().regex(/^POW\d{4}-\d{8}$/, 'Must be in format POW2026-00000001'),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number'),
  action: z.enum(['created', 'submitted', 'approved', 'rejected', 'cancelled', 'amended', 'completed']),
  performed_by: z.string().optional(),
  performed_date: z.coerce.date(),
  comments: z.string().optional(),
  from_status: z.string().optional(),
  to_status: z.string().optional(),
});

export type POWorkflowLog = z.infer<typeof poWorkflowLogSchema>;

export const paymentWorkflowLogSchema = z.object({
  log_id: z.string().regex(/^PAYW\d{4}-\d{8}$/, 'Must be in format PAYW2026-00000001'),
  payment_id: z.string().regex(/^PAY\d{4}-\d{5}$/, 'Must be a valid payment ID'),
  action: z.enum(['created', 'initiated', 'approved', 'rejected', 'processed', 'completed', 'failed', 'cancelled']),
  performed_by: z.string().optional(),
  performed_date: z.coerce.date(),
  comments: z.string().optional(),
  from_status: z.string().optional(),
  to_status: z.string().optional(),
});

export type PaymentWorkflowLog = z.infer<typeof paymentWorkflowLogSchema>;

// ============================================================================
// Change Log Schemas
// ============================================================================

export const vendorBankChangeLogSchema = z.object({
  change_log_id: z.string().regex(/^VBC\d{4}-\d{8}$/, 'Must be in format VBC2026-00000001'),
  vendor_id: z.string().regex(/^VND\d{6}$/, 'Must be a valid vendor ID'),
  change_date: z.coerce.date(),
  changed_by: z.string().optional(),
  old_bank_account: z.string().optional(),
  new_bank_account: z.string(),
  old_ifsc: z.string().optional(),
  new_ifsc: z.string().optional(),
  verification_status: z.enum(['pending', 'verified', 'rejected']).default('pending'),
  verified_by: z.string().optional(),
  verification_date: z.coerce.date().optional(),
  reason: z.string().optional(),
});

export type VendorBankChangeLog = z.infer<typeof vendorBankChangeLogSchema>;

export const poChangeLogSchema = z.object({
  change_log_id: z.string().regex(/^POC\d{4}-\d{8}$/, 'Must be in format POC2026-00000001'),
  po_no: z.string().regex(/^PO\d{4}-\d{5}$/, 'Must be a valid PO number'),
  change_date: z.coerce.date(),
  changed_by: z.string().optional(),
  change_type: z.enum(['amount', 'quantity', 'delivery_date', 'vendor', 'status', 'other']),
  field_name: z.string().min(1, 'Field name is required'),
  old_value: z.string().optional(),
  new_value: z.string().optional(),
  reason: z.string().optional(),
  approval_required: z.boolean().default(false),
  approved_by: z.string().optional(),
  approval_date: z.coerce.date().optional(),
});

export type POChangeLog = z.infer<typeof poChangeLogSchema>;

// ============================================================================
// ID Generation Helper Functions (Extended)
// ============================================================================

/**
 * Generates a PR number with format PR2026-00001
 */
export function generatePRNumber(year: number, sequence: number): string {
  return `PR${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generates a PR line ID with format PRL2026-00001-001
 */
export function generatePRLineId(year: number, prSequence: number, lineNumber: number): string {
  return `PRL${year}-${String(prSequence).padStart(5, '0')}-${String(lineNumber).padStart(3, '0')}`;
}

/**
 * Generates a quotation ID with format QUO2026-00001
 */
export function generateQuotationId(year: number, sequence: number): string {
  return `QUO${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generates a contract ID with format CNT2026-00001
 */
export function generateContractId(year: number, sequence: number): string {
  return `CNT${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generates a role assignment ID with format ROL2026-000001
 */
export function generateRoleAssignmentId(year: number, sequence: number): string {
  return `ROL${year}-${String(sequence).padStart(6, '0')}`;
}

/**
 * Generates a workflow log ID with format PRW2026-00000001
 */
export function generateWorkflowLogId(prefix: string, year: number, sequence: number): string {
  return `${prefix}${year}-${String(sequence).padStart(8, '0')}`;
}

/**
 * Generates a change log ID with format VBC2026-00000001
 */
export function generateChangeLogId(prefix: string, year: number, sequence: number): string {
  return `${prefix}${year}-${String(sequence).padStart(8, '0')}`;
}

// ============================================================================
// Export all schemas as a single object for convenience
// ============================================================================

export const p2pSchemas = {
  vendor: vendorSchema,
  purchaseOrder: purchaseOrderSchema,
  grn: grnSchema,
  invoice: invoiceSchema,
  payment: paymentSchema,
  truth: truthSchema,
  prHeader: prHeaderSchema,
  prLine: prLineSchema,
  quotation: quotationSchema,
  contractMaster: contractMasterSchema,
  roleMaster: roleMasterSchema,
  prWorkflowLog: prWorkflowLogSchema,
  poWorkflowLog: poWorkflowLogSchema,
  paymentWorkflowLog: paymentWorkflowLogSchema,
  vendorBankChangeLog: vendorBankChangeLogSchema,
  poChangeLog: poChangeLogSchema,
};

// ============================================================================
// Helper function to validate and parse dates in various formats
// ============================================================================

export function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${value}`);
    }
    return parsed;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  throw new Error(`Cannot parse date from: ${value}`);
}

