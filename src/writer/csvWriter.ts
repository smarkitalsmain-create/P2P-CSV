import * as fs from "fs";
import * as path from "path";
import type {
  Vendor,
  PurchaseOrder,
  GRN,
  Invoice,
  Payment,
  PRHeader,
  PRLine,
} from "../schemas";

// ============================================================================
// CSV Writer
// ============================================================================

export interface CSVWriterOptions {
  outputDir: string;
  flushPerChunk?: boolean;
}

type CSVValue = string | number | Date | undefined | null;

export class CSVWriter {
  private outputDir: string;
  private flushPerChunk: boolean;
  private fileHandles: Map<string, fs.WriteStream>;
  private headersWritten: Map<string, boolean>;

  constructor(options: CSVWriterOptions) {
    this.outputDir = options.outputDir;
    this.flushPerChunk = options.flushPerChunk ?? true;
    this.fileHandles = new Map();
    this.headersWritten = new Map();

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private getFileHandle(filename: string): fs.WriteStream {
    const existing = this.fileHandles.get(filename);
    if (existing) return existing;

    const filePath = path.join(this.outputDir, filename);
    const stream = fs.createWriteStream(filePath, { flags: "w", encoding: "utf8" });
    this.fileHandles.set(filename, stream);
    return stream;
  }

  private toCsvCell(val: CSVValue): string {
    if (val === undefined || val === null) return "";
    if (val instanceof Date) return val.toISOString().split("T")[0];

    const str = String(val);

    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private writeRow(stream: fs.WriteStream, values: CSVValue[]): void {
    const csvRow = values.map(v => this.toCsvCell(v)).join(",");
    stream.write(csvRow + "\n");
  }

  private writeHeadersIfNeeded(filename: string, headers: string[]): void {
    if (this.headersWritten.get(filename)) return;
    const stream = this.getFileHandle(filename);
    this.writeRow(stream, headers);
    this.headersWritten.set(filename, true);
  }

  private flushStream(stream: fs.WriteStream): void {
    if (!this.flushPerChunk) return;
    // Trigger flush (noop write)
    stream.write("", () => {});
  }

  // --------------------------------------------------------------------------
  // Vendors
  // --------------------------------------------------------------------------

  writeVendors(vendors: Vendor[]): void {
    const filename = "vendors.csv";
    const headers = [
      "vendor_id",
      "vendor_name",
      "pan",
      "gstin",
      "bank_account",
      "ifsc",
      "bank_name",
      "account_holder_name",
      "address",
      "contact_email",
      "contact_phone",
      "status",
      "bank_change_verification",
      "created_date",
      "updated_date",
      "verified_by",
      "verification_date",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const vendor of vendors) {
      this.writeRow(stream, [
        vendor.vendor_id,
        vendor.vendor_name,
        vendor.pan,
        vendor.gstin,
        vendor.bank_account,
        vendor.ifsc,
        vendor.bank_name,
        vendor.account_holder_name,
        vendor.address,
        vendor.contact_email,
        vendor.contact_phone,
        vendor.status,
        vendor.bank_change_verification,
        vendor.created_date,
        vendor.updated_date,
        vendor.verified_by,
        vendor.verification_date,
      ]);
    }

    this.flushStream(stream);
  }

  // --------------------------------------------------------------------------
  // PR
  // --------------------------------------------------------------------------

  writePRHeaders(prHeaders: PRHeader[]): void {
    const filename = "pr_headers.csv";
    const headers = [
      "pr_no",
      "requested_by",
      "request_date",
      "department",
      "total_amount",
      "currency",
      "status",
      "approval_status",
      "approved_by",
      "approval_date",
      "remarks",
      "po_no",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const pr of prHeaders) {
      this.writeRow(stream, [
        pr.pr_no,
        pr.requested_by,
        pr.request_date,
        pr.department,
        pr.total_amount,
        pr.currency,
        pr.status,
        pr.approval_status,
        pr.approved_by,
        pr.approval_date,
        pr.remarks,
        pr.po_no,
      ]);
    }

    this.flushStream(stream);
  }

  writePRLines(prLines: PRLine[]): void {
    const filename = "pr_lines.csv";
    const headers = [
      "pr_line_id",
      "pr_no",
      "item_description",
      "quantity",
      "unit_price",
      "line_amount",
      "item_type",
      "expected_delivery_date",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const line of prLines) {
      this.writeRow(stream, [
        line.pr_line_id,
        line.pr_no,
        line.item_description,
        line.quantity,
        line.unit_price,
        line.line_amount,
        line.item_type,
        line.expected_delivery_date,
      ]);
    }

    this.flushStream(stream);
  }

  // --------------------------------------------------------------------------
  // PO
  // --------------------------------------------------------------------------

  writePurchaseOrders(purchaseOrders: PurchaseOrder[]): void {
    const filename = "purchase_orders.csv";
    const headers = [
      "po_no",
      "vendor_id",
      "pr_no",
      "contract_id",
      "po_date",
      "expected_delivery_date",
      "order_amount",
      "tax_amount",
      "total_amount",
      "currency",
      "status",
      "approval_status",
      "approved_by",
      "approval_date",
      "rejected_reason",
      "created_by",
      "created_date",
      "updated_date",
      "remarks",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const po of purchaseOrders) {
      this.writeRow(stream, [
        po.po_no,
        po.vendor_id,
        po.pr_no,
        po.contract_id,
        po.po_date,
        po.expected_delivery_date,
        po.order_amount,
        po.tax_amount,
        po.total_amount,
        po.currency,
        po.status,
        po.approval_status,
        po.approved_by,
        po.approval_date,
        po.rejected_reason,
        po.created_by,
        po.created_date,
        po.updated_date,
        po.remarks,
      ]);
    }

    this.flushStream(stream);
  }

  // Backward-compatible alias: runGeneration.ts calls writePOs(...)
  writePOs(purchaseOrders: PurchaseOrder[]): void {
    this.writePurchaseOrders(purchaseOrders);
  }

  // --------------------------------------------------------------------------
  // GRN
  // --------------------------------------------------------------------------

  writeGRNs(grns: GRN[]): void {
    const filename = "grns.csv";
    const headers = [
      "grn_no",
      "po_no",
      "vendor_id",
      "grn_date",
      "quantity_ordered",
      "quantity_received",
      "received_amount",
      "tax_amount",
      "total_amount",
      "status",
      "received_by",
      "remarks",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const grn of grns) {
      this.writeRow(stream, [
        grn.grn_no,
        grn.po_no,
        grn.vendor_id,
        grn.grn_date,
        grn.quantity_ordered,
        grn.quantity_received,
        grn.received_amount,
        grn.tax_amount,
        grn.total_amount,
        grn.status,
        grn.received_by,
        grn.remarks,
      ]);
    }

    this.flushStream(stream);
  }

  // --------------------------------------------------------------------------
  // Invoice
  // --------------------------------------------------------------------------

  writeInvoices(invoices: Invoice[]): void {
    const filename = "invoices.csv";
    const headers = [
      "invoice_no",
      "vendor_id",
      "po_no",
      "grn_no",
      "invoice_date",
      "due_date",
      "invoice_amount",
      "tax_amount",
      "total_amount",
      "currency",
      "status",
      "approval_status",
      "approved_by",
      "approval_date",
      "rejected_reason",
      "created_by",
      "created_date",
      "updated_date",
      "remarks",
      "tax_rate",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const invoice of invoices) {
      this.writeRow(stream, [
        invoice.invoice_no,
        invoice.vendor_id,
        invoice.po_no,
        invoice.grn_no,
        invoice.invoice_date,
        invoice.due_date,
        invoice.invoice_amount,
        invoice.tax_amount,
        invoice.total_amount,
        invoice.currency,
        invoice.status,
        invoice.approval_status,
        invoice.approved_by,
        invoice.approval_date,
        invoice.rejected_reason,
        invoice.created_by,
        invoice.created_date,
        invoice.updated_date,
        invoice.remarks,
        invoice.tax_rate,
      ]);
    }

    this.flushStream(stream);
  }

  // --------------------------------------------------------------------------
  // Payment
  // --------------------------------------------------------------------------

  writePayments(payments: Payment[]): void {
    const filename = "payments.csv";
    const headers = [
      "payment_id",
      "invoice_no",
      "vendor_id",
      "payment_date",
      "payment_amount",
      "currency",
      "payment_method",
      "status",
      "approval_status",
      "approved_by",
      "approval_date",
      "processed_by",
      "processed_date",
      "created_date",
      "remarks",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const payment of payments) {
      this.writeRow(stream, [
        payment.payment_id,
        payment.invoice_no,
        payment.vendor_id,
        payment.payment_date,
        payment.payment_amount,
        payment.currency,
        payment.payment_method,
        payment.status,
        payment.approval_status,
        payment.approved_by,
        payment.approval_date,
        payment.processed_by,
        payment.processed_date,
        payment.created_date,
        payment.remarks,
      ]);
    }

    this.flushStream(stream);
  }

  // --------------------------------------------------------------------------
  // Truth
  // --------------------------------------------------------------------------

  writeTruthRecords(truthRecords: any[]): void {
    const filename = "truth.csv";
    const headers = [
      "test_step_id",
      "test_step_name",
      "process_area",
      "entity_type",
      "entity_id",
      "secondary_ids",
      "planted_fields",
      "planted_values_summary",
      "expected_flag",
      "notes",
    ];

    this.writeHeadersIfNeeded(filename, headers);
    const stream = this.getFileHandle(filename);

    for (const record of truthRecords) {
      this.writeRow(stream, [
        record.test_step_id,
        record.test_step_name,
        record.process_area,
        record.entity_type,
        record.entity_id,
        record.secondary_ids,
        record.planted_fields,
        record.planted_values_summary,
        record.expected_flag,
        record.notes,
      ]);
    }

    this.flushStream(stream);
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  close(): void {
    for (const stream of this.fileHandles.values()) {
      stream.end();
    }
    this.fileHandles.clear();
    this.headersWritten.clear();
  }

  flush(): void {
    for (const stream of this.fileHandles.values()) {
      stream.write("", () => {});
    }
  }
}
