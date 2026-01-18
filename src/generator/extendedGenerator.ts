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
  generatePRNumber,
  generatePRLineId,
  generateQuotationId,
  generateContractId,
  generateRoleAssignmentId,
  generateWorkflowLogId,
  generateChangeLogId,
} from '../schemas';

// ============================================================================
// Helper Functions
// ============================================================================

function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

function subtractDays(date: Date, days: number): Date {
  return dayjs(date).subtract(days, 'day').toDate();
}

/**
 * Generates a random IP address
 */
function generateIPAddress(rng: () => number): string {
  return `${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}`;
}

// ============================================================================
// PR Header and Line Generators
// ============================================================================

export function generatePRHeadersAndLines(
  prCount: number,
  purchaseOrders: PurchaseOrder[],
  rng: () => number,
  startYear: number,
  endYear: number
): { prHeaders: PRHeader[]; prLines: PRLine[] } {
  const prHeaders: PRHeader[] = [];
  const prLines: PRLine[] = [];
  
  // Create map of POs by year for linking
  const poByYear = new Map<number, PurchaseOrder[]>();
  for (const po of purchaseOrders) {
    const year = po.po_date.getFullYear();
    if (!poByYear.has(year)) {
      poByYear.set(year, []);
    }
    poByYear.get(year)!.push(po);
  }

  let prSequence = 1;

  for (let year = startYear; year <= endYear && prHeaders.length < prCount; year++) {
    const yearEnd = year === endYear ? prCount - prHeaders.length : Infinity;
    const yearPOs = poByYear.get(year) || [];

    for (let i = 0; i < yearEnd; i++) {
      const prNo = generatePRNumber(year, prSequence++);
      const prDate = dayjs(new Date(year, Math.floor(rng() * 12), Math.floor(rng() * 28) + 1)).toDate();
      
      // PR date should be before PO date if linked
      const linkedPO = yearPOs.length > 0 && rng() > 0.3 ? yearPOs[Math.floor(rng() * yearPOs.length)] : null;
      const actualPRDate = linkedPO && prDate > linkedPO.po_date 
        ? subtractDays(linkedPO.po_date, Math.floor(rng() * 30) + 1)
        : prDate;

      const statusOptions: PRHeader['status'][] = ['draft', 'pending_approval', 'approved', 'rejected', 'converted', 'cancelled'];
      const status = linkedPO ? 'converted' : statusOptions[Math.floor(rng() * statusOptions.length)];
      
      const approvalStatus: PRHeader['approval_status'] = 
        status === 'approved' || status === 'converted' ? 'approved' : 
        status === 'rejected' ? 'rejected' : 
        'pending';

      const requestedBy = faker.person.fullName();
      const totalAmount = linkedPO ? linkedPO.total_amount : (rng() * 990000 + 10000);

      prHeaders.push({
        pr_no: prNo,
        pr_date: actualPRDate,
        requested_by: requestedBy,
        department: faker.commerce.department(),
        status,
        approval_status: approvalStatus,
        approved_by: approvalStatus === 'approved' && rng() > 0.3 ? faker.person.fullName() : undefined,
        approval_date: approvalStatus === 'approved' && rng() > 0.3 ? addDays(actualPRDate, Math.floor(rng() * 7)) : undefined,
        total_amount: totalAmount,
        created_by: requestedBy,
        created_date: actualPRDate,
        updated_date: rng() > 0.4 ? addDays(actualPRDate, Math.floor(rng() * 30)) : undefined,
        remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
      });

      // Generate 1-3 lines per PR
      const lineCount = Math.floor(rng() * 3) + 1;
      let lineTotal = 0;

      for (let lineNum = 1; lineNum <= lineCount; lineNum++) {
        const lineAmount = linkedPO && lineNum === lineCount 
          ? totalAmount - lineTotal  // Last line gets remainder
          : (rng() * (totalAmount / lineCount) * 1.5);
        lineTotal += lineAmount;

        const categoryOptions: PRLine['category'][] = ['goods', 'services', 'capex', 'other'];
        const category = categoryOptions[Math.floor(rng() * categoryOptions.length)];

        prLines.push({
          pr_line_id: generatePRLineId(year, prHeaders.length, lineNum),
          pr_no: prNo,
          line_number: lineNum,
          item_description: faker.commerce.productName(),
          quantity: Math.floor(rng() * 100) + 1,
          unit_price: lineAmount / (Math.floor(rng() * 100) + 1),
          line_amount: lineAmount,
          category,
          po_no: linkedPO && lineNum === lineCount ? linkedPO.po_no : undefined, // Link last line to PO
          status: linkedPO && lineNum === lineCount ? 'converted' : 'open',
          created_date: actualPRDate,
          updated_date: linkedPO && lineNum === lineCount ? linkedPO.po_date : undefined,
        });
      }
    }
  }

  return { prHeaders, prLines };
}

