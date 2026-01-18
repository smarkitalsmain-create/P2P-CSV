import type { ScenarioPack } from './types';

/**
 * Vendor Master Pack (TS-001 to TS-020)
 * Scenarios focused on vendor master data quality and compliance
 */
export const vendorMasterPack: ScenarioPack = {
  packName: 'vendor_master_pack',
  packDescription: 'Vendor master data quality and compliance scenarios',
  scenarios: [
    // TS-001: Clean vendor master - all vendors compliant
    {
      scenarioId: 'TS-001',
      name: 'Clean Vendor Master',
      description: 'All vendors with complete PAN, GSTIN, bank verification',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal exceptions' },
    },

    // TS-002: Missing PAN compliance
    {
      scenarioId: 'TS-002',
      name: 'Missing PAN Compliance',
      description: '10% vendors missing PAN',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 10,
      },
      expectedExceptionVolume: { min: 100, max: 120, description: 'PAN missing exceptions' },
    },

    // TS-003: Missing GSTIN compliance
    {
      scenarioId: 'TS-003',
      name: 'Missing GSTIN Compliance',
      description: '15% vendors missing GSTIN',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 15,
      },
      expectedExceptionVolume: { min: 150, max: 170, description: 'GSTIN missing exceptions' },
    },

    // TS-004: Duplicate PAN detection
    {
      scenarioId: 'TS-004',
      name: 'Duplicate PAN Detection',
      description: '5% vendors with duplicate PAN',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        duplicate_vendor_pan_pct: 5,
      },
      expectedExceptionVolume: { min: 50, max: 60, description: 'Duplicate PAN exceptions' },
    },

    // TS-005: Duplicate bank account detection
    {
      scenarioId: 'TS-005',
      name: 'Duplicate Bank Account Detection',
      description: '3% vendors with duplicate bank accounts',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_bank_verification: true,
      },
      anomalyConfig: {
        duplicate_vendor_bank_pct: 3,
      },
      expectedExceptionVolume: { min: 30, max: 40, description: 'Duplicate bank account exceptions' },
    },

    // TS-006: Unapproved vendors
    {
      scenarioId: 'TS-006',
      name: 'Unapproved Vendors',
      description: '20% vendors created without approval',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        vendor_without_approval_pct: 20,
      },
      expectedExceptionVolume: { min: 200, max: 220, description: 'Unapproved vendor exceptions' },
    },

    // TS-007: Unverified bank changes
    {
      scenarioId: 'TS-007',
      name: 'Unverified Bank Changes',
      description: '25% vendors with unverified bank changes',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_bank_verification: true,
      },
      anomalyConfig: {
        bank_change_unverified_pct: 25,
      },
      expectedExceptionVolume: { min: 250, max: 270, description: 'Unverified bank change exceptions' },
    },

    // TS-008: Mixed vendor compliance issues
    {
      scenarioId: 'TS-008',
      name: 'Mixed Vendor Compliance Issues',
      description: 'Multiple vendor compliance issues (PAN, GSTIN, approval)',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        vendor_without_approval_pct: 12,
        bank_change_unverified_pct: 10,
      },
      expectedExceptionVolume: { min: 300, max: 350, description: 'Multiple compliance exceptions' },
    },

    // TS-009: Large vendor master with duplicates
    {
      scenarioId: 'TS-009',
      name: 'Large Vendor Master with Duplicates',
      description: '10k vendors with 2% duplicate PAN and bank accounts',
      datasetShape: { vendors: 10000, pos: 50000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        duplicate_vendor_pan_pct: 2,
        duplicate_vendor_bank_pct: 2,
      },
      expectedExceptionVolume: { min: 400, max: 450, description: 'Duplicate detection exceptions' },
    },

    // TS-010: High-risk vendor master
    {
      scenarioId: 'TS-010',
      name: 'High-Risk Vendor Master',
      description: 'High percentage of compliance issues',
      datasetShape: { vendors: 2000, pos: 10000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 15,
        duplicate_vendor_pan_pct: 5,
        duplicate_vendor_bank_pct: 4,
        vendor_without_approval_pct: 25,
        bank_change_unverified_pct: 30,
      },
      expectedExceptionVolume: { min: 1580, max: 1700, description: 'High-risk exceptions' },
    },

    // TS-011: Small vendor master clean
    {
      scenarioId: 'TS-011',
      name: 'Small Clean Vendor Master',
      description: 'Small dataset with all vendors compliant',
      datasetShape: { vendors: 100, pos: 500 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 10, description: 'Minimal exceptions' },
    },

    // TS-012: Vendor master with inactive vendors
    {
      scenarioId: 'TS-012',
      name: 'Vendor Master with Inactive Usage',
      description: '5% inactive vendors used in transactions',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 250, max: 300, description: 'Inactive vendor usage exceptions' },
    },

    // TS-013: Partial compliance vendor master
    {
      scenarioId: 'TS-013',
      name: 'Partial Compliance Vendor Master',
      description: 'Mixed compliance - some vendors compliant, some not',
      datasetShape: { vendors: 1500, pos: 7500 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: false, // GSTIN not required
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 12,
        vendor_without_approval_pct: 8,
      },
      expectedExceptionVolume: { min: 300, max: 350, description: 'Partial compliance exceptions' },
    },

    // TS-014: Vendor master with bank verification issues
    {
      scenarioId: 'TS-014',
      name: 'Bank Verification Issues',
      description: '35% vendors with unverified bank changes',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_bank_verification: true,
      },
      anomalyConfig: {
        bank_change_unverified_pct: 35,
      },
      expectedExceptionVolume: { min: 350, max: 370, description: 'Bank verification exceptions' },
    },

    // TS-015: Vendor master data quality issues
    {
      scenarioId: 'TS-015',
      name: 'Vendor Data Quality Issues',
      description: 'Multiple data quality issues',
      datasetShape: { vendors: 2000, pos: 10000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 10,
        duplicate_vendor_pan_pct: 3,
        duplicate_vendor_bank_pct: 3,
        vendor_without_approval_pct: 15,
      },
      expectedExceptionVolume: { min: 620, max: 700, description: 'Data quality exceptions' },
    },

    // TS-016: Medium-scale vendor master
    {
      scenarioId: 'TS-016',
      name: 'Medium-Scale Vendor Master',
      description: '5k vendors with moderate compliance issues',
      datasetShape: { vendors: 5000, pos: 25000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 7,
        vendor_without_approval_pct: 10,
        bank_change_unverified_pct: 12,
      },
      expectedExceptionVolume: { min: 1450, max: 1600, description: 'Medium-scale exceptions' },
    },

    // TS-017: Vendor master compliance audit
    {
      scenarioId: 'TS-017',
      name: 'Vendor Compliance Audit Scenario',
      description: 'Strict compliance requirements with violations',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        duplicate_vendor_pan_pct: 2,
        vendor_without_approval_pct: 18,
        bank_change_unverified_pct: 15,
      },
      expectedExceptionVolume: { min: 430, max: 480, description: 'Compliance audit exceptions' },
    },

    // TS-018: Vendor onboarding issues
    {
      scenarioId: 'TS-018',
      name: 'Vendor Onboarding Issues',
      description: 'High percentage of vendors without proper approval',
      datasetShape: { vendors: 1500, pos: 7500 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        vendor_without_approval_pct: 30,
        missing_pan_pct: 5,
      },
      expectedExceptionVolume: { min: 525, max: 575, description: 'Onboarding exceptions' },
    },

    // TS-019: Vendor master with mixed issues
    {
      scenarioId: 'TS-019',
      name: 'Vendor Master Mixed Issues',
      description: 'Various vendor master data issues',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
      },
      anomalyConfig: {
        missing_pan_pct: 6,
        duplicate_vendor_pan_pct: 2,
        duplicate_vendor_bank_pct: 2,
        vendor_without_approval_pct: 10,
        inactive_vendor_used_pct: 3,
      },
      expectedExceptionVolume: { min: 230, max: 280, description: 'Mixed vendor issues' },
    },

    // TS-020: Vendor master baseline
    {
      scenarioId: 'TS-020',
      name: 'Vendor Master Baseline',
      description: 'Baseline scenario with standard compliance requirements',
      datasetShape: { vendors: 1000, pos: 5000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: false,
        require_bank_verification: false,
      },
      anomalyConfig: {
        missing_pan_pct: 5,
        vendor_without_approval_pct: 10,
      },
      expectedExceptionVolume: { min: 150, max: 200, description: 'Baseline exceptions' },
    },
  ],
};


