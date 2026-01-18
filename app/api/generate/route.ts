import { NextRequest } from 'next/server';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import JSZip from 'jszip';
import { z } from 'zod';
import { runGeneration } from '../../../src/generator/runGeneration';
import { allScenarioPacks } from '../../../src/scenarios';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_ROWS = 200000;
const MAX_VENDORS = 50000;

const GenerateRequestSchema = z
  .object({
    poCount: z.number().int().positive().max(MAX_ROWS),
    vendorCount: z.number().int().positive().max(MAX_VENDORS),
    seed: z.union([z.number().int(), z.string().min(1)]),
    startYear: z.number().int().min(2000).max(2100),
    endYear: z.number().int().min(2000).max(2100),
    pack: z.string().optional(),
    anomalyConfig: z.union([z.record(z.any()), z.null(), z.undefined()]).transform(v => v ?? {}).optional(),
  })
  .refine((d) => d.endYear >= d.startYear, { message: 'endYear must be >= startYear', path: ['endYear'] });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GenerateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: parsed.error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      );
    }

    const data = parsed.data;

    if (data.pack) {
      const pack = allScenarioPacks.find(p => p.packName === data.pack);
      if (!pack) {
        return new Response(JSON.stringify({ error: `Pack "${data.pack}" not found` }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
    }

    const runId = randomUUID();

    // ✅ IMPORTANT: use /tmp on Vercel
    const outputDir = path.join('/tmp', 'p2p-out', runId);
    await fs.mkdir(outputDir, { recursive: true });

    const runConfig = {
      seed: data.seed,
      vendorCount: data.vendorCount,
      poCount: data.poCount,
      startYear: data.startYear,
      endYear: data.endYear,
      pack: data.pack,
      anomalyConfig: data.anomalyConfig ?? {},
      outputDir,
      chunkSize: 10000,
      grnRatio: 0.8,
      invoiceRatio: 0.9,
      paymentRatio: 0.85,
    };

    const result = await runGeneration(runConfig);

    // Build ZIP from generated files
    const zip = new JSZip();

    // If you have exact file names in result, use them.
    // Otherwise zip everything that exists in outputDir:
    const files = await fs.readdir(outputDir);

    for (const f of files) {
      const full = path.join(outputDir, f);
      const buf = await fs.readFile(full);
      zip.file(f, buf);
    }

    if (files.length <= 1) {
      // This is the exact problem you’re seeing: only manifest.json exists
      return new Response(
        JSON.stringify({
          error: 'Generation produced too few files',
          message: `Only found: ${files.join(', ') || '(none)'}. Check runGeneration outputDir + file writing.`,
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="p2p-data-${runId}.zip"`,
        'x-run-id': runId,
        'x-truth-count': String(result.truthCount ?? 0),
        // optional: you can add counts header too if you want
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Generation failed', message: err?.message || 'Unknown error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
