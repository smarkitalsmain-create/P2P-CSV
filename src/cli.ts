#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs";
import { runGeneration } from "./generator/runGeneration";

type CLIOptions = {
  seed?: string;
  vendors?: number;
  pos?: number; // PO count / transaction count
  output: string;

  startYear?: number;
  endYear?: number;

  grnRatio?: number;
  invoiceRatio?: number;
  paymentRatio?: number;

  scenario?: string;
  pack?: string;

  anomalyRate?: number; // 0.0 - 1.0
  enableAnomalies?: boolean; // simple on/off flag if you want it
};

function isNumberLike(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (v.trim() === "") return false;
  return !Number.isNaN(Number(v));
}

function toInt(name: string, v: string | undefined): number {
  if (!v || !isNumberLike(v)) {
    throw new Error(`Invalid ${name}: expected an integer, got "${v ?? ""}"`);
  }
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}: "${v}"`);
  return n;
}

function toFloat(name: string, v: string | undefined): number {
  if (!v || !isNumberLike(v)) {
    throw new Error(`Invalid ${name}: expected a number, got "${v ?? ""}"`);
  }
  const n = parseFloat(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}: "${v}"`);
  return n;
}

function printHelp(): void {
  console.log(`
P2P CSV Generator

Required:
  -s, --seed <seed>           Seed for deterministic generation
  -v, --vendors <count>       Number of vendors
  -p, --pos <count>           Number of purchase orders (PO headers)
      --rows <count>          Alias of --pos

Output:
  -o, --output <dir>          Output directory (default: ./out)
      --out <dir>             Alias of --output

Optional:
      --start-year <yyyy>     Start year (default handled by generator)
      --end-year <yyyy>       End year (default handled by generator)

      --grn-ratio <0-1>       Fraction of POs that get GRNs
      --invoice-ratio <0-1>   Fraction of GRNs/POs that get invoices
      --payment-ratio <0-1>   Fraction of invoices that get payments

      --pack <name>           Data pack (e.g. p2p_core_pack)
      --scenario <name>       Scenario name (if supported)

Anomalies / Truth:
      --enable-anomalies      Turn on anomaly injection (if supported)
      --anomaly-rate <0-1>    Injection intensity (example: 0.02)

Examples:
  npm run gen -- -s 42 -v 500 -p 20000 --out ./out
  npm run gen -- -s 42 -v 500 --rows 20000 --pack p2p_core_pack --enable-anomalies --anomaly-rate 0.02
`.trim());
}

function main() {
  const args = process.argv.slice(2);

  const options: CLIOptions = {
    output: "./out",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);

      case "-s":
      case "--seed":
        options.seed = args[++i];
        break;

      case "-v":
      case "--vendors":
        options.vendors = toInt("vendors", args[++i]);
        break;

      case "-p":
      case "--pos":
        options.pos = toInt("pos", args[++i]);
        break;

      case "--rows":
        options.pos = toInt("rows", args[++i]);
        break;

      case "-o":
      case "--output":
        options.output = args[++i] ?? "./out";
        break;

      case "--out":
        options.output = args[++i] ?? "./out";
        break;

      case "--start-year":
        options.startYear = toInt("start-year", args[++i]);
        break;

      case "--end-year":
        options.endYear = toInt("end-year", args[++i]);
        break;

      case "--grn-ratio":
        options.grnRatio = toFloat("grn-ratio", args[++i]);
        break;

      case "--invoice-ratio":
        options.invoiceRatio = toFloat("invoice-ratio", args[++i]);
        break;

      case "--payment-ratio":
        options.paymentRatio = toFloat("payment-ratio", args[++i]);
        break;

      case "--scenario":
        options.scenario = args[++i];
        break;

      case "--pack":
        options.pack = args[++i];
        break;

      case "--enable-anomalies":
        options.enableAnomalies = true;
        break;

      case "--anomaly-rate":
        options.anomalyRate = toFloat("anomaly-rate", args[++i]);
        break;

      default:
        // ignore unknown flags but fail fast if it looks like an option
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}\n\nRun with --help to see supported options.`);
        }
        break;
    }
  }

  if (!options.seed || !options.vendors || !options.pos) {
    printHelp();
    process.exit(1);
  }

  if (options.anomalyRate !== undefined) {
    if (options.anomalyRate < 0 || options.anomalyRate > 1) {
      throw new Error(`--anomaly-rate must be between 0 and 1. Got ${options.anomalyRate}`);
    }
  }

  if (options.grnRatio !== undefined && (options.grnRatio < 0 || options.grnRatio > 1)) {
    throw new Error(`--grn-ratio must be between 0 and 1. Got ${options.grnRatio}`);
  }
  if (options.invoiceRatio !== undefined && (options.invoiceRatio < 0 || options.invoiceRatio > 1)) {
    throw new Error(`--invoice-ratio must be between 0 and 1. Got ${options.invoiceRatio}`);
  }
  if (options.paymentRatio !== undefined && (options.paymentRatio < 0 || options.paymentRatio > 1)) {
    throw new Error(`--payment-ratio must be between 0 and 1. Got ${options.paymentRatio}`);
  }

  (async () => {
    try {
      const outputDir = path.resolve(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      console.log("Generating P2P data...");

      // IMPORTANT: only pass fields that runGeneration can accept.
      // If runGeneration doesn’t have anomalyRate/enableAnomalies yet, we’ll add it there next.
      const runConfig: any = {
        seed: options.seed,
        vendorCount: options.vendors,
        poCount: options.pos,

        startYear: options.startYear,
        endYear: options.endYear,

        pack: options.pack,
        scenario: options.scenario,

        outputDir,

        grnRatio: options.grnRatio,
        invoiceRatio: options.invoiceRatio,
        paymentRatio: options.paymentRatio,

        // anomaly controls (if supported in runGeneration/anomalyInjection)
        enableAnomalies: options.enableAnomalies,
        anomalyRate: options.anomalyRate,
      };

      const result = await runGeneration(runConfig);

      console.log("\nGeneration complete!");
      console.log(`Run ID: ${result.runId}`);
      console.log(`Output Path: ${result.outputPath}`);
      console.log(`Truth Count: ${result.truthCount}`);

      console.log("\nCounts by file:");
      console.log(`  Vendors: ${result.countsByFile.vendors}`);
      console.log(`  PR Headers: ${result.countsByFile.pr_headers}`);
      console.log(`  PR Lines: ${result.countsByFile.pr_lines}`);
      console.log(`  PO Headers: ${result.countsByFile.po_headers}`);
      console.log(`  GRNs: ${result.countsByFile.grns}`);
      console.log(`  Invoices: ${result.countsByFile.invoices}`);
      console.log(`  Payments: ${result.countsByFile.payments}`);
      console.log(`  Truth Records: ${result.countsByFile.truth}`);
      console.log(`  Manifest: ${result.countsByFile.manifest}`);

      console.log(`\nManifest: ${path.join(result.outputPath, "manifest.json")}`);
    } catch (error: any) {
      console.error("Error:", error?.message ?? error);
      process.exit(1);
    }
  })();
}

if (require.main === module) {
  main();
}
