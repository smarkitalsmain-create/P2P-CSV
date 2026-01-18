import type { ScenarioPack } from './types';

/**
 * Procurement Pack (TS-021 to TS-040)
 * Scenarios focused on procurement processes and controls
 */
export const procurementPack: ScenarioPack = {
  packName: 'procurement_pack',
  packDescription: 'Procurement process and control scenarios',
  scenarios: [
    // TS-021: Standard procurement process
    {
      scenarioId: 'TS-021',
      name: 'Standard Procurement Process',
      description: 'Standard procurement with all controls in place',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: false,
        tender_threshold: 100000,
        three_quote_threshold: 50000,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal exceptions' },
    },

    // TS-022: High-value procurement
    {
      scenarioId: 'TS-022',
      name: 'High-Value Procurement',
      description: 'High-value POs requiring multiple approvals',
      datasetShape: { vendors: 200, pos: 1000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
        executive_approval_threshold: 2000000,
        tender_threshold: 100000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 30, description: 'High-value procurement exceptions' },
    },

    // TS-023: Service procurement without PR
    {
      scenarioId: 'TS-023',
      name: 'Service Procurement Without PR',
      description: 'Service POs allowed without PR',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'Service PO exceptions' },
    },

    // TS-024: Procurement with tender requirements
    {
      scenarioId: 'TS-024',
      name: 'Procurement with Tender Requirements',
      description: 'Strict tender requirements above threshold',
      datasetShape: { vendors: 300, pos: 2000 },
      policyConfig: {
        tender_threshold: 50000,
        three_quote_threshold: 25000,
        single_quote_threshold: 10000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 40, description: 'Tender requirement exceptions' },
    },

    // TS-025: Low-value procurement
    {
      scenarioId: 'TS-025',
      name: 'Low-Value Procurement',
      description: 'Low-value POs with relaxed controls',
      datasetShape: { vendors: 1000, pos: 8000 },
      policyConfig: {
        approval_threshold_amount: 100000,
        single_quote_threshold: 50000,
        tender_threshold: 200000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 80, description: 'Low-value procurement exceptions' },
    },

    // TS-026: Mixed procurement scenarios
    {
      scenarioId: 'TS-026',
      name: 'Mixed Procurement Scenarios',
      description: 'Mix of goods and service procurement',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
        approval_threshold_amount: 75000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 120, description: 'Mixed procurement exceptions' },
    },

    // TS-027: Procurement with approval violations
    {
      scenarioId: 'TS-027',
      name: 'Procurement Approval Violations',
      description: 'POs exceeding approval thresholds',
      datasetShape: { vendors: 400, pos: 2500 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
        executive_approval_threshold: 2000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'Approval violation exceptions' },
    },

    // TS-028: Emergency procurement
    {
      scenarioId: 'TS-028',
      name: 'Emergency Procurement',
      description: 'Emergency POs with relaxed controls',
      datasetShape: { vendors: 300, pos: 1500 },
      policyConfig: {
        approval_threshold_amount: 200000,
        allow_service_po_without_pr: true,
        tender_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 60, description: 'Emergency procurement exceptions' },
    },

    // TS-029: Strategic vendor procurement
    {
      scenarioId: 'TS-029',
      name: 'Strategic Vendor Procurement',
      description: 'Procurement with strategic vendors',
      datasetShape: { vendors: 100, pos: 2000 },
      policyConfig: {
        approval_threshold_amount: 100000,
        tender_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 40, description: 'Strategic vendor exceptions' },
    },

    // TS-030: Multi-level approval procurement
    {
      scenarioId: 'TS-030',
      name: 'Multi-Level Approval Procurement',
      description: 'POs requiring multiple approval levels',
      datasetShape: { vendors: 350, pos: 1800 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 250000,
        executive_approval_threshold: 1000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 90, description: 'Multi-level approval exceptions' },
    },

    // TS-031: Procurement with quote requirements
    {
      scenarioId: 'TS-031',
      name: 'Procurement Quote Requirements',
      description: 'Strict quote requirements',
      datasetShape: { vendors: 400, pos: 2500 },
      policyConfig: {
        single_quote_threshold: 25000,
        three_quote_threshold: 100000,
        tender_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 70, description: 'Quote requirement exceptions' },
    },

    // TS-032: Large-scale procurement
    {
      scenarioId: 'TS-032',
      name: 'Large-Scale Procurement',
      description: 'Large volume procurement operations',
      datasetShape: { vendors: 2000, pos: 15000 },
      policyConfig: {
        approval_threshold_amount: 75000,
        tender_threshold: 200000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 200, description: 'Large-scale procurement exceptions' },
    },

    // TS-033: Procurement with vendor compliance
    {
      scenarioId: 'TS-033',
      name: 'Procurement with Vendor Compliance',
      description: 'Procurement with vendor compliance checks',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {
        missing_pan_pct: 5,
        inactive_vendor_used_pct: 3,
      },
      expectedExceptionVolume: { min: 400, max: 500, description: 'Vendor compliance exceptions' },
    },

    // TS-034: Procurement with service exemptions
    {
      scenarioId: 'TS-034',
      name: 'Procurement Service Exemptions',
      description: 'Service procurement with exemptions',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
        goods_require_grn: true,
        service_allow_without_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 150, description: 'Service exemption exceptions' },
    },

    // TS-035: Procurement with approval bypass
    {
      scenarioId: 'TS-035',
      name: 'Procurement Approval Bypass',
      description: 'Scenarios with potential approval bypass',
      datasetShape: { vendors: 400, pos: 2500 },
      policyConfig: {
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 250, max: 350, description: 'Approval bypass exceptions' },
    },

    // TS-036: Procurement with threshold violations
    {
      scenarioId: 'TS-036',
      name: 'Procurement Threshold Violations',
      description: 'Violations of procurement thresholds',
      datasetShape: { vendors: 450, pos: 2800 },
      policyConfig: {
        approval_threshold_amount: 50000,
        tender_threshold: 100000,
        three_quote_threshold: 50000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'Threshold violation exceptions' },
    },

    // TS-037: Procurement with vendor risk
    {
      scenarioId: 'TS-037',
      name: 'Procurement with Vendor Risk',
      description: 'Procurement using high-risk vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 8,
        vendor_without_approval_pct: 12,
      },
      expectedExceptionVolume: { min: 1000, max: 1200, description: 'Vendor risk exceptions' },
    },

    // TS-038: Procurement compliance baseline
    {
      scenarioId: 'TS-038',
      name: 'Procurement Compliance Baseline',
      description: 'Baseline procurement compliance scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 100000,
        tender_threshold: 200000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'Baseline compliance exceptions' },
    },

    // TS-039: Procurement with mixed controls
    {
      scenarioId: 'TS-039',
      name: 'Procurement Mixed Controls',
      description: 'Mixed procurement controls and policies',
      datasetShape: { vendors: 600, pos: 4000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
        approval_threshold_amount: 75000,
        tender_threshold: 150000,
        three_quote_threshold: 75000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 150, description: 'Mixed control exceptions' },
    },

    // TS-040: Procurement audit scenario
    {
      scenarioId: 'TS-040',
      name: 'Procurement Audit Scenario',
      description: 'Comprehensive procurement audit scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
        tender_threshold: 100000,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 5,
        missing_pan_pct: 8,
      },
      expectedExceptionVolume: { min: 650, max: 750, description: 'Procurement audit exceptions' },
    },
  ],
};