// ============================================================================
// Quotation Generator
// ============================================================================

export function generateQuotations(
  purchaseOrders: PurchaseOrder[],
  rng: () => number
): Quotation[] {
  const quotations: Quotation[] = [];
  
  // Generate quotations for high-value POs (above threshold)
  const highValueThreshold = 50000;
  const highValuePOs = purchaseOrders.filter(po => po.total_amount >= highValueThreshold);
  
  const quotationByYear = new Map<number, number>();

  for (const po of highValuePOs) {
    const year = po.po_date.getFullYear();
    if (!quotationByYear.has(year)) {
      quotationByYear.set(year, 1);
    } else {
      quotationByYear.set(year, quotationByYear.get(year)! + 1);
    }

    // Generate 1-3 quotations per PO
    const quoteCount = Math.floor(rng() * 3) + 1;
    const vendors = [po.vendor_id, ...Array.from({ length: quoteCount - 1 }, () => po.vendor_id)]; // Same vendor or different

    for (let i = 0; i < quoteCount; i++) {
      const quotationId = generateQuotationId(year, quotationByYear.get(year)! + i);
      
      // Quotation date should be before PO date
      const quoteDate = subtractDays(po.po_date, Math.floor(rng() * 60) + 1);
      
      // Quote amount should be close to PO amount (±10%)
      const variance = (rng() * 0.2 - 0.1); // -10% to +10%
      const quoteAmount = po.total_amount * (1 + variance);

      const statusOptions: Quotation['status'][] = ['received', 'accepted', 'rejected', 'expired'];
      const status = i === 0 ? 'accepted' : statusOptions[Math.floor(rng() * statusOptions.length)];
      const isSelected = status === 'accepted';

      quotations.push({
        quotation_id: quotationId,
        po_no: po.po_no,
        vendor_id: vendors[i] || po.vendor_id,
        quotation_date: quoteDate,
        quote_amount: Math.round(quoteAmount * 100) / 100,
        currency: 'INR',
        validity_days: Math.floor(rng() * 60) + 30,
        status,
        is_selected: isSelected,
        created_by: faker.person.fullName(),
        created_ip: generateIPAddress(rng), // For TS-034
        created_timestamp: quoteDate, // For TS-034
        created_date: quoteDate,
        updated_date: rng() > 0.4 ? addDays(quoteDate, Math.floor(rng() * 10)) : undefined,
        remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
      });
    }
  }

  return quotations;
}

// ============================================================================
// Contract Master Generator
// ============================================================================

