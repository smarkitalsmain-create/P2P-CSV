import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { runGeneration } from '../../../src/generator/runGeneration';
import { allScenarioPacks } from '../../../src/scenarios';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const MAX_ROWS = 200000;
const MAX_VENDORS = 50000;

// Accept null and convert to {}.
// Also allow seed as number OR string (better for reproducibility / named seeds).
const GenerateRequestSchema = z
  .object({
    poCount: z.number().int().positive().max(MAX_ROWS, `Maximum ${MAX_ROWS} rows allowed`),
    vendorCount: z.number().int().positive().max(MAX_VENDORS, `Maximum ${MAX_VENDORS} vendors allowed`),
    seed: z.union([z.number().int(), z.string().min(1)]),

    startYear: z.number().int().min(2000).max(2100),
    endYear: z.number().int().min(2000).max(2100),

    pack: z.string().optional(),

    // key fix: allow null, default to {}
    anomalyConfig: z
      .union([z.record(z.any()), z.null(), z.undefined()])
      .transform((v) => v ?? {})
      .optional(),
  })
  .refine((data) => data.endYear >= data.startYear, {
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

    // Validate pack if provided
    if (data.pack) {
      const pack = allScenarioPacks.find((p) => p.packName === data.pack);
      if (!pack) {
        return NextResponse.json({ error: `Pack "${data.pack}" not found` }, { status: 400 });
      }
    }

    // Use runId consistently
    const runId = randomUUID();
    const outputDir = path.join(process.cwd(), 'out', runId);

    const runConfig = {
      seed: data.seed,
      vendorCount: data.vendorCount,
      poCount: data.poCount,
      startYear: data.startYear,
      endYear: data.endYear,
      pack: data.pack,
      anomalyConfig: data.anomalyConfig ?? {}, // always object now
      outputDir,

      chunkSize: 10000,
      grnRatio: 0.8,
      invoiceRatio: 0.9,
      paymentRatio: 0.85,
    };

    const result = await runGeneration(runConfig);

    // IMPORTANT: download should use the folder name (runId we created)
    const downloadUrl = `/api/download?runId=${runId}`;

    return NextResponse.json({
      runId, // consistent with output folder + download
      outputPath: result.outputPath,
      countsByFile: result.countsByFile,
      truthCount: result.truthCount,
      downloadUrl,
    });
  } catch (error: any) {
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
