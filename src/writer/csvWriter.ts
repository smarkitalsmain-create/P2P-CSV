import * as fs from "fs";
import * as path from "path";
import type { WriteStream } from "fs";
import { finished } from "stream/promises";

type CSVWriterOptions = {
  outputDir: string;
  flushPerChunk?: boolean;
};

export class CSVWriter {
  private outputDir: string;
  private flushPerChunk: boolean;

  // Keep all streams here so close() can await them
  private streams: Record<string, WriteStream> = {};

  constructor(opts: CSVWriterOptions) {
    this.outputDir = opts.outputDir;
    this.flushPerChunk = !!opts.flushPerChunk;
  }

  private getStream(fileName: string): WriteStream {
    const fullPath = path.join(this.outputDir, fileName);

    if (this.streams[fileName]) return this.streams[fileName];

    // Ensure dir exists (extra safety)
    fs.mkdirSync(this.outputDir, { recursive: true });

    const stream = fs.createWriteStream(fullPath, { encoding: "utf8" });
    this.streams[fileName] = stream;
    return stream;
  }

  private writeRows(fileName: string, rows: Array<Record<string, any>>) {
    if (!rows || rows.length === 0) return;

    const stream = this.getStream(fileName);

    // If file just created, write header once
    // NOTE: if you already write headers elsewhere, remove this section.
    // This assumes rows are objects with same keys.
    const isNewFile = stream.bytesWritten === 0;
    if (isNewFile) {
      const header = Object.keys(rows[0]).join(",") + "\n";
      stream.write(header);
    }

    for (const row of rows) {
      const line =
        Object.values(row)
          .map((v) => {
            const s = v === null || v === undefined ? "" : String(v);
            // basic CSV escaping
            const escaped = s.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",") + "\n";

      stream.write(line);
    }

    // flushPerChunk does NOT “await” anything, it just helps backpressure
    // Real guarantee is close() awaiting finished()
  }

  // ---- Public writers (match your filenames) ----

  writeVendors(rows: any[]) {
    this.writeRows("vendors.csv", rows);
  }

  writePRHeaders(rows: any[]) {
    this.writeRows("pr_headers.csv", rows);
  }

  writePRLines(rows: any[]) {
    this.writeRows("pr_lines.csv", rows);
  }

  writePOs(rows: any[]) {
    this.writeRows("purchase_orders.csv", rows);
  }

  writeGRNs(rows: any[]) {
    this.writeRows("grns.csv", rows);
  }

  writeInvoices(rows: any[]) {
    this.writeRows("invoices.csv", rows);
  }

  writePayments(rows: any[]) {
    this.writeRows("payments.csv", rows);
  }

  writeTruthRecords(rows: any[]) {
    this.writeRows("truth.csv", rows);
  }

  // ✅ THIS is the key fix for Vercel
  async close(): Promise<void> {
    const streams = Object.values(this.streams);

    // End all streams
    for (const s of streams) {
      try {
        s.end();
      } catch {
        // ignore
      }
    }

    // Wait until all streams are fully flushed to disk
    await Promise.all(
      streams.map(async (s) => {
        try {
          await finished(s);
        } catch {
          // ignore
        }
      })
    );
  }
}