export function generateContracts(
  vendors: Vendor[],
  purchaseOrders: PurchaseOrder[],
  rng: () => number,
  startYear: number,
  endYear: number
): ContractMaster[] {
  const contracts: ContractMaster[] = [];
  
  // Generate contracts for a subset of vendors (20-30%)
  const vendorCount = Math.floor(vendors.length * (0.2 + rng() * 0.1));
  const selectedVendors = vendors
    .filter(v => v.status === 'active')
    .sort(() => rng() - 0.5)
    .slice(0, vendorCount);

  const contractByYear = new Map<number, number>();

  for (const vendor of selectedVendors) {
    const contractYear = startYear + Math.floor(rng() * (endYear - startYear + 1));
    if (!contractByYear.has(contractYear)) {
      contractByYear.set(contractYear, 1);
    } else {
      contractByYear.set(contractYear, contractByYear.get(contractYear)! + 1);
    }

    const contractId = generateContractId(contractYear, contractByYear.get(contractYear)!);
    const contractDate = dayjs(new Date(contractYear, Math.floor(rng() * 12), Math.floor(rng() * 28) + 1)).toDate();
    const startDate = contractDate;
    const endDate = addDays(startDate, Math.floor(rng() * 730) + 365); // 1-3 years

    const contractTypes: ContractMaster['contract_type'][] = ['rate_contract', 'framework', 'one_time', 'other'];
    const contractType = contractTypes[Math.floor(rng() * contractTypes.length)];

    const statusOptions: ContractMaster['status'][] = ['draft', 'active', 'expired', 'terminated', 'cancelled'];
    const status = dayjs(endDate).isBefore(dayjs()) ? 'expired' : 'active';

    contracts.push({
      contract_id: contractId,
      vendor_id: vendor.vendor_id,
      contract_number: `CONTRACT-${contractYear}-${String(contractByYear.get(contractYear)!).padStart(4, '0')}`,
      contract_date: contractDate,
      start_date: startDate,
      end_date: endDate,
      contract_amount: rng() > 0.3 ? (rng() * 5000000 + 100000) : undefined,
      currency: 'INR',
      status,
      contract_type: contractType,
      created_by: faker.person.fullName(),
      created_date: contractDate,
      updated_date: rng() > 0.4 ? addDays(contractDate, Math.floor(rng() * 100)) : undefined,
      approved_by: status === 'active' && rng() > 0.3 ? faker.person.fullName() : undefined,
      approval_date: status === 'active' && rng() > 0.3 ? addDays(contractDate, Math.floor(rng() * 7)) : undefined,
      remarks: rng() > 0.7 ? faker.lorem.sentence() : undefined,
    });
  }

  return contracts;
}

// ============================================================================
// Role Master Generator
// ============================================================================

export function generateRoleMaster(
  userCount: number,
  rng: () => number,
  startYear: number,
  endYear: number
): RoleMaster[] {
  const roleMaster: RoleMaster[] = [];
  const roles = ['procurement_manager', 'finance_manager', 'approver', 'requester', 'admin', 'viewer'];
  const departments = ['Procurement', 'Finance', 'Operations', 'IT', 'HR', 'Admin'];

  let roleSequence = 1;

  for (let userId = 1; userId <= userCount; userId++) {
    const user_id = `USER${String(userId).padStart(6, '0')}`;
    
    // Each user can have 1-3 role assignments over time
    const assignmentCount = Math.floor(rng() * 3) + 1;
    let currentDate = new Date(startYear, 0, 1);

    for (let i = 0; i < assignmentCount; i++) {
      const year = currentDate.getFullYear();
      const effectiveFrom = currentDate;
      const effectiveTo = i < assignmentCount - 1 
        ? addDays(effectiveFrom, Math.floor(rng() * 365) + 90) // 3-15 months
        : undefined; // Last assignment is current

      const roleAssignmentId = generateRoleAssignmentId(year, roleSequence++);

      roleMaster.push({
        role_assignment_id: roleAssignmentId,
        user_id,
        role_name: roles[Math.floor(rng() * roles.length)],
        department: departments[Math.floor(rng() * departments.length)],
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        is_active: effectiveTo === undefined,
        created_date: effectiveFrom,
        updated_date: rng() > 0.4 ? addDays(effectiveFrom, Math.floor(rng() * 30)) : undefined,
        created_by: faker.person.fullName(),
      });

      currentDate = effectiveTo || new Date(endYear, 11, 31);
    }
  }

  return roleMaster;
}

// ============================================================================
// Workflow Log Generators
// ============================================================================

