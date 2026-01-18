import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { z } from 'zod';

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

    anomalyConfig: z
      .union([z.record(z.any()), z.null(), z.undefined()])
      .transform((v) => v ?? {}),
  })
  .refine((d) => d.endYear >= d.startYear, {
    message: 'endYear must be >= startYear',
    path: ['endYear'],
  });

export async function POST(request: NextRequest) {
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

    if (data.pack) {
      const pack = allScenarioPacks.find((p) => p.packName === data.pack);
      if (!pack) {
        return NextResponse.json({ error: `Pack "${data.pack}" not found` }, { status: 400 });
      }
    }

    const runId = randomUUID();
    const outputDir = path.join('/tmp', 'p2p-csv', runId);
    await fs.mkdir(outputDir, { recursive: true });

    const result = await runGeneration({
      seed: data.seed,
      vendorCount: data.vendorCount,
      poCount: data.poCount,
      startYear: data.startYear,
      endYear: data.endYear,
      pack: data.pack,
      anomalyConfig: data.anomalyConfig,
      outputDir,
      chunkSize: 10000,
      grnRatio: 0.8,
      invoiceRatio: 0.9,
      paymentRatio: 0.85,
    });

    return NextResponse.json({
      runId,
      outputPath: result.outputPath,
      countsByFile: result.countsByFile,   // THIS is what UI needs
      truthCount: result.truthCount,       // THIS is what UI needs
      downloadUrl: `/api/download?runId=${runId}`,
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed', message: error?.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
