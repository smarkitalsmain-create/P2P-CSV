export * from './types';
export { vendorMasterPack } from './vendorMasterPack';
export { procurementPack } from './procurementPack';
export { prControlsPack } from './prControlsPack';
export { poControlsPack } from './poControlsPack';
export { grnControlsPack } from './grnControlsPack';
export { invoicePack } from './invoicePack';
export { paymentPack } from './paymentPack';
export { fraudSodPack } from './fraudSodPack';

// ============================================================================
// All Scenario Packs
// ============================================================================

import { vendorMasterPack } from './vendorMasterPack';
import { procurementPack } from './procurementPack';
import { prControlsPack } from './prControlsPack';
import { poControlsPack } from './poControlsPack';
import { grnControlsPack } from './grnControlsPack';
import { invoicePack } from './invoicePack';
import { paymentPack } from './paymentPack';
import { fraudSodPack } from './fraudSodPack';
import type { ScenarioPack } from './types';

export const allScenarioPacks: ScenarioPack[] = [
  vendorMasterPack,
  procurementPack,
  prControlsPack,
  poControlsPack,
  grnControlsPack,
  invoicePack,
  paymentPack,
  fraudSodPack,
];

/**
 * Get scenario by ID from all packs
 */
export function getScenarioById(scenarioId: string) {
  for (const pack of allScenarioPacks) {
    const scenario = pack.scenarios.find(s => s.scenarioId === scenarioId);
    if (scenario) {
      return { pack, scenario };
    }
  }
  return null;
}

/**
 * Get all scenarios from a specific pack
 */
export function getScenariosByPackName(packName: string) {
  const pack = allScenarioPacks.find(p => p.packName === packName);
  return pack ? pack.scenarios : [];
}

/**
 * Get all scenario IDs
 */
export function getAllScenarioIds(): string[] {
  return allScenarioPacks.flatMap(pack => pack.scenarios.map(s => s.scenarioId));
}


