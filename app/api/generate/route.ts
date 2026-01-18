// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import JSZip from 'jszip';
import { promises as fs } from 'fs';

import { runGeneration } from '../../../src/generator/runGeneration';
import { allScenarioPacks } from '../../../src/scenarios';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_ROWS = 200000;
const MAX_VENDORS = 50000;

const GenerateRequestSchema = z
  .object({
    poCount: z.number().int().positive().max(MAX_ROWS, `Maximum ${MAX_ROWS} rows allowed`),
    vendorCount: z.number().int().positive().max(MAX_VENDORS, `Maximum ${MAX_VENDORS} vendors allowed`),
    seed: z.union([z.number().int(), z.string().min(1)]),

    startYear: z.number().int().min(2000).max(2100),
    endYear: z.number().int().min(2000).max(2100),

    pack: z.string().optional(),

    // allow null and normalize to {}
    anomalyConfig: z
      .union([z.record(z.any()), z.null(), z.undefined()])
      .transform((v) => v ?? {})
      .optional(),
  })
  .refine((data) => data.endYear >= data.startYear, {
    message: 'endYear must be >= startYear',
    path: ['endYear'],
  });

async function safeRmDir(dirPath: string) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let tmpRunDir: string | null = null;

  try {
    const body = await request.json();
    const parsed = GenerateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate pack if provided (must match scenario packs)
    if (data.pack) {
      const pack = allScenarioPacks.find((p) => p.packName === data.pack);
      if (!pack) {
        return NextResponse.json({ error: `Pack "${data.pack}" not found` }, { status: 400 });
      }
    }

    // Vercel/serverless safe output directory: /tmp/...
    const runId = randomUUID();
    tmpRunDir = path.join(os.tmpdir(), 'p2p-csv-generator', runId);
    await fs.mkdir(tmpRunDir, { recursive: true });

    const runConfig = {
      seed: data.seed,
      vendorCount: data.vendorCount,
      poCount: data.poCount,
      startYear: data.startYear,
      endYear: data.endYear,
      pack: data.pack,
      anomalyConfig: data.anomalyConfig ?? {},
      outputDir: tmpRunDir,

      chunkSize: 10000,
      grnRatio: 0.8,
      invoiceRatio: 0.9,
      paymentRatio: 0.85,
    };

    const result = await runGeneration(runConfig);

    // Zip everything generated into memory
    const zip = new JSZip();

    const entries = await fs.readdir(tmpRunDir);
    for (const name of entries) {
      const full = path.join(tmpRunDir, name);
      const stat = await fs.stat(full);

      // include only files (csv/json/etc). skip folders if any
      if (!stat.isFile()) continue;

      const buf = await fs.readFile(full);
      zip.file(name, buf);
    }

    // If generator didn’t create manifest.json, add a minimal one
    const manifestPath = path.join(tmpRunDir, 'manifest.json');
    if (!(await fileExists(manifestPath))) {
      zip.file(
        'manifest.json',
        JSON.stringify(
          {
            runId,
            createdAt: new Date().toISOString(),
            countsByFile: result.countsByFile,
            truthCount: result.truthCount,
            pack: data.pack ?? null,
            vendorCount: data.vendorCount,
            poCount: data.poCount,
            startYear: data.startYear,
            endYear: data.endYear,
          },
          null,
          2
        )
      );
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // cleanup tmp dir
    await safeRmDir(tmpRunDir);
    tmpRunDir = null;

    // Return ZIP bytes (SUCCESS PATH)
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="p2p-data-${runId}.zip"`,

        // metadata headers for your UI
        'x-run-id': runId,
        'x-truth-count': String(result.truthCount ?? 0),
        'x-counts': encodeURIComponent(JSON.stringify(result.countsByFile ?? {})),
      },
    });
  } catch (error: any) {
    // cleanup tmp dir on failure
    if (tmpRunDir) await safeRmDir(tmpRunDir);

    console.error('Generation error:', error);

    return NextResponse.json(
      {
        error: 'Generation failed',
        message: error?.message || 'Unknown error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    );
  }
}
