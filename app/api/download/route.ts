import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

export const runtime = 'nodejs';

/**
 * GET /api/download?runId=...
 * Zips the output directory for a given runId and streams it as application/zip
 */
export async function GET(request: NextRequest) {
  let archive: any = null;

  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'Missing required parameter: runId' },
        { status: 400 }
      );
    }

    // Validate runId to prevent path traversal attacks
    // Only allow alphanumeric characters, hyphens, and underscores (UUID format)
    if (!/^[a-zA-Z0-9\-_]+$/.test(runId)) {
      return NextResponse.json(
        { error: 'Invalid runId format' },
        { status: 400 }
      );
    }

    // Construct output directory path
    const outputDir = path.join(process.cwd(), 'out', runId);

    // Check if directory exists
    if (!fs.existsSync(outputDir)) {
      return NextResponse.json(
        { error: `Run ID "${runId}" not found` },
        { status: 404 }
      );
    }

    // Check if it's a directory
    const stats = fs.statSync(outputDir);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: `Run ID "${runId}" is not a directory` },
        { status: 400 }
      );
    }

    // Read all files in the directory
    const files = fs.readdirSync(outputDir);
    if (files.length === 0) {
      return NextResponse.json(
        { error: `Run ID "${runId}" has no files to download` },
        { status: 404 }
      );
    }

    // Import archiver dynamically
    const archiverModule = await import('archiver');
    const Archiver = archiverModule.default;

    // Create a zip archive
    archive = Archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    // Convert Node.js stream to Web Stream
    const stream = new ReadableStream({
      start(controller) {
        // Handle archive errors
        archive.on('error', (err: Error) => {
          controller.error(err);
        });

        // When archive is finalized, close the stream
        archive.on('end', () => {
          controller.close();
        });

        // When data is available, enqueue it
        archive.on('data', (chunk: Buffer) => {
          controller.enqueue(chunk);
        });

        // Add all files from the directory
        for (const file of files) {
          const filePath = path.join(outputDir, file);
          const fileStats = fs.statSync(filePath);

          if (fileStats.isFile()) {
            archive.file(filePath, { name: file });
          } else if (fileStats.isDirectory()) {
            archive.directory(filePath, file);
          }
        }

        // Finalize the archive (triggers the stream)
        archive.finalize();
      },
      cancel() {
        // Clean up if stream is cancelled
        if (archive) {
          archive.abort();
        }
      },
    });

    // Return streaming response
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="p2p-data-${runId}.zip"`,
      },
    });
  } catch (error: any) {
    // Clean up archive on error
    if (archive) {
      archive.abort();
    }
    
    console.error('Download error:', error);
    return NextResponse.json(
      {
        error: 'Download failed',
        message: error.message || 'Unknown error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
