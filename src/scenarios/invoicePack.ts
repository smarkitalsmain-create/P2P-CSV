import type { ScenarioPack } from './types';

/**
 * Invoice Pack (TS-116 to TS-135)
 * Scenarios focused on invoice processing and controls
 */
export const invoicePack: ScenarioPack = {
  packName: 'invoice_pack',
  packDescription: 'Invoice processing and control scenarios',
  scenarios: [
    // TS-116: Standard invoice process
    {
      scenarioId: 'TS-116',
      name: 'Standard Invoice Process',
      description: 'Standard invoice with all controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal invoice exceptions' },
    },

    // TS-117: Invoice without GRN
    {
      scenarioId: 'TS-117',
      name: 'Invoice Without GRN',
      description: 'Invoices without required GRN',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {
        invoice_without_grn_pct: 12,
      },
      expectedExceptionVolume: { min: 360, max: 420, description: 'Invoice without GRN exceptions' },
    },

    // TS-118: Duplicate invoice numbers
    {
      scenarioId: 'TS-118',
      name: 'Duplicate Invoice Numbers',
      description: 'Duplicate invoice numbers detected',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
      },
      anomalyConfig: {
        duplicate_invoice_number_pct: 3,
      },
      expectedExceptionVolume: { min: 90, max: 110, description: 'Duplicate invoice exceptions' },
    },

    // TS-119: Invoice amount mismatch
    {
      scenarioId: 'TS-119',
      name: 'Invoice Amount Mismatch',
      description: 'Invoice amounts not matching PO/GRN',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
        tolerance_amount: 500,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'Invoice amount mismatch exceptions' },
    },

    // TS-120: Invoice with vendor compliance
    {
      scenarioId: 'TS-120',
      name: 'Invoice Vendor Compliance',
      description: 'Invoices with vendor compliance issues',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        invoice_matching_required: true,
      },
      anomalyConfig: {
        missing_pan_pct: 10,
        inactive_vendor_used_pct: 6,
      },
      expectedExceptionVolume: { min: 480, max: 570, description: 'Invoice vendor compliance exceptions' },
    },

    // TS-121: Invoice approval violations
    {
      scenarioId: 'TS-121',
      name: 'Invoice Approval Violations',
      description: 'Invoices exceeding approval thresholds',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'Invoice approval violation exceptions' },
    },

    // TS-122: Invoice with PO matching
    {
      scenarioId: 'TS-122',
      name: 'Invoice PO Matching',
      description: 'Invoice-PO matching requirements',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 250, max: 350, description: 'Invoice PO matching exceptions' },
    },

    // TS-123: Invoice with GRN matching
    {
      scenarioId: 'TS-123',
      name: 'Invoice GRN Matching',
      description: 'Invoice-GRN matching requirements',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'Invoice GRN matching exceptions' },
    },

    // TS-124: Invoice with tax compliance
    {
      scenarioId: 'TS-124',
      name: 'Invoice Tax Compliance',
      description: 'Invoice tax compliance checks',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_gstin_for_vendor: true,
        invoice_matching_required: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
      },
      expectedExceptionVolume: { min: 400, max: 480, description: 'Invoice tax compliance exceptions' },
    },

    // TS-125: Invoice duplicate detection
    {
      scenarioId: 'TS-125',
      name: 'Invoice Duplicate Detection',
      description: 'Detection of duplicate invoices',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
      },
      anomalyConfig: {
        duplicate_invoice_number_pct: 5,
      },
      expectedExceptionVolume: { min: 150, max: 180, description: 'Invoice duplicate exceptions' },
    },

    // TS-126: Invoice with service exemptions
    {
      scenarioId: 'TS-126',
      name: 'Invoice Service Exemptions',
      description: 'Service invoices exempt from GRN',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        goods_require_grn: true,
        service_allow_without_grn: true,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 200, description: 'Invoice service exemption exceptions' },
    },

    // TS-127: Invoice compliance monitoring
    {
      scenarioId: 'TS-127',
      name: 'Invoice Compliance Monitoring',
      description: 'Comprehensive invoice compliance monitoring',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        invoice_without_grn_pct: 8,
        duplicate_invoice_number_pct: 2,
      },
      expectedExceptionVolume: { min: 300, max: 400, description: 'Invoice compliance monitoring exceptions' },
    },

    // TS-128: Invoice with amount controls
    {
      scenarioId: 'TS-128',
      name: 'Invoice Amount Controls',
      description: 'Invoices with strict amount controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
        tolerance_amount: 500,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 400, max: 500, description: 'Invoice amount control exceptions' },
    },

    // TS-129: Invoice with timing controls
    {
      scenarioId: 'TS-129',
      name: 'Invoice Timing Controls',
      description: 'Invoice timing and due date controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'Invoice timing control exceptions' },
    },

    // TS-130: Invoice baseline scenario
    {
      scenarioId: 'TS-130',
      name: 'Invoice Baseline Scenario',
      description: 'Baseline invoice control scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
        tolerance_amount: 2000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'Invoice baseline exceptions' },
    },

    // TS-131: Invoice with mixed controls
    {
      scenarioId: 'TS-131',
      name: 'Invoice Mixed Controls',
      description: 'Invoices with mixed control scenarios',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {
        invoice_without_grn_pct: 6,
        duplicate_invoice_number_pct: 2,
        missing_pan_pct: 5,
      },
      expectedExceptionVolume: { min: 390, max: 480, description: 'Invoice mixed control exceptions' },
    },

    // TS-132: Invoice with vendor risk
    {
      scenarioId: 'TS-132',
      name: 'Invoice Vendor Risk',
      description: 'Invoices with high-risk vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
        invoice_matching_required: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 8,
        bank_change_unverified_pct: 12,
        invoice_without_grn_pct: 10,
      },
      expectedExceptionVolume: { min: 900, max: 1050, description: 'Invoice vendor risk exceptions' },
    },

    // TS-133: Invoice with approval chain
    {
      scenarioId: 'TS-133',
      name: 'Invoice Approval Chain',
      description: 'Invoices requiring multiple approvals',
      datasetShape: { vendors: 400, pos: 2000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 250000,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'Invoice approval chain exceptions' },
    },

    // TS-134: Invoice audit scenario
    {
      scenarioId: 'TS-134',
      name: 'Invoice Audit Scenario',
      description: 'Comprehensive invoice audit scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
      },
      anomalyConfig: {
        invoice_without_grn_pct: 10,
        duplicate_invoice_number_pct: 3,
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 780, max: 920, description: 'Invoice audit exceptions' },
    },

    // TS-135: Invoice high-volume scenario
    {
      scenarioId: 'TS-135',
      name: 'Invoice High-Volume Scenario',
      description: 'High-volume invoice processing',
      datasetShape: { vendors: 2000, pos: 15000 },
      policyConfig: {
        invoice_matching_required: true,
        tolerance_amount: 1500,
      },
      anomalyConfig: {
        duplicate_invoice_number_pct: 2,
        invoice_without_grn_pct: 5,
      },
      expectedExceptionVolume: { min: 1050, max: 1200, description: 'High-volume invoice exceptions' },
    },
  ],
};


