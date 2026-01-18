'use client';

import { useMemo, useState } from 'react';

type GenerateResponse = {
  runId?: string;
  outputPath?: string;
  countsByFile?: {
    vendors?: number;
    pr_headers?: number;
    pr_lines?: number;
    po_headers?: number;
    grns?: number;
    invoices?: number;
    payments?: number;
    truth?: number;
    manifest?: number;
  };
  truthCount?: number;
  downloadUrl?: string;

  // error payloads (both validation + runtime)
  error?: string;
  message?: string;
  details?: Array<{ path: string; message: string }>;
};

const KNOWN_PACKS = [
  { value: 'vendor_master_pack', label: 'Vendor Master Pack' },
  { value: 'procurement_pack', label: 'Procurement Pack' },
  { value: 'pr_controls_pack', label: 'PR Controls Pack' },
  { value: 'po_controls_pack', label: 'PO Controls Pack' },
  { value: 'grn_controls_pack', label: 'GRN Controls Pack' },
  { value: 'invoice_pack', label: 'Invoice Pack' },
  { value: 'payment_pack', label: 'Payment Pack' },
  { value: 'fraud_sod_pack', label: 'Fraud & SOD Pack' },
];

function safeNum(n: unknown, fallback = 0) {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function parseOptionalJson(input: string): { ok: true; value: any } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: true, value: null };
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed === null) return { ok: true, value: null };
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'Advanced JSON must be an object like {"missing_pan_pct": 10}' };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: 'Invalid JSON in Advanced anomalies field' };
  }
}

function yyyyToIntFromDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

export default function Home() {
  const [formData, setFormData] = useState({
    rows: '1000',
    vendors: '100',
    seed: '12345',
    startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    pack: 'vendor_master_pack',
    advanced: '',
  });

  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [uiError, setUiError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = result?.countsByFile;
    return {
      vendors: safeNum(c?.vendors),
      pr_headers: safeNum(c?.pr_headers),
      pr_lines: safeNum(c?.pr_lines),
      po_headers: safeNum(c?.po_headers),
      grns: safeNum(c?.grns),
      invoices: safeNum(c?.invoices),
      payments: safeNum(c?.payments),
      truth: safeNum(c?.truth),
      manifest: safeNum(c?.manifest),
    };
  }, [result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUiError(null);
    setResult(null);

    // validate advanced JSON
    const parsedAdv = parseOptionalJson(formData.advanced);
    if (!parsedAdv.ok) {
      setUiError(parsedAdv.error);
      setLoading(false);
      return;
    }

    // allow seed to be number or string
    const seedTrimmed = formData.seed.trim();
    const seedAsNumber = Number(seedTrimmed);
    const seed: number | string =
      seedTrimmed !== '' && Number.isFinite(seedAsNumber) ? seedAsNumber : seedTrimmed;

    const payload = {
      poCount: Number(formData.rows),
      vendorCount: Number(formData.vendors),
      seed,
      startYear: yyyyToIntFromDate(formData.startDate),
      endYear: yyyyToIntFromDate(formData.endDate),
      pack: formData.pack,
      anomalyConfig: parsedAdv.value, // can be null
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: GenerateResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        // build a readable error message from API payload
        const detailsMsg =
          data.details?.length
            ? data.details.map((d) => `${d.path}: ${d.message}`).join('; ')
            : null;

        const msg =
          detailsMsg ||
          data.message ||
          data.error ||
          `Request failed (HTTP ${response.status})`;

        setUiError(msg);
        setResult(data);
        return;
      }

      // Success
      setResult(data);
    } catch (err) {
      setUiError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const hasCounts = !!result?.countsByFile;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">P2P CSV Generator</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="rows" className="block text-sm font-medium text-gray-700 mb-1">
                Rows (PO Count)
              </label>
              <input
                type="number"
                id="rows"
                value={formData.rows}
                onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min="1"
              />
            </div>

            <div>
              <label htmlFor="vendors" className="block text-sm font-medium text-gray-700 mb-1">
                Vendors
              </label>
              <input
                type="number"
                id="vendors"
                value={formData.vendors}
                onChange={(e) => setFormData({ ...formData, vendors: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                min="1"
              />
            </div>

            <div>
              <label htmlFor="seed" className="block text-sm font-medium text-gray-700 mb-1">
                Seed
              </label>
              <input
                type="text"
                id="seed"
                value={formData.seed}
                onChange={(e) => setFormData({ ...formData, seed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="12345 or any text"
              />
              <p className="text-xs text-gray-500 mt-1">
                Same seed gives the same data. Can be a number or a word.
              </p>
            </div>

            <div>
              <label htmlFor="pack" className="block text-sm font-medium text-gray-700 mb-1">
                Pack
              </label>
              <select
                id="pack"
                value={formData.pack}
                onChange={(e) => setFormData({ ...formData, pack: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {KNOWN_PACKS.map((pack) => (
                  <option key={pack.value} value={pack.value}>
                    {pack.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="advanced" className="block text-sm font-medium text-gray-700 mb-1">
              Advanced: Anomalies JSON (optional)
            </label>
            <textarea
              id="advanced"
              value={formData.advanced}
              onChange={(e) => setFormData({ ...formData, advanced: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder='{"missing_pan_pct": 10, "duplicate_vendor_pan_pct": 5}'
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for a clean dataset. Use percentages to inject errors for BizPulse testing.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {uiError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            <p className="font-medium">Error</p>
            <p>{uiError}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Result</h2>

            {/* If API returned an error payload but we still have a JSON body */}
            {(result.error || result.message) && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-md p-3 mb-4">
                <div className="font-medium">Server message</div>
                <div className="text-sm">
                  {result.message || result.error}
                  {result.details?.length ? (
                    <div className="mt-2">
                      {result.details.map((d, idx) => (
                        <div key={idx} className="text-xs font-mono">
                          {d.path}: {d.message}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Run ID:</span>
                <span className="ml-2 text-gray-900">{result.runId || '-'}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Output Path:</span>
                <span className="ml-2 text-gray-900 font-mono text-sm">{result.outputPath || '-'}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Truth Count:</span>
                <span className="ml-2 text-gray-900">{safeNum(result.truthCount)}</span>
              </div>

              <div className="mt-4">
                <span className="font-medium text-gray-700">Counts by File:</span>

                {!hasCounts ? (
                  <div className="mt-2 text-sm text-gray-600">
                    Counts not available (generation likely failed).
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Vendors</div>
                      <div className="text-lg font-semibold">{counts.vendors}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">PR Headers</div>
                      <div className="text-lg font-semibold">{counts.pr_headers}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">PR Lines</div>
                      <div className="text-lg font-semibold">{counts.pr_lines}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">PO Headers</div>
                      <div className="text-lg font-semibold">{counts.po_headers}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">GRNs</div>
                      <div className="text-lg font-semibold">{counts.grns}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Invoices</div>
                      <div className="text-lg font-semibold">{counts.invoices}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Payments</div>
                      <div className="text-lg font-semibold">{counts.payments}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Truth Records</div>
                      <div className="text-lg font-semibold">{counts.truth}</div>
                    </div>
                  </div>
                )}
              </div>

              {result.downloadUrl ? (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={result.downloadUrl}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download ZIP
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