export function generatePRWorkflowLogs(
  prHeaders: PRHeader[],
  rng: () => number
): PRWorkflowLog[] {
  const logs: PRWorkflowLog[] = [];
  let logSequence = 1;

  for (const pr of prHeaders) {
    const year = pr.pr_date.getFullYear();
    let currentDate = pr.pr_date;
    let currentStatus = 'draft';

    // Create log for creation
    logs.push({
      log_id: generateWorkflowLogId('PRW', year, logSequence++),
      pr_no: pr.pr_no,
      action: 'created',
      performed_by: pr.created_by,
      performed_date: currentDate,
      from_status: undefined,
      to_status: 'draft',
      comments: 'PR created',
    });

    // Create log for status transitions
    if (pr.status !== 'draft') {
      const actions: PRWorkflowLog['action'][] = ['submitted', 'approved', 'rejected', 'cancelled', 'converted'];
      const action = pr.status === 'converted' ? 'converted' :
                    pr.status === 'approved' ? 'approved' :
                    pr.status === 'rejected' ? 'rejected' :
                    pr.status === 'cancelled' ? 'cancelled' :
                    'submitted';

      currentDate = addDays(currentDate, Math.floor(rng() * 5) + 1);
      
      logs.push({
        log_id: generateWorkflowLogId('PRW', year, logSequence++),
        pr_no: pr.pr_no,
        action,
        performed_by: pr.approved_by || faker.person.fullName(),
        performed_date: currentDate,
        from_status: 'draft',
        to_status: pr.status,
        comments: `${action} by ${pr.approved_by || 'system'}`,
      });
    }
  }

  return logs;
}

export function generatePOWorkflowLogs(
  purchaseOrders: PurchaseOrder[],
  rng: () => number
): POWorkflowLog[] {
  const logs: POWorkflowLog[] = [];
  let logSequence = 1;

  for (const po of purchaseOrders) {
    const year = po.po_date.getFullYear();
    let currentDate = po.po_date;
    let currentStatus = 'draft';

    // Create log for creation
    logs.push({
      log_id: generateWorkflowLogId('POW', year, logSequence++),
      po_no: po.po_no,
      action: 'created',
      performed_by: po.created_by,
      performed_date: currentDate,
      from_status: undefined,
      to_status: 'draft',
      comments: 'PO created',
    });

    // Create log for status transitions
    if (po.status !== 'draft') {
      const action: POWorkflowLog['action'] = 
        po.status === 'approved' ? 'approved' :
        po.status === 'rejected' ? 'rejected' :
        po.status === 'cancelled' ? 'cancelled' :
        po.status === 'completed' ? 'completed' :
        'submitted';

      currentDate = addDays(currentDate, Math.floor(rng() * 5) + 1);
      
      logs.push({
        log_id: generateWorkflowLogId('POW', year, logSequence++),
        po_no: po.po_no,
        action,
        performed_by: po.approved_by || faker.person.fullName(),
        performed_date: currentDate,
        from_status: 'draft',
        to_status: po.status,
        comments: `${action} by ${po.approved_by || 'system'}`,
      });
    }
  }

  return logs;
}

export function generatePaymentWorkflowLogs(
  payments: Payment[],
  rng: () => number
): PaymentWorkflowLog[] {
  const logs: PaymentWorkflowLog[] = [];
  let logSequence = 1;

  for (const payment of payments) {
    const year = payment.payment_date.getFullYear();
    let currentDate = payment.payment_date;

    // Create log for creation
    logs.push({
      log_id: generateWorkflowLogId('PAYW', year, logSequence++),
      payment_id: payment.payment_id,
      action: 'created',
      performed_by: faker.person.fullName(),
      performed_date: currentDate,
      from_status: undefined,
      to_status: 'pending',
      comments: 'Payment created',
    });

    // Create log for status transitions
    if (payment.status !== 'pending') {
      const action: PaymentWorkflowLog['action'] = 
        payment.status === 'completed' ? 'completed' :
        payment.status === 'failed' ? 'failed' :
        payment.status === 'cancelled' ? 'cancelled' :
        payment.status === 'initiated' ? 'initiated' :
        'approved';

      currentDate = addDays(currentDate, Math.floor(rng() * 3) + 1);
      
      logs.push({
        log_id: generateWorkflowLogId('PAYW', year, logSequence++),
        payment_id: payment.payment_id,
        action,
        performed_by: payment.processed_by || payment.approved_by || faker.person.fullName(),
        performed_date: currentDate,
        from_status: 'pending',
        to_status: payment.status,
        comments: `${action} by ${payment.processed_by || payment.approved_by || 'system'}`,
      });
    }
  }

  return logs;
}

