import * as path from "path";
import * as fs from "fs";
import { randomUUID } from "crypto";
import seedrandom from "seedrandom";
import { generateChunkedData } from "./chunkedGenerator";
import { generateVendors } from "./baseGenerator";
import { CSVWriter } from "../writer/csvWriter";
import { injectAnomalies } from "../anomalies/anomalyInjection";
import { generateManifest, writeManifestSync } from "./manifest";
import { allScenarioPacks, getScenarioById } from "../scenarios";
import type { GeneratorConfig } from "./baseGenerator";
import type { AnomalyConfig } from "../anomalies/anomalyInjection";
import type { PolicyConfig } from "../scenarios/types";

export interface RunGenerationConfig {
  seed: number | string;
  vendorCount: number;
  poCount: number;

  startYear?: number;
  endYear?: number;

  pack?: string;
  scenario?: string;

  anomalyConfig?: Partial<AnomalyConfig>;

  outputDir?: string;
  chunkSize?: number;

  grnRatio?: number;
  invoiceRatio?: number;
  paymentRatio?: number;
}

export interface RunGenerationResult {
  runId: string;
  outputPath: string;
  countsByFile: {
    vendors: number;
    pr_headers: number;
    pr_lines: number;
    po_headers: number;
    grns: number;
    invoices: number;
    payments: number;
    truth: number;
    manifest: number;
  };
  truthCount: number;
}

export async function runGeneration(config: RunGenerationConfig): Promise<RunGenerationResult> {
  const runId = config.outputDir?.split(path.sep).pop() || randomUUID();

  const outputDir = config.outputDir || path.join(process.cwd(), "out", runId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let packName: string | undefined = config.pack;
  let policyConfig: PolicyConfig | undefined;
  let anomalyConfig: AnomalyConfig | undefined;

  // Scenario defaults
  if (config.scenario) {
    const scenarioResult = getScenarioById(config.scenario);
    if (scenarioResult) {
      packName = scenarioResult.pack.packName;
      policyConfig = scenarioResult.scenario.policyConfig;

      anomalyConfig = {
        seed: config.seed,
        ...(scenarioResult.scenario.anomalyConfig || {}),
        ...(config.anomalyConfig || {}),
      };
    }
  }

  // Pack defaults
  if (!config.scenario && config.pack) {
    const pack = allScenarioPacks.find((p) => p.packName === config.pack);
    if (pack && pack.scenarios.length > 0) {
      const firstScenario = pack.scenarios[0];
      policyConfig = firstScenario.policyConfig;

      if (firstScenario.anomalyConfig || config.anomalyConfig) {
        anomalyConfig = {
          seed: config.seed,
          ...(firstScenario.anomalyConfig || {}),
          ...(config.anomalyConfig || {}),
        };
      }
    }
  }

  // Allow anomalies even without pack/scenario
  if (!anomalyConfig && config.anomalyConfig) {
    anomalyConfig = {
      seed: config.seed,
      ...(config.anomalyConfig || {}),
    };
  }

  const currentYear = new Date().getFullYear();
  const generatorConfig: GeneratorConfig = {
    seed: config.seed,
    vendorCount: config.vendorCount,
    poCount: config.poCount,
    startYear: config.startYear ?? currentYear - 1,
    endYear: config.endYear ?? currentYear,
    chunkSize: config.chunkSize ?? 10000,
    grnRatio: config.grnRatio ?? 0.8,
    invoiceRatio: config.invoiceRatio ?? 0.9,
    paymentRatio: config.paymentRatio ?? 0.85,
  };

  const csvWriter = new CSVWriter({
    outputDir,
    flushPerChunk: true,
  });

  const allData = {
    vendors: [] as any[],
    prHeaders: [] as any[],
    prLines: [] as any[],
    purchaseOrders: [] as any[],
    grns: [] as any[],
    invoices: [] as any[],
    payments: [] as any[],
  };

  const allTruthRecords: any[] = [];

  // Vendors upfront
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  allData.vendors = generateVendors(config.vendorCount, random, generatorConfig.startYear);
  csvWriter.writeVendors(allData.vendors);

  // Chunk generation
  for (const chunk of generateChunkedData(generatorConfig)) {
    csvWriter.writePRHeaders(chunk.prHeaders);
    csvWriter.writePRLines(chunk.prLines);
    csvWriter.writePOs(chunk.purchaseOrders);
    csvWriter.writeGRNs(chunk.grns);
    csvWriter.writeInvoices(chunk.invoices);
    csvWriter.writePayments(chunk.payments);

    allData.prHeaders.push(...chunk.prHeaders);
    allData.prLines.push(...chunk.prLines);
    allData.purchaseOrders.push(...chunk.purchaseOrders);
    allData.grns.push(...chunk.grns);
    allData.invoices.push(...chunk.invoices);
    allData.payments.push(...chunk.payments);
  }

  // Inject anomalies (note: this mutates arrays, but does NOT rewrite CSVs)
  if (anomalyConfig) {
    const injected = injectAnomalies(
      {
        vendors: allData.vendors,
        purchaseOrders: allData.purchaseOrders,
        grns: allData.grns,
        invoices: allData.invoices,
        payments: allData.payments,
      },
      anomalyConfig
    );

    allTruthRecords.push(...(injected.truthRecords || []));

    allData.vendors = injected.vendors;
    allData.purchaseOrders = injected.purchaseOrders;
    allData.invoices = injected.invoices;
    allData.payments = injected.payments;
  }

  if (allTruthRecords.length > 0) {
    csvWriter.writeTruthRecords(allTruthRecords);
  }

  const manifest = generateManifest(
    { ...allData, truthRecords: allTruthRecords },
    generatorConfig,
    packName,
    anomalyConfig,
    policyConfig
  );
  writeManifestSync(manifest, path.join(outputDir, "manifest.json"));

  // ✅ THIS IS THE IMPORTANT PART FOR VERCEL
  await csvWriter.close();

  const countsByFile = {
    vendors: allData.vendors.length,
    pr_headers: allData.prHeaders.length,
    pr_lines: allData.prLines.length,
    po_headers: allData.purchaseOrders.length,
    grns: allData.grns.length,
    invoices: allData.invoices.length,
    payments: allData.payments.length,
    truth: allTruthRecords.length,
    manifest: 1,
  };

  return {
    runId,
    outputPath: outputDir,
    countsByFile,
    truthCount: allTruthRecords.length,
  };
}
