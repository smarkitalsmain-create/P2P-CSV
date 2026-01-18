import type { ScenarioPack } from './types';

/**
 * PR Controls Pack (TS-041 to TS-060)
 * Scenarios focused on Purchase Requisition (PR) controls
 */
export const prControlsPack: ScenarioPack = {
  packName: 'pr_controls_pack',
  packDescription: 'Purchase Requisition control scenarios',
  scenarios: [
    // TS-041: Standard PR process
    {
      scenarioId: 'TS-041',
      name: 'Standard PR Process',
      description: 'All POs require PR approval',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: false,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal PR exceptions' },
    },

    // TS-042: PR with service exemptions
    {
      scenarioId: 'TS-042',
      name: 'PR with Service Exemptions',
      description: 'Service POs allowed without PR',
      datasetShape: { vendors: 600, prs: 2500, pos: 3500 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'Service PR exemption exceptions' },
    },

    // TS-043: PR approval violations
    {
      scenarioId: 'TS-043',
      name: 'PR Approval Violations',
      description: 'PRs exceeding approval thresholds',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'PR approval violation exceptions' },
    },

    // TS-044: PR without approval
    {
      scenarioId: 'TS-044',
      name: 'PR Without Approval',
      description: 'PRs created without proper approval',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 300, max: 400, description: 'PR approval exceptions' },
    },

    // TS-045: High-value PR controls
    {
      scenarioId: 'TS-045',
      name: 'High-Value PR Controls',
      description: 'High-value PRs with strict controls',
      datasetShape: { vendors: 200, prs: 800, pos: 800 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 250000,
        executive_approval_threshold: 1000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 40, description: 'High-value PR exceptions' },
    },

    // TS-046: PR bypass scenarios
    {
      scenarioId: 'TS-046',
      name: 'PR Bypass Scenarios',
      description: 'POs created without required PR',
      datasetShape: { vendors: 500, prs: 2500, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: false,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 500, max: 600, description: 'PR bypass exceptions' },
    },

    // TS-047: PR with multiple approvals
    {
      scenarioId: 'TS-047',
      name: 'PR Multiple Approvals',
      description: 'PRs requiring multiple approval levels',
      datasetShape: { vendors: 400, prs: 2000, pos: 2000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 250000,
        executive_approval_threshold: 1000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 80, description: 'Multi-approval PR exceptions' },
    },

    // TS-048: Emergency PR process
    {
      scenarioId: 'TS-048',
      name: 'Emergency PR Process',
      description: 'Emergency PRs with relaxed controls',
      datasetShape: { vendors: 300, prs: 1500, pos: 1500 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 200000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 60, description: 'Emergency PR exceptions' },
    },

    // TS-049: PR with vendor compliance
    {
      scenarioId: 'TS-049',
      name: 'PR with Vendor Compliance',
      description: 'PRs with vendor compliance checks',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 650, max: 750, description: 'PR vendor compliance exceptions' },
    },

    // TS-050: PR approval chain violations
    {
      scenarioId: 'TS-050',
      name: 'PR Approval Chain Violations',
      description: 'PRs violating approval chain requirements',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 400, max: 500, description: 'PR approval chain exceptions' },
    },

    // TS-051: PR with budget controls
    {
      scenarioId: 'TS-051',
      name: 'PR with Budget Controls',
      description: 'PRs with budget control checks',
      datasetShape: { vendors: 400, prs: 2500, pos: 2500 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        max_po_amount: 5000000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PR budget control exceptions' },
    },

    // TS-052: PR with duplicate checks
    {
      scenarioId: 'TS-052',
      name: 'PR Duplicate Checks',
      description: 'Detection of duplicate PRs',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'PR duplicate exceptions' },
    },

    // TS-053: PR with category controls
    {
      scenarioId: 'TS-053',
      name: 'PR Category Controls',
      description: 'PRs with category-specific controls',
      datasetShape: { vendors: 600, prs: 3500, pos: 3500 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: true,
        goods_require_grn: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 120, description: 'PR category control exceptions' },
    },

    // TS-054: PR with threshold violations
    {
      scenarioId: 'TS-054',
      name: 'PR Threshold Violations',
      description: 'PRs violating amount thresholds',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        tender_threshold: 100000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 350, max: 450, description: 'PR threshold violation exceptions' },
    },

    // TS-055: PR with department controls
    {
      scenarioId: 'TS-055',
      name: 'PR Department Controls',
      description: 'PRs with department-specific controls',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 75000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PR department control exceptions' },
    },

    // TS-056: PR with compliance monitoring
    {
      scenarioId: 'TS-056',
      name: 'PR Compliance Monitoring',
      description: 'Comprehensive PR compliance monitoring',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 6,
        vendor_without_approval_pct: 10,
      },
      expectedExceptionVolume: { min: 480, max: 580, description: 'PR compliance monitoring exceptions' },
    },

    // TS-057: PR with split orders
    {
      scenarioId: 'TS-057',
      name: 'PR Split Orders',
      description: 'Detection of split PRs to bypass thresholds',
      datasetShape: { vendors: 400, prs: 2500, pos: 2500 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'PR split order exceptions' },
    },

    // TS-058: PR with vendor risk assessment
    {
      scenarioId: 'TS-058',
      name: 'PR Vendor Risk Assessment',
      description: 'PRs with vendor risk assessment',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 7,
        bank_change_unverified_pct: 12,
      },
      expectedExceptionVolume: { min: 950, max: 1100, description: 'PR vendor risk exceptions' },
    },

    // TS-059: PR baseline scenario
    {
      scenarioId: 'TS-059',
      name: 'PR Baseline Scenario',
      description: 'Baseline PR control scenario',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        approval_threshold_amount: 100000,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'PR baseline exceptions' },
    },

    // TS-060: PR audit scenario
    {
      scenarioId: 'TS-060',
      name: 'PR Audit Scenario',
      description: 'Comprehensive PR audit scenario',
      datasetShape: { vendors: 500, prs: 3000, pos: 3000 },
      policyConfig: {
        require_pr_for_goods: true,
        allow_service_po_without_pr: false,
        approval_threshold_amount: 50000,
        multi_level_approval_threshold: 500000,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 5,
        vendor_without_approval_pct: 12,
      },
      expectedExceptionVolume: { min: 1250, max: 1400, description: 'PR audit exceptions' },
    },
  ],
};


