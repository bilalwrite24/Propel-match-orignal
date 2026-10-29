import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Database,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  autoDetectColumnMapping,
  ColumnMapping,
  parseCsvFile,
  processCsvInChunks,
  STANDARD_FIELDS,
  CsvProcessingSummary,
} from '../utils/csvParser';
import { IcpCampaign, Lead } from '../types';
import { NavTab } from './Sidebar';

interface CsvImportViewProps {
  activeCampaign: IcpCampaign;
  existingLeads: Lead[];
  onImportCompleted: (newLeads: Lead[], summary: CsvProcessingSummary) => void;
  onNavigate: (tab: NavTab) => void;
}

export const CsvImportView: React.FC<CsvImportViewProps> = ({
  activeCampaign,
  existingLeads,
  onImportCompleted,
  onNavigate,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [mapping, setMapping] = useState<ColumnMapping>({
    fullName: '',
    jobTitle: '',
    companyName: '',
    companyDomain: '',
    email: '',
    industry: '',
    companySize: '',
    location: '',
    country: '',
    linkedinUrl: '',
    phone: '',
    technologies: '',
  });

  const [step, setStep] = useState<'upload' | 'mapping' | 'processing' | 'completed'>('upload');
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<CsvProcessingSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (selectedFile: File) => {
    setErrorMsg(null);
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setErrorMsg('Please select a valid .csv file format.');
      return;
    }

    try {
      const parsed = await parseCsvFile(selectedFile);
      setFile(selectedFile);
      setHeaders(parsed.headers);
      setSampleRows(parsed.sampleRows);
      setTotalRows(parsed.totalRows);

      // Auto-detect columns
      const autoMap = autoDetectColumnMapping(parsed.headers);
      setMapping(autoMap);
      setStep('mapping');
    } catch (err: any) {
      console.error('CSV parse error:', err);
      setErrorMsg(err.message || 'Failed to parse CSV file. Ensure it has a valid header row.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateSampleCsv = () => {
    const sampleCsvContent = `Contact Name,Job Title,Company,Website,Work Email,Industry,Headcount,City,Country,Technologies,LinkedIn
David Miller,Chief Information Officer,Vanguard Cyber,vanguardcyber.com,d.miller@vanguardcyber.com,Cybersecurity,450,Boston,United States,"AWS, Kubernetes, SOC2, Terraform",https://linkedin.com/in/dmiller-it
Alicia Thorne,VP of Cloud Infrastructure,Axiom Platforms,axiomp.io,alicia@axiomp.io,Software & SaaS,720,Seattle,United States,"GCP, Docker, Terraform",https://linkedin.com/in/alicia-thorne
James K. Sterling,IT Operations Director,Global Core Services,globalcore.com,jsterling@globalcore.com,IT Services & Consulting,1200,Chicago,United States,"Azure, VMware, Cisco",https://linkedin.com/in/james-sterling-it
Samantha Cruz,Chief Technology Officer,Helios Cloud,helioscloud.net,s.cruz@helioscloud.net,Cloud Computing,310,San Francisco,United States,"Kubernetes, AWS, Go",https://linkedin.com/in/samanthacruz
Tyler Vance,Freelance Marketing Consultant,Self-Employed,tylervance.org,,Marketing,1,Denver,United States,"Wordpress",
Brandon Lee,IT Director,Apex Logistics,apexlogistics.com,blee@apexlogistics.com,Retail & Logistics,600,Atlanta,United States,"SAP, Azure",https://linkedin.com/in/brandonlee
Marcus Vance,Chief Information Officer,CloudShield Networks,cloudshield.io,m.vance@cloudshield.io,Cybersecurity,350,Boston,United States,"AWS, Kubernetes",https://linkedin.com/in/marcus-vance
Rachel Goldstein,VP of Information Technology,Symphony FinTech,symphonyfin.io,rachel.g@symphonyfin.io,Enterprise Software,890,New York,United States,"AWS, Datadog, Snowflake",https://linkedin.com/in/rachel-goldstein
Kevin Patel,IT Infrastructure Lead,OmniSphere Technologies,omnisphere.tech,kpatel@omnisphere.tech,Software & SaaS,240,Austin,United States,"Kubernetes, Terraform",https://linkedin.com/in/kevin-patel`;

    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const sampleFile = new File([blob], 'propelmatch_b2b_sample_leads.csv', { type: 'text/csv' });
    handleFileSelected(sampleFile);
  };

  const handleStartProcessing = async () => {
    if (!file) return;

    if (!mapping.fullName || !mapping.jobTitle || !mapping.companyName) {
      setErrorMsg('Please map the required fields: Full Name, Job Title, and Company Name.');
      return;
    }

    setStep('processing');
    setErrorMsg(null);

    try {
      const summaryResult = await processCsvInChunks({
        file,
        mapping,
        campaign: activeCampaign,
        existingLeads,
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
      });

      setSummary(summaryResult);
      onImportCompleted(summaryResult.importedLeads, summaryResult);
      setStep('completed');
    } catch (err: any) {
      console.error('CSV processing failed:', err);
      setErrorMsg(err.message || 'Error occurred while processing CSV rows.');
      setStep('mapping');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>High-Volume Non-Blocking CSV Engine</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            CSV Lead Import & Deterministic Qualification
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload CSV files with thousands of contacts. Automatically maps columns, detects duplicates, and qualifies leads against your active campaign ({activeCampaign.name}).
          </p>
        </div>

        <button
          onClick={handleGenerateSampleCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs border border-indigo-200 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Enterprise B2B Sample CSV</span>
        </button>
      </div>

      {/* Step 1: Upload Dropzone */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-12 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">
              Drag & Drop your CSV file here, or click to browse
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Supports standard CSV format with comma or semicolon delimiters. Processes thousands of rows efficiently using non-blocking asynchronous streaming chunks.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Column Mapping & CSV Preview */}
      {step === 'mapping' && file && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 2 of 3</span>
              <h4 className="text-base font-bold text-slate-900">Map CSV Columns to Lead Fields</h4>
              <p className="text-xs text-slate-500">
                File: <strong className="text-slate-800">{file.name}</strong> • Total Rows: <strong className="text-slate-800">{totalRows}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep('upload')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Change File
              </button>
              <button
                onClick={handleStartProcessing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <span>Qualify & Process {totalRows} Rows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_FIELDS.map((field) => (
              <div key={field.key} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  {mapping[field.key] ? (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Mapped
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Optional</span>
                  )}
                </div>

                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Do not import --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      CSV: {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* CSV Preview Table */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              File Preview (First 5 Rows)
            </h5>
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-48">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleRows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {headers.map((h) => (
                        <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-700 max-w-xs truncate">
                          {row[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Processing Progress */}
      {step === 'processing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">
            Processing & Scoring Leads in Chunks...
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Parsing rows, checking for duplicates, normalizing firmographics, and calculating explainable fit scores against {activeCampaign.name}.
          </p>

          <div className="w-full max-w-md mx-auto bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-200"
              style={{
                width: `${totalRows > 0 ? Math.min(100, Math.round((progress.current / totalRows) * 100)) : 10}%`,
              }}
            />
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Processed {progress.current} of {totalRows} records
          </div>
        </div>
      )}

      {/* Step 4: Completed Summary */}
      {step === 'completed' && summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">CSV Processing Complete!</h4>
              <p className="text-xs text-slate-500">
                Processed {summary.totalParsed} raw records and qualified them against {activeCampaign.name}.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Unique Added</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{summary.importedLeads.length}</div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Qualified (80-100)</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.qualifiedCount}</div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Duplicates Prevented</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{summary.duplicateCount}</div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Excluded / Rejected</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {summary.excludedCount + summary.rejectedCount}
              </div>
            </div>
          </div>

          {/* Duplicate & Rejection details if any */}
          {summary.rejectedCount > 0 && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs space-y-1">
              <div className="font-semibold text-rose-900">
                {summary.rejectedCount} rows rejected due to missing essential data:
              </div>
              <ul className="list-disc pl-5 text-rose-700 space-y-0.5">
                {summary.rejectionReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setFile(null);
                setStep('upload');
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Import Another CSV
            </button>

            <button
              onClick={() => onNavigate('leads')}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>Explore Leads Database</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
