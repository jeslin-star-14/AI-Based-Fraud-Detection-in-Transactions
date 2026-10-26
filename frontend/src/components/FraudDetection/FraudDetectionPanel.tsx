import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  UploadCloud, 
  GitFork, 
  Binary, 
  FileText,
  RefreshCw
} from 'lucide-react';

interface SampleCase {
  id: string;
  title: string;
  description: string;
  type: string;
  amount: number;
  utr: string;
  beneficiary: string;
  flags: Record<string, boolean>;
}

export const FraudDetectionPanel: React.FC = () => {
  const [samples, setSamples] = useState<SampleCase[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample_fake_upi');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Upload preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  // Manual Flag toggles
  const [flags, setFlags] = useState({
    flag_visual_tamper: true,
    flag_invalid_utr: true,
    flag_amount_anomaly: false,
    flag_beneficiary_mismatch: false,
    flag_time_anomaly: false,
    flag_missing_watermark: true
  });

  const [transactionAmount, setTransactionAmount] = useState<number>(45000);
  const [utrNumber, setUtrNumber] = useState<string>('98214210');
  const [beneficiaryVpa, setBeneficiaryVpa] = useState<string>('target_vendor@oksbi');

  // Load sample benchmarks on mount
  useEffect(() => {
    fetch('/api/fraud/samples')
      .then(res => res.json())
      .then(data => {
        if (data.samples && data.samples.length > 0) {
          setSamples(data.samples);
          // Run analysis on first sample by default
          loadSample(data.samples[0]);
        }
      })
      .catch(err => console.log('Samples fetch error:', err));
  }, []);

  const loadSample = (sample: SampleCase) => {
    setSelectedSampleId(sample.id);
    setTransactionAmount(sample.amount);
    setUtrNumber(sample.utr);
    setBeneficiaryVpa(sample.beneficiary);
    
    const newFlags = {
      flag_visual_tamper: !!sample.flags.flag_visual_tamper,
      flag_invalid_utr: !!sample.flags.flag_invalid_utr,
      flag_amount_anomaly: !!sample.flags.flag_amount_anomaly,
      flag_beneficiary_mismatch: !!sample.flags.flag_beneficiary_mismatch,
      flag_time_anomaly: !!sample.flags.flag_time_anomaly,
      flag_missing_watermark: !!sample.flags.flag_missing_watermark
    };
    setFlags(newFlags);
    runTransactionAnalysis(sample.amount, sample.utr, sample.beneficiary, newFlags);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('flag_visual_tamper', String(flags.flag_visual_tamper));
    formData.append('flag_invalid_utr', String(flags.flag_invalid_utr));
    formData.append('flag_amount_anomaly', String(flags.flag_amount_anomaly));
    formData.append('flag_beneficiary_mismatch', String(flags.flag_beneficiary_mismatch));
    formData.append('flag_missing_watermark', String(flags.flag_missing_watermark));

    try {
      const res = await fetch('/api/fraud/analyze-screenshot', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setAnalysisResult(data);
      if (data.extracted_fields?.amount) {
        setTransactionAmount(data.extracted_fields.amount);
      }
      if (data.extracted_fields?.utr) {
        setUtrNumber(data.extracted_fields.utr);
      }
    } catch (err) {
      console.error('Screenshot analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runTransactionAnalysis = async (
    amount: number,
    utr: string,
    beneficiary: string,
    currentFlags: typeof flags
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/fraud/analyze-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          utr,
          beneficiary_account: beneficiary,
          flags: currentFlags
        })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Transaction analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlag = (key: keyof typeof flags) => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    runTransactionAnalysis(transactionAmount, utrNumber, beneficiaryVpa, updated);
  };

  const verdict = analysisResult?.verdict;
  const bayes = analysisResult?.bayesian_analysis;
  const aoStar = analysisResult?.ao_star_search;

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-y-auto min-h-screen">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> AI Agent Core
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Binary className="w-3.5 h-3.5" /> Bayes' Theorem
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" /> AO* Search Algorithm
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              AI-Based Fraud Detection in Transactions
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Multimodal receipt forensics, probabilistic Bayesian inference, and goal-directed AND-OR graph search.
            </p>
          </div>

          {/* Quick Benchmark Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Evidence...</span>
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">Quick Scenarios:</span>

            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSample(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedSampleId === s.id
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {s.title.split(' ')[0]} {s.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Input, Screenshot Upload & Risk Toggles (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Screenshot Upload Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                Upload Transaction Screenshot
              </h2>
              <span className="text-[11px] text-slate-400">UPI / GPay / NetBanking</span>
            </div>

            <label className="border-2 border-dashed border-slate-600 hover:border-cyan-500/80 bg-slate-900/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-slate-200">
                Click to upload screenshot or drag & drop
              </span>
              <span className="text-[11px] text-slate-500 mt-1">PNG, JPG, WebP receipt images</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Image Preview with Bounding Box Overlays */}
            {(previewUrl || analysisResult?.image_url) && (
              <div className="mt-4 relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                <img
                  src={previewUrl || analysisResult?.image_url}
                  alt="Transaction Screenshot"
                  className="w-full max-h-72 object-contain mx-auto"
                />
                {/* Visual Bounding Boxes */}
                {analysisResult?.bounding_boxes?.map((box: any, i: number) => {
                  const [ymin, xmin, ymax, xmax] = box.box_2d || [0, 0, 0, 0];
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        top: `${ymin * 100}%`,
                        left: `${xmin * 100}%`,
                        width: `${(xmax - xmin) * 100}%`,
                        height: `${(ymax - ymin) * 100}%`,
                        borderColor: box.color || '#ef4444',
                        backgroundColor: `${box.color || '#ef4444'}20`,
                      }}
                      className="border-2 rounded pointer-events-none transition-all flex items-start"
                    >
                      <span 
                        style={{ backgroundColor: box.color || '#ef4444' }}
                        className="text-[10px] text-white font-bold px-1.5 py-0.5 rounded-br shadow-xs"
                      >
                        {box.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction Parameters & Active Risk Signals */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Transaction Parameters & Signals
            </h2>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Transaction Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setTransactionAmount(val);
                      runTransactionAnalysis(val, utrNumber, beneficiaryVpa, flags);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">UTR / Reference ID</label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => {
                    setUtrNumber(e.target.value);
                    runTransactionAnalysis(transactionAmount, e.target.value, beneficiaryVpa, flags);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Beneficiary UPI ID / Account</label>
                <input
                  type="text"
                  value={beneficiaryVpa}
                  onChange={(e) => {
                    setBeneficiaryVpa(e.target.value);
                    runTransactionAnalysis(transactionAmount, utrNumber, e.target.value, flags);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Risk Indicator Toggles */}
            <div className="pt-3 border-t border-slate-700/80">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Active Evidence Tokens (Trigger Bayes & AO* Graph):
              </span>
              <div className="space-y-2">
                {[
                  { key: 'flag_visual_tamper', label: 'Font & Pixel Tampering (FakePay)' },
                  { key: 'flag_invalid_utr', label: 'Invalid UTR Syntax / Checksum Error' },
                  { key: 'flag_amount_anomaly', label: 'Amount > 3.5σ Historical Baseline' },
                  { key: 'flag_beneficiary_mismatch', label: 'Unverified / Mismatched Beneficiary VPA' },
                  { key: 'flag_time_anomaly', label: 'Nocturnal Velocity Burst (2-5 AM)' },
                  { key: 'flag_missing_watermark', label: 'Missing Official NPCI / Bank Badge' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleFlag(key as keyof typeof flags)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      flags[key as keyof typeof flags]
                        ? 'bg-red-500/10 border-red-500/40 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${flags[key as keyof typeof flags] ? 'bg-red-400 shadow-xs shadow-red-400' : 'bg-slate-600'}`} />
                      {label}
                    </span>
                    <span className={`text-[11px] font-bold ${flags[key as keyof typeof flags] ? 'text-red-400' : 'text-slate-500'}`}>
                      {flags[key as keyof typeof flags] ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Fraud Agent Verdict, Bayes Theorem, AO* Search (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Final Verdict Banner */}
          <div className={`rounded-xl p-5 border shadow-lg transition-all ${
            verdict?.is_fraud
              ? 'bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border-red-500/60'
              : 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border-emerald-500/60'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase inline-block mb-1 ${
                  verdict?.is_fraud ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {verdict?.risk_level || 'ANALYSIS COMPLETE'}
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {verdict?.title || 'Evaluating Transaction...'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {verdict?.recommendation || 'Processing evidence through Bayesian & AO* reasoning pipelines.'}
                </p>
              </div>

              {/* Fraud Probability Badge */}
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Posterior Fraud Probability</span>
                <div className="text-3xl font-black tracking-tight text-white flex items-baseline justify-end gap-1">
                  <span>{verdict ? (verdict.fraud_probability * 100).toFixed(1) : '0'}</span>
                  <span className="text-base font-bold text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Prior: {(bayes?.prior_probability * 100 || 2.5).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 mt-4 overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (verdict?.fraud_probability || 0) >= 0.75
                    ? 'bg-red-500'
                    : (verdict?.fraud_probability || 0) >= 0.40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, (verdict?.fraud_probability || 0) * 100))}%` }}
              />
            </div>
          </div>

          {/* Bayes' Theorem Calculation Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Binary className="w-4 h-4 text-emerald-400" />
                Bayes' Theorem Inference Engine
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                P(Fraud | E) = [P(E|Fraud) · P(Fraud)] / P(E)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {bayes?.explanation || 'Bayes Theorem calculates the revised probability of transaction fraud given observed multimodal signals.'}
            </p>

            {/* Step-by-Step Bayesian Update Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-medium">
                    <th className="pb-2">Step</th>
                    <th className="pb-2">Observed Evidence</th>
                    <th className="pb-2 text-right">Prior P(F)</th>
                    <th className="pb-2 text-right">Bayes Factor</th>
                    <th className="pb-2 text-right">Posterior P(F|E)</th>
                    <th className="pb-2 text-right">Δ Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {bayes?.steps?.map((st: any) => (
                    <tr key={st.step_num} className="hover:bg-slate-900/40">
                      <td className="py-2 text-slate-400">#{st.step_num}</td>
                      <td className="py-2 text-slate-200 font-sans font-medium">{st.evidence_name}</td>
                      <td className="py-2 text-right text-slate-400">{(st.prior_prob * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right text-cyan-400 font-bold">{st.bayes_factor}x</td>
                      <td className="py-2 text-right text-red-400 font-bold">{(st.posterior_prob * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right text-emerald-400 font-semibold">+{st.delta_pct}%</td>
                    </tr>
                  ))}
                  {(!bayes?.steps || bayes.steps.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 font-sans">
                        No adverse evidence detected. Prior baseline retail rate holds.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AO* (AND-OR Graph Search) Tree Visualization */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                AO* (AND-OR Graph) Search Decomposition
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                  aoStar?.is_fraud_proved
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {aoStar?.is_fraud_proved ? 'PROOF ESTABLISHED (f < 5)' : 'UNPROVED'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Tree Cost: f={aoStar?.optimal_cost}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              AO* breaks the fraud goal into OR-choices (alternative channels) and AND-branches (sub-conditions that must both hold), proving the minimum-cost verification path.
            </p>

            {/* Proof Tree Visual Cards */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Proof Tree Nodes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aoStar?.proof_tree_nodes?.map((node: any) => (
                  <div
                    key={node.id}
                    className={`p-3 rounded-lg border transition-all ${
                      node.is_solved
                        ? 'bg-red-950/40 border-red-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        node.node_type === 'AND'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : node.node_type === 'OR'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {node.node_type} Node
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        Cost: {node.cost}
                      </span>
                    </div>
                    <span className="text-xs font-semibold block">{node.label}</span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {node.status_message || (node.is_solved ? 'Verified Solved' : 'Unsolved')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traversal Log Drawer */}
            <div className="mt-4 pt-3 border-t border-slate-700/80">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                AO* Bottom-Up Propagation Log:
              </span>
              <div className="bg-slate-950/80 rounded-lg p-2.5 max-h-32 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1">
                {aoStar?.traversal_log?.map((log: string, idx: number) => (
                  <div key={idx} className="leading-tight">
                    <span className="text-slate-600 mr-2">›</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
