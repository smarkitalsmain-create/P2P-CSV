import type { GeneratorConfig } from '../generator/baseGenerator';
import type { AnomalyConfig } from '../anomalies/anomalyInjection';

// ============================================================================
// Policy Configuration
// ============================================================================

export interface PolicyConfig {
  // GRN Policies
  goods_require_grn?: boolean; // Goods POs require GRN before invoice
  service_allow_without_grn?: boolean; // Service POs can have invoices without GRN
  
  // PR (Purchase Requisition) Policies
  allow_service_po_without_pr?: boolean; // Allow service POs without PR
  require_pr_for_goods?: boolean; // Require PR for goods POs
  
  // Approval Thresholds
  approval_threshold_amount?: number; // Amount above which approval required
  multi_level_approval_threshold?: number; // Amount for multi-level approval
  executive_approval_threshold?: number; // Amount for executive approval
  
  // Tender/Procurement Policies
  tender_threshold?: number; // Amount above which tender/quotation required
  single_quote_threshold?: number; // Amount below which single quote acceptable
  three_quote_threshold?: number; // Amount requiring 3 quotes
  
  // Vendor Policies
  require_pan_for_vendor?: boolean; // PAN required for vendor registration
  require_gstin_for_vendor?: boolean; // GSTIN required for vendor registration
  require_bank_verification?: boolean; // Bank account verification required
  
  // Payment Policies
  payment_terms_days?: number; // Standard payment terms in days
  early_payment_discount_pct?: number; // Early payment discount percentage
  
  // Invoice Policies
  invoice_matching_required?: boolean; // Require PO-GRN-Invoice matching
  tolerance_amount?: number; // Tolerance for invoice amount variance
  
  // Other Policies
  max_po_amount?: number; // Maximum PO amount allowed
  require_quality_check?: boolean; // Require quality check for goods
  require_delivery_note?: boolean; // Require delivery note
}

// ============================================================================
// Dataset Shape
// ============================================================================

export interface DatasetShape {
  vendors: number;
  prs?: number; // Purchase Requisitions (if applicable)
  pos: number;
  grns?: number; // Optional, can be calculated from ratio
  invoices?: number; // Optional, can be calculated from ratio
  payments?: number; // Optional, can be calculated from ratio
}

// ============================================================================
// Exception Volume Range
// ============================================================================

export interface ExceptionVolumeRange {
  min: number;
  max: number;
  description?: string;
}

// ============================================================================
// Scenario Configuration
// ============================================================================

export interface ScenarioConfig {
  scenarioId: string; // e.g., "TS-001"
  name: string;
  description: string;
  datasetShape: DatasetShape;
  policyConfig: PolicyConfig;
  anomalyConfig: Omit<AnomalyConfig, 'seed'>; // Seed is set at runtime
  expectedExceptionVolume: ExceptionVolumeRange;
  
  // Additional generator config overrides
  generatorOverrides?: Partial<GeneratorConfig>;
}

// ============================================================================
// Scenario Pack
// ============================================================================

export interface ScenarioPack {
  packName: string;
  packDescription: string;
  scenarios: ScenarioConfig[];
}


