import type { ScenarioPack } from './types';

/**
 * GRN Controls Pack (TS-081 to TS-100)
 * Scenarios focused on Goods Receipt Note (GRN) controls
 */
export const grnControlsPack: ScenarioPack = {
  packName: 'grn_controls_pack',
  packDescription: 'Goods Receipt Note control scenarios',
  scenarios: [
    // TS-081: Standard GRN process
    {
      scenarioId: 'TS-081',
      name: 'Standard GRN Process',
      description: 'All goods POs require GRN',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_quality_check: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal GRN exceptions' },
    },

    // TS-082: GRN without PO
    {
      scenarioId: 'TS-082',
      name: 'GRN Without PO',
      description: 'GRNs created without valid PO',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'GRN without PO exceptions' },
    },

    // TS-083: GRN quantity mismatch
    {
      scenarioId: 'TS-083',
      name: 'GRN Quantity Mismatch',
      description: 'GRNs with quantity mismatches',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'GRN quantity mismatch exceptions' },
    },

    // TS-084: GRN quality check violations
    {
      scenarioId: 'TS-084',
      name: 'GRN Quality Check Violations',
      description: 'GRNs without quality checks',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_quality_check: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 400, max: 500, description: 'GRN quality check exceptions' },
    },

    // TS-085: GRN with delayed receipt
    {
      scenarioId: 'TS-085',
      name: 'GRN Delayed Receipt',
      description: 'GRNs with significant delay from PO',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 150, max: 250, description: 'GRN delayed receipt exceptions' },
    },

    // TS-086: GRN with amount variance
    {
      scenarioId: 'TS-086',
      name: 'GRN Amount Variance',
      description: 'GRNs with high amount variance from PO',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        tolerance_amount: 500,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'GRN amount variance exceptions' },
    },

    // TS-087: GRN without delivery note
    {
      scenarioId: 'TS-087',
      name: 'GRN Without Delivery Note',
      description: 'GRNs created without delivery note',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_delivery_note: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 500, max: 600, description: 'GRN delivery note exceptions' },
    },

    // TS-088: Partial GRN scenarios
    {
      scenarioId: 'TS-088',
      name: 'Partial GRN Scenarios',
      description: 'Multiple partial GRNs for same PO',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'Partial GRN exceptions' },
    },

    // TS-089: GRN with vendor compliance
    {
      scenarioId: 'TS-089',
      name: 'GRN Vendor Compliance',
      description: 'GRNs with vendor compliance checks',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 650, max: 750, description: 'GRN vendor compliance exceptions' },
    },

    // TS-090: GRN duplicate detection
    {
      scenarioId: 'TS-090',
      name: 'GRN Duplicate Detection',
      description: 'Detection of duplicate GRNs',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'GRN duplicate exceptions' },
    },

    // TS-091: GRN with invoice matching
    {
      scenarioId: 'TS-091',
      name: 'GRN Invoice Matching',
      description: 'GRN-Invoice matching requirements',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 250, max: 350, description: 'GRN invoice matching exceptions' },
    },

    // TS-092: GRN with quality rejection
    {
      scenarioId: 'TS-092',
      name: 'GRN Quality Rejection',
      description: 'GRNs with quality check failures',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_quality_check: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'GRN quality rejection exceptions' },
    },

    // TS-093: GRN with service exemption
    {
      scenarioId: 'TS-093',
      name: 'GRN Service Exemption',
      description: 'Service POs exempt from GRN',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        goods_require_grn: true,
        service_allow_without_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 200, description: 'GRN service exemption exceptions' },
    },

    // TS-094: GRN compliance monitoring
    {
      scenarioId: 'TS-094',
      name: 'GRN Compliance Monitoring',
      description: 'Comprehensive GRN compliance monitoring',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_quality_check: true,
        require_delivery_note: true,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 900, max: 1100, description: 'GRN compliance monitoring exceptions' },
    },

    // TS-095: GRN with amount controls
    {
      scenarioId: 'TS-095',
      name: 'GRN Amount Controls',
      description: 'GRNs with strict amount controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        tolerance_amount: 500,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 400, max: 500, description: 'GRN amount control exceptions' },
    },

    // TS-096: GRN with timing controls
    {
      scenarioId: 'TS-096',
      name: 'GRN Timing Controls',
      description: 'GRNs with timing and delay controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'GRN timing control exceptions' },
    },

    // TS-097: GRN baseline scenario
    {
      scenarioId: 'TS-097',
      name: 'GRN Baseline Scenario',
      description: 'Baseline GRN control scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'GRN baseline exceptions' },
    },

    // TS-098: GRN with mixed controls
    {
      scenarioId: 'TS-098',
      name: 'GRN Mixed Controls',
      description: 'GRNs with mixed control scenarios',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_quality_check: true,
        tolerance_amount: 1000,
      },
      anomalyConfig: {
        missing_pan_pct: 5,
      },
      expectedExceptionVolume: { min: 500, max: 600, description: 'GRN mixed control exceptions' },
    },

    // TS-099: GRN with vendor risk
    {
      scenarioId: 'TS-099',
      name: 'GRN Vendor Risk',
      description: 'GRNs with high-risk vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 8,
        bank_change_unverified_pct: 12,
      },
      expectedExceptionVolume: { min: 1000, max: 1150, description: 'GRN vendor risk exceptions' },
    },

    // TS-100: GRN audit scenario
    {
      scenarioId: 'TS-100',
      name: 'GRN Audit Scenario',
      description: 'Comprehensive GRN audit scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
        require_quality_check: true,
        require_delivery_note: true,
        invoice_matching_required: true,
        tolerance_amount: 1000,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 6,
        invoice_without_grn_pct: 10,
      },
      expectedExceptionVolume: { min: 1400, max: 1600, description: 'GRN audit exceptions' },
    },
  ],
};