// ============================================================================
// Change Log Generators
// ============================================================================

export function generateVendorBankChangeLogs(
  vendors: Vendor[],
  rng: () => number
): VendorBankChangeLog[] {
  const logs: VendorBankChangeLog[] = [];
  let logSequence = 1;

  // Generate logs for vendors with bank_change_verification = false or true
  const vendorsWithChanges = vendors.filter(v => v.bank_change_verification !== undefined);
  
  for (const vendor of vendorsWithChanges) {
    if (rng() > 0.7) continue; // Only log 30% of changes

    const year = vendor.updated_date?.getFullYear() || vendor.created_date?.getFullYear() || new Date().getFullYear();
    const changeDate = vendor.updated_date || vendor.created_date || new Date();

    // Generate old values (simulated)
    const oldBankAccount = vendor.bank_account ? String(Number(vendor.bank_account) - 1000000) : undefined;
    const oldIfsc = vendor.ifsc;

    logs.push({
      change_log_id: generateChangeLogId('VBC', year, logSequence++),
      vendor_id: vendor.vendor_id,
      change_date: changeDate,
      changed_by: faker.person.fullName(),
      old_bank_account: oldBankAccount,
      new_bank_account: vendor.bank_account,
      old_ifsc: oldIfsc,
      new_ifsc: vendor.ifsc,
      verification_status: vendor.bank_change_verification ? 'verified' : 'pending',
      verified_by: vendor.bank_change_verification ? vendor.verified_by : undefined,
      verification_date: vendor.bank_change_verification ? vendor.verification_date : undefined,
      reason: rng() > 0.5 ? 'Bank account update' : undefined,
    });
  }

  return logs;
}

export function generatePOChangeLogs(
  purchaseOrders: PurchaseOrder[],
  rng: () => number
): POChangeLog[] {
  const logs: POChangeLog[] = [];
  let logSequence = 1;

  // Generate logs for POs with updates
  for (const po of purchaseOrders) {
    if (!po.updated_date || rng() > 0.6) continue; // Only log 40% of changes

    const year = po.updated_date.getFullYear();
    const changeTypes: POChangeLog['change_type'][] = ['amount', 'quantity', 'delivery_date', 'vendor', 'status', 'other'];
    const changeType = changeTypes[Math.floor(rng() * changeTypes.length)];

    let fieldName = '';
    let oldValue = '';
    let newValue = '';

    switch (changeType) {
      case 'amount':
        fieldName = 'total_amount';
        oldValue = String(po.total_amount * 0.9);
        newValue = String(po.total_amount);
        break;
      case 'delivery_date':
        fieldName = 'expected_delivery_date';
        oldValue = po.expected_delivery_date ? po.expected_delivery_date.toISOString() : '';
        newValue = po.expected_delivery_date?.toISOString() || '';
        break;
      case 'status':
        fieldName = 'status';
        oldValue = 'draft';
        newValue = po.status;
        break;
      default:
        fieldName = 'other';
        oldValue = 'old';
        newValue = 'new';
    }

    logs.push({
      change_log_id: generateChangeLogId('POC', year, logSequence++),
      po_no: po.po_no,
      change_date: po.updated_date,
      changed_by: faker.person.fullName(),
      change_type: changeType,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      reason: rng() > 0.5 ? 'PO amendment' : undefined,
      approval_required: po.total_amount > 50000,
      approved_by: po.total_amount > 50000 && rng() > 0.4 ? faker.person.fullName() : undefined,
      approval_date: po.total_amount > 50000 && rng() > 0.4 ? po.updated_date : undefined,
    });
  }

  return logs;
}


