import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck,
  UploadCloud, 
  GitFork, 
  Binary, 
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Maximize2,
  Sliders,
  DollarSign
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

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'sample_fake_upi':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case 'sample_nocturnal_whale':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'sample_phishing_invoice':
        return <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />;
      case 'sample_clean_legitimate':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#fbfcfd] text-slate-900 overflow-y-auto min-h-screen"
      style={{ fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', Georgia, serif" }}
    >
      {/* Top Banner with White Theme Aesthetics */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>AI Agent Forensics</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <Binary className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bayes' Theorem</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 shadow-xs">
                <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                <span>AO* Search Algorithm</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              AI-Based Fraud Detection in Transactions
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Autonomous multimodal forensics for digital payment screenshots, probabilistic Bayesian risk formulation, and goal-directed AND-OR graph search.
            </p>
          </div>

          {/* Preset Benchmark Scenarios */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {isLoading && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span className="font-semibold">Evaluating Evidence...</span>
              </span>
            )}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSample(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSampleId === s.id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {getScenarioIcon(s.id)}
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Screenshot Upload, Parameters, and Evidence Toggles (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Screenshot Upload Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                Transaction Screenshot Inspection
              </h2>
              <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                UPI / NetBanking / Invoices
              </span>
            </div>

            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
              <div className="w-11 h-11 rounded-full bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 transition-colors">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Upload Payment Screenshot
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Drag and drop receipt image (PNG, JPG, WebP)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Image Preview with Bounding Box Overlays */}
            {(previewUrl || analysisResult?.image_url) && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    Forensic Visual Evidence Canvas
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold">
                    {analysisResult?.bounding_boxes?.length || 0} Artifacts Detected
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                  <img
                    src={previewUrl || analysisResult?.image_url}
                    alt="Transaction Evidence"
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
                          borderColor: box.color || '#e11d48',
                          backgroundColor: `${box.color || '#e11d48'}18`,
                        }}
                        className="border-2 rounded pointer-events-none transition-all flex items-start"
                      >
                        <span 
                          style={{ backgroundColor: box.color || '#e11d48' }}
                          className="text-[10px] text-white font-bold px-2 py-0.5 rounded-br shadow-xs"
                        >
                          {box.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Transaction Attributes & Parameters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              Transaction Parameters & Evidence Signals
            </h2>

            <div className="space-y-4 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Transaction Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    value={transactionAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setTransactionAmount(val);
                      runTransactionAnalysis(val, utrNumber, beneficiaryVpa, flags);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  UTR Reference ID (12-Digit Banking Checksum)
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => {
                    setUtrNumber(e.target.value);
                    runTransactionAnalysis(transactionAmount, e.target.value, beneficiaryVpa, flags);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Beneficiary Account / UPI VPA
                </label>
                <input
                  type="text"
                  value={beneficiaryVpa}
                  onChange={(e) => {
                    setBeneficiaryVpa(e.target.value);
                    runTransactionAnalysis(transactionAmount, utrNumber, e.target.value, flags);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Risk Indicator Toggles */}
            <div className="pt-4 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Active Evidence Tokens:
              </span>
              <div className="space-y-2">
                {[
                  { key: 'flag_visual_tamper', label: 'Font & Pixel Tampering (FakePay Splicing)' },
                  { key: 'flag_invalid_utr', label: 'Invalid UTR Syntax / Non-12 Checksum' },
                  { key: 'flag_amount_anomaly', label: 'Amount > 3.5σ Historical Baseline' },
                  { key: 'flag_beneficiary_mismatch', label: 'Unverified / Diverted Beneficiary VPA' },
                  { key: 'flag_time_anomaly', label: 'Nocturnal Velocity Burst (2:00 - 5:00 AM)' },
                  { key: 'flag_missing_watermark', label: 'Missing Official Bank / NPCI Watermark' },
                ].map(({ key, label }) => {
                  const isActive = flags[key as keyof typeof flags];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFlag(key as keyof typeof flags)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-left">{label}</span>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isActive ? 'FLAGGED' : 'CLEAN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Verdict, Bayes' Theorem, and AO* Search (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Executive Verdict Banner in White Theme */}
          <div className={`rounded-2xl p-6 border shadow-sm transition-all ${
            verdict?.is_fraud
              ? 'bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-rose-300'
              : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-emerald-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase inline-flex items-center gap-1.5 mb-2 shadow-xs ${
                  verdict?.is_fraud 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {verdict?.is_fraud ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  )}
                  {verdict?.risk_level || 'ANALYSIS COMPLETE'}
                </span>
                <h3 className="text-2xl font-bold text-slate-900">
                  {verdict?.title || 'Evaluating Transaction Risk...'}
                </h3>
                <p className="text-sm text-slate-700 mt-1 max-w-xl leading-relaxed">
                  {verdict?.recommendation || 'Processing multimodal evidence through Bayesian and AO* proof engines.'}
                </p>
              </div>

              {/* Fraud Probability Badge */}
              <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 shadow-xs sm:text-right shrink-0">
                <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">
                  Posterior Fraud Probability
                </span>
                <div className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-baseline sm:justify-end gap-1 mt-0.5">
                  <span className={verdict?.is_fraud ? 'text-rose-600' : 'text-emerald-600'}>
                    {verdict ? (verdict.fraud_probability * 100).toFixed(1) : '0'}
                  </span>
                  <span className="text-lg font-bold text-slate-400">%</span>
                </div>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  Prior Base Rate: {(bayes?.prior_probability * 100 || 2.5).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full bg-white rounded-full h-3 mt-5 overflow-hidden border border-slate-200/90 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (verdict?.fraud_probability || 0) >= 0.75
                    ? 'bg-rose-600'
                    : (verdict?.fraud_probability || 0) >= 0.40
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, (verdict?.fraud_probability || 0) * 100))}%` }}
              />
            </div>
          </div>

          {/* Bayes' Theorem Calculation Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Binary className="w-5 h-5 text-emerald-600" />
                Bayes' Theorem Inference Engine
              </h3>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                P(Fraud | E) = [P(E|Fraud) · P(Fraud)] / P(E)
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {bayes?.explanation || "Bayes' Theorem recalculates the posterior probability of fraud as each independent multimodal evidence factor is introduced into the evidence vector."}
            </p>

            {/* Step-by-Step Bayesian Update Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3">Step</th>
                    <th className="py-3 px-3">Observed Evidence Factor</th>
                    <th className="py-3 px-3 text-right">Prior P(F)</th>
                    <th className="py-3 px-3 text-right">Bayes Factor</th>
                    <th className="py-3 px-3 text-right">Posterior P(F|E)</th>
                    <th className="py-3 px-3 text-right">Δ Risk Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bayes?.steps?.map((st: any) => (
                    <tr key={st.step_num} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500">#{st.step_num}</td>
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{st.evidence_name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">{(st.prior_prob * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right text-indigo-700 font-bold">{st.bayes_factor}x</td>
                      <td className="py-2.5 px-3 text-right text-rose-700 font-bold">{(st.posterior_prob * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">+{st.delta_pct}%</td>
                    </tr>
                  ))}
                  {(!bayes?.steps || bayes.steps.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                        No adverse evidence detected. Prior baseline retail rate holds authentic.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AO* (AND-OR Graph Search) Tree Visualization */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitFork className="w-5 h-5 text-indigo-600" />
                AO* (AND-OR Graph) Search Decomposition
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  aoStar?.is_fraud_proved
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {aoStar?.is_fraud_proved ? 'PROOF TREE SOLVED (f < 5)' : 'UNPROVEN'}
                </span>
                <span className="text-xs text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  Minimal Cost: f={aoStar?.optimal_cost}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              AO* decomposes the overarching fraud goal into alternative OR-channels and composite AND-branches. The search establishes the optimal proof path verifying the fraud verdict.
            </p>

            {/* Proof Tree Visual Cards */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Active Proof Tree Nodes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aoStar?.proof_tree_nodes?.map((node: any) => (
                  <div
                    key={node.id}
                    className={`p-4 rounded-xl border transition-all ${
                      node.is_solved
                        ? 'bg-rose-50/70 border-rose-300 text-slate-900 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                        node.node_type === 'AND'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : node.node_type === 'OR'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {node.node_type} Node
                      </span>
                      <span className="text-xs font-bold text-indigo-700">
                        Cost: {node.cost}
                      </span>
                    </div>
                    <span className="text-sm font-bold block text-slate-900">{node.label}</span>
                    <span className="text-xs text-slate-600 mt-1 block">
                      {node.status_message || (node.is_solved ? 'Verified Solved' : 'Unsolved')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traversal Log */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                AO* Bottom-Up Propagation Log:
              </span>
              <div className="bg-slate-50 rounded-xl p-3 max-h-36 overflow-y-auto text-xs text-slate-700 space-y-1.5 border border-slate-200 font-mono">
                {aoStar?.traversal_log?.map((log: string, idx: number) => (
                  <div key={idx} className="leading-tight flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{log}</span>
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
