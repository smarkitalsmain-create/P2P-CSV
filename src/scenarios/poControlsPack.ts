import type { ScenarioPack } from './types';

/**
 * PO Controls Pack (TS-061 to TS-080)
 * Scenarios focused on Purchase Order controls
 */
export const poControlsPack: ScenarioPack = {
  packName: 'po_controls_pack',
  packDescription: 'Purchase Order control scenarios',
  scenarios: [
    // TS-061: Standard PO process
    {
      scenarioId: 'TS-061',
      name: 'Standard PO Process',
      description: 'Standard PO with all controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        require_pr_for_goods: true,
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal PO exceptions' },
    },

    // TS-062: PO approval violations
    {
      scenarioId: 'TS-062',
      name: 'PO Approval Violations',
      description: 'POs exceeding approval thresholds',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'PO approval violation exceptions' },
    },

    // TS-063: PO with inactive vendors
    {
      scenarioId: 'TS-063',
      name: 'PO with Inactive Vendors',
      description: 'POs using inactive vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 8,
      },
      expectedExceptionVolume: { min: 240, max: 300, description: 'Inactive vendor PO exceptions' },
    },

    // TS-064: PO without PR
    {
      scenarioId: 'TS-064',
      name: 'PO Without PR',
      description: 'POs created without required PR',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: false,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 600, max: 700, description: 'PO without PR exceptions' },
    },

    // TS-065: High-value PO controls
    {
      scenarioId: 'TS-065',
      name: 'High-Value PO Controls',
      description: 'High-value POs with strict controls',
      datasetShape: { vendors: 200, pos: 1000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 250000,
        executive_approval_threshold: 1000000,
        tender_threshold: 100000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'High-value PO exceptions' },
    },

    // TS-066: PO with vendor compliance issues
    {
      scenarioId: 'TS-066',
      name: 'PO Vendor Compliance Issues',
      description: 'POs with vendor compliance problems',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 10,
        inactive_vendor_used_pct: 6,
        vendor_without_approval_pct: 12,
      },
      expectedExceptionVolume: { min: 840, max: 960, description: 'PO vendor compliance exceptions' },
    },

    // TS-067: PO duplicate detection
    {
      scenarioId: 'TS-067',
      name: 'PO Duplicate Detection',
      description: 'Detection of duplicate POs',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'PO duplicate exceptions' },
    },

    // TS-068: PO with threshold bypass
    {
      scenarioId: 'TS-068',
      name: 'PO Threshold Bypass',
      description: 'POs split to bypass thresholds',
      datasetShape: { vendors: 400, pos: 2500 },
      policyConfig: {
        approval_threshold_amount: 50000,
        tender_threshold: 100000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 250, max: 350, description: 'PO threshold bypass exceptions' },
    },

    // TS-069: PO with service exemptions
    {
      scenarioId: 'TS-069',
      name: 'PO Service Exemptions',
      description: 'Service POs with exemptions',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
        goods_require_grn: true,
        service_allow_without_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 200, description: 'PO service exemption exceptions' },
    },

    // TS-070: PO with multi-level approval
    {
      scenarioId: 'TS-070',
      name: 'PO Multi-Level Approval',
      description: 'POs requiring multiple approval levels',
      datasetShape: { vendors: 400, pos: 2000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 250000,
        executive_approval_threshold: 1000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PO multi-level approval exceptions' },
    },

    // TS-071: PO with budget controls
    {
      scenarioId: 'TS-071',
      name: 'PO Budget Controls',
      description: 'POs with budget control checks',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        max_po_amount: 5000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PO budget control exceptions' },
    },

    // TS-072: PO with vendor risk
    {
      scenarioId: 'TS-072',
      name: 'PO Vendor Risk',
      description: 'POs with high-risk vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 10,
        bank_change_unverified_pct: 15,
        vendor_without_approval_pct: 15,
      },
      expectedExceptionVolume: { min: 1200, max: 1350, description: 'PO vendor risk exceptions' },
    },

    // TS-073: PO with quote requirements
    {
      scenarioId: 'TS-073',
      name: 'PO Quote Requirements',
      description: 'POs with quote requirement checks',
      datasetShape: { vendors: 400, pos: 2500 },
      policyConfig: {
        single_quote_threshold: 25000,
        three_quote_threshold: 100000,
        tender_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PO quote requirement exceptions' },
    },

    // TS-074: PO with matching controls
    {
      scenarioId: 'TS-074',
      name: 'PO Matching Controls',
      description: 'PO-GRN-Invoice matching requirements',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 150, description: 'PO matching control exceptions' },
    },

    // TS-075: PO with category controls
    {
      scenarioId: 'TS-075',
      name: 'PO Category Controls',
      description: 'POs with category-specific controls',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        require_pr_for_goods: true,
        goods_require_grn: true,
        service_allow_without_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 200, description: 'PO category control exceptions' },
    },

    // TS-076: PO compliance monitoring
    {
      scenarioId: 'TS-076',
      name: 'PO Compliance Monitoring',
      description: 'Comprehensive PO compliance monitoring',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        require_pr_for_goods: true,
        require_pan_for_vendor: true,
        goods_require_grn: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 390, max: 480, description: 'PO compliance monitoring exceptions' },
    },

    // TS-077: PO with split orders
    {
      scenarioId: 'TS-077',
      name: 'PO Split Orders',
      description: 'Detection of split POs',
      datasetShape: { vendors: 400, pos: 2500 },
      policyConfig: {
        approval_threshold_amount: 50000,
        tender_threshold: 100000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 250, max: 350, description: 'PO split order exceptions' },
    },

    // TS-078: PO baseline scenario
    {
      scenarioId: 'TS-078',
      name: 'PO Baseline Scenario',
      description: 'Baseline PO control scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 100000,
        require_pr_for_goods: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PO baseline exceptions' },
    },

    // TS-079: PO with mixed controls
    {
      scenarioId: 'TS-079',
      name: 'PO Mixed Controls',
      description: 'POs with mixed control scenarios',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 75000,
        require_pr_for_goods: true,
        goods_require_grn: true,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 6,
        inactive_vendor_used_pct: 4,
      },
      expectedExceptionVolume: { min: 300, max: 400, description: 'PO mixed control exceptions' },
    },

    // TS-080: PO audit scenario
    {
      scenarioId: 'TS-080',
      name: 'PO Audit Scenario',
      description: 'Comprehensive PO audit scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
        require_pr_for_goods: true,
        goods_require_grn: true,
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 6,
        vendor_without_approval_pct: 12,
        bank_change_unverified_pct: 10,
      },
      expectedExceptionVolume: { min: 780, max: 900, description: 'PO audit exceptions' },
    },
  ],
};


