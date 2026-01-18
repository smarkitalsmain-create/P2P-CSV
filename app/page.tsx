'use client';

import { useState } from 'react';

interface GenerateResponse {
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
  downloadUrl?: string;
  error?: string;
  details?: Array<{ path: string; message: string }>;
}

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let anomaliesJson: any = null;
      if (formData.advanced.trim()) {
        try {
          anomaliesJson = JSON.parse(formData.advanced);
        } catch (parseError) {
          setError('Invalid JSON in advanced anomalies field');
          setLoading(false);
          return;
        }
      }

      const config = {
        poCount: parseInt(formData.rows),
        vendorCount: parseInt(formData.vendors),
        seed: parseInt(formData.seed),
        startYear: new Date(formData.startDate).getFullYear(),
        endYear: new Date(formData.endDate).getFullYear(),
        pack: formData.pack,
        anomalyConfig: anomaliesJson,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (errorData.details && Array.isArray(errorData.details)) {
          const detailsMsg = errorData.details.map((d: any) => `${d.path}: ${d.message}`).join('; ');
          throw new Error(`${errorData.error || 'Validation failed'}: ${detailsMsg}`);
        }
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
                type="number"
                id="seed"
                value={formData.seed}
                onChange={(e) => setFormData({ ...formData, seed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generation Result</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Run ID:</span>
                <span className="ml-2 text-gray-900">{result.runId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Output Path:</span>
                <span className="ml-2 text-gray-900 font-mono text-sm">{result.outputPath}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Truth Count:</span>
                <span className="ml-2 text-gray-900">{result.truthCount}</span>
              </div>
              <div className="mt-4">
                <span className="font-medium text-gray-700">Counts by File:</span>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">Vendors</div>
                    <div className="text-lg font-semibold">{result.countsByFile.vendors}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">PR Headers</div>
                    <div className="text-lg font-semibold">{result.countsByFile.pr_headers}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">PR Lines</div>
                    <div className="text-lg font-semibold">{result.countsByFile.pr_lines}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">PO Headers</div>
                    <div className="text-lg font-semibold">{result.countsByFile.po_headers}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">GRNs</div>
                    <div className="text-lg font-semibold">{result.countsByFile.grns}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">Invoices</div>
                    <div className="text-lg font-semibold">{result.countsByFile.invoices}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">Payments</div>
                    <div className="text-lg font-semibold">{result.countsByFile.payments}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">Truth Records</div>
                    <div className="text-lg font-semibold">{result.countsByFile.truth}</div>
                  </div>
                </div>
              </div>
              {result.downloadUrl && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={result.downloadUrl}
                    download
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
