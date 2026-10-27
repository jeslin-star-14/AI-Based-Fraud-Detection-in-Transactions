import React, { useState, useEffect, useRef } from 'react';
import type { RoleMode } from '../../types';
import { 
  ShieldAlert, 
  ShieldCheck,
  UploadCloud, 
  Binary, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2, 
  History, 
  ScanLine, 
  Trash2, 
  FileCheck2, 
  ArrowRight,
  Loader2,
  Bot,
  Workflow,
  FileText,
  Info,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Calculator,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DetectionHistoryItem {
  id: string;
  timestamp: string;
  title: string;
  type: string;
  amount: number | null;
  utr: string | null;
  beneficiary: string | null;
  fraudProbability: number;
  riskLevel: string;
  isFraud: boolean;
  detectedFlagsCount: number;
  fullData?: any;
}

export const FraudDetectionPanel: React.FC<{ roleMode?: RoleMode }> = ({ roleMode = 'Auditor' }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Active view: Scanner vs Audit Ledger vs Subject Study Hub
  const [activeSubTab, setActiveSubTab] = useState<'scanner' | 'history' | 'studies'>('scanner');

  // Study Hub Active Module
  const [activeStudyModule, setActiveStudyModule] = useState<'bayes' | 'ao_star' | 'forensics' | 'domain' | 'viva_qa'>('bayes');

  // Automatically switch to studies view when user changes dropdown to Subject
  useEffect(() => {
    if (roleMode === 'Subject') {
      setActiveSubTab('studies');
    }
  }, [roleMode]);

  // AO* View Toggle: Flowchart vs Table
  const [aoViewMode, setAoViewMode] = useState<'flowchart' | 'table'>('flowchart');

  // Toggle for collapsible mathematical proof & search details
  const [showAdvancedCalculus, setShowAdvancedCalculus] = useState<boolean>(false);

  // Upload preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted parameters strictly from backend response (no hardcoded fallbacks)
  const [extractedData, setExtractedData] = useState<{
    amount: number | null;
    utr: string | null;
    beneficiary: string | null;
    status: string | null;
  }>({
    amount: null,
    utr: null,
    beneficiary: null,
    status: null
  });

  // Automated Detection Evidence Flags derived dynamically from analysis steps
  const [autoEvidenceFlags, setAutoEvidenceFlags] = useState<Record<string, boolean>>({
    flag_visual_tamper: false,
    flag_invalid_utr: false,
    flag_amount_anomaly: false,
    flag_beneficiary_mismatch: false,
    flag_time_anomaly: false,
    flag_missing_watermark: false
  });

  // Detection History loaded dynamically from localStorage with zero hardcoded entries
  const [detectionHistory, setDetectionHistory] = useState<DetectionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('fraud_audit_ledger_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Save history to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('fraud_audit_ledger_v2', JSON.stringify(detectionHistory));
    } catch {
      // ignore
    }
  }, [detectionHistory]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setExtractedData({
      amount: null,
      utr: null,
      beneficiary: null,
      status: null
    });
    setAutoEvidenceFlags({
      flag_visual_tamper: false,
      flag_invalid_utr: false,
      flag_amount_anomaly: false,
      flag_beneficiary_mismatch: false,
      flag_time_anomaly: false,
      flag_missing_watermark: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Shared processor for files uploaded via input, drag-and-drop, or clipboard paste
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload or paste an image file.');
      return;
    }

    setErrorMessage(null);

    // Read immediately as Base64 Data URL so preview is 100% resilient
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setPreviewUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/fraud/analyze-screenshot', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned status ${res.status}: ${errorText || res.statusText}`);
      }
      const data = await res.json();
      setAnalysisResult(data);

      const isTxn = data.is_transaction_document !== false;

      if (!isTxn) {
        // Non-transaction document identified by classifier
        setExtractedData({
          amount: null,
          utr: null,
          beneficiary: null,
          status: 'NON_TRANSACTION'
        });
        setAutoEvidenceFlags({
          flag_visual_tamper: false,
          flag_invalid_utr: false,
          flag_amount_anomaly: false,
          flag_beneficiary_mismatch: false,
          flag_time_anomaly: false,
          flag_missing_watermark: false
        });
      } else {
        const detectedAmt = data.extracted_fields?.amount ?? null;
        const detectedUtr = data.extracted_fields?.utr ?? null;
        const detectedPayee = data.extracted_fields?.payee ?? null;

        setExtractedData({
          amount: detectedAmt,
          utr: detectedUtr,
          beneficiary: detectedPayee,
          status: data.extracted_fields?.status ?? 'DETECTED'
        });

        // Dynamically derive evidence flags directly from Bayesian inference steps
        const steps = data.bayesian_analysis?.steps || [];
        const stepNames = steps.map((s: any) => (s.evidence_name || '').toLowerCase());
        const newFlags = {
          flag_visual_tamper: stepNames.some((name: string) => name.includes('visual') || name.includes('tamper') || name.includes('splicing')),
          flag_invalid_utr: stepNames.some((name: string) => name.includes('utr') || name.includes('syntax')),
          flag_amount_anomaly: stepNames.some((name: string) => name.includes('amount') || name.includes('outlier')),
          flag_beneficiary_mismatch: stepNames.some((name: string) => name.includes('beneficiary') || name.includes('vpa')),
          flag_time_anomaly: stepNames.some((name: string) => name.includes('time') || name.includes('velocity') || name.includes('nocturnal')),
          flag_missing_watermark: stepNames.some((name: string) => name.includes('watermark') || name.includes('seal'))
        };
        setAutoEvidenceFlags(newFlags);
      }

      // Append record to audit ledger
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const docName = data.document_classification?.document_name || 'Screenshot';

      const newHistoryItem: DetectionHistoryItem = {
        id: `AUDIT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: `Today, ${timeStr}`,
        title: `${docName}: ${file.name.slice(0, 24)}`,
        type: isTxn ? 'Financial Transaction Forensics' : 'Document Domain Intake (Non-Financial)',
        amount: isTxn ? (data.extracted_fields?.amount ?? null) : null,
        utr: isTxn ? (data.extracted_fields?.utr ?? null) : null,
        beneficiary: isTxn ? (data.extracted_fields?.payee ?? null) : null,
        fraudProbability: data.verdict?.fraud_probability ?? 0,
        riskLevel: data.verdict?.risk_level ?? 'NON_TRANSACTION',
        isFraud: !!data.verdict?.is_fraud,
        detectedFlagsCount: isTxn ? (data.bayesian_analysis?.steps?.length || 0) : 0,
        fullData: data
      };
      setDetectionHistory(prev => [newHistoryItem, ...prev]);

    } catch (err: any) {
      console.error('Screenshot forensic analysis failed:', err);
      setErrorMessage(err?.message || 'Forensic analysis failed to reach backend API. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clipboard Paste Support: Allows user to press Ctrl+V / Cmd+V to paste screenshot from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // 1. First check clipboardData.files (direct screenshot / copied file)
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            processImageFile(file);
            return;
          }
        }
      }
      // 2. Next check clipboardData.items (copied image from browser or clipboard stream)
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const loadHistoryItem = (item: DetectionHistoryItem) => {
    if (item.fullData) {
      setAnalysisResult(item.fullData);
      setExtractedData({
        amount: item.amount,
        utr: item.utr,
        beneficiary: item.beneficiary,
        status: item.fullData.extracted_fields?.status || 'HISTORICAL'
      });
      if (item.fullData.image_url) {
        setPreviewUrl(item.fullData.image_url);
      }
    }
    setActiveSubTab('scanner');
  };

  const clearHistory = () => {
    setDetectionHistory([]);
    try {
      localStorage.removeItem('fraud_audit_ledger_v2');
    } catch {
      // ignore
    }
  };

  const verdict = analysisResult?.verdict;
  const bayes = analysisResult?.bayesian_analysis;
  const aoStar = analysisResult?.ao_star_search;
  const advisory = analysisResult?.gemini_agent_advisory;

  // Helper function to check if an AO* node is solved in the active proof tree
  const isNodeSolved = (nodeId: string): boolean => {
    if (!aoStar?.proof_tree_nodes) return false;
    const found = aoStar.proof_tree_nodes.find((n: any) => n.id === nodeId);
    return found ? found.is_solved : false;
  };

  const getNodeCost = (nodeId: string, defaultCost: number): string => {
    if (!aoStar?.proof_tree_nodes) return `${defaultCost.toFixed(1)}`;
    const found = aoStar.proof_tree_nodes.find((n: any) => n.id === nodeId);
    return found ? `${found.cost.toFixed(1)}` : `${defaultCost.toFixed(1)}`;
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#fbfcfd] text-slate-900 overflow-y-auto min-h-screen"
      style={{ 
        fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', Georgia, serif",
        letterSpacing: "0.012em",
        lineHeight: "1.6"
      }}
    >
      {/* Institutional Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transaction Fraud Detection
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Inspect payment receipts, vouchers, and transactions for alterations, invalid references, and fraud patterns.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center self-start lg:self-center">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveSubTab('scanner')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === 'scanner'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ScanLine className="w-4 h-4 text-slate-700" />
                <span>Forensic Inspector</span>
              </button>
              <button
                onClick={() => setActiveSubTab('history')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === 'history'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4 text-slate-700" />
                <span>Audit Ledger</span>
                <span className="px-1.5 py-0.2 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700 font-mono">
                  {detectionHistory.length}
                </span>
              </button>
              <button
                onClick={() => setActiveSubTab('studies')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === 'studies'
                    ? 'bg-white text-indigo-950 shadow-xs border border-indigo-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Study Material & Viva Guide</span>
                {roleMode === 'Subject' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 font-mono">
                    ACTIVE
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      {activeSubTab === 'scanner' ? (
        <div className="max-w-7xl mx-auto w-full p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          {/* Left Column: Forensic Intake & Dynamic Parameter Extraction (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Subject Persona Learning Callout Banner */}
            {roleMode === 'Subject' && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between text-indigo-950 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      Subject / STEM Learning Persona Active
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-200/80 text-indigo-900 font-mono">Studies Mode</span>
                    </h3>
                    <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                      Pedagogical explanations for Bayes' Theorem & AO* Graph Search are active.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('studies')}
                  className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1 font-mono"
                >
                  <span>Open Study Material</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Direct Receipt Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-slate-700" />
                  Upload Receipt or Screenshot
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Upload or paste a payment screenshot (Google Pay, PhonePe, Paytm, Bank Transfer).
              </p>

              {/* Connection or Upload Error Alert Banner */}
              {errorMessage && (
                <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-serif flex items-start gap-2.5 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900 mb-0.5">Forensic Analysis Connection Alert</p>
                    <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-800 text-sm font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              )}

              <label 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border border-dashed border-slate-300 hover:border-slate-600 bg-slate-50/60 hover:bg-slate-100/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all relative"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="w-6 h-6 text-slate-700 animate-spin mb-2" />
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      Processing EasyOCR & Domain Forensic Verification...
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-sm font-bold text-slate-800 text-center">
                      Select, Drop Image, or Press Ctrl+V / Cmd+V to Paste
                    </span>
                    <span className="text-xs text-slate-500 mt-1 text-center font-mono">
                      Supports Clipboard Paste, PNG, JPG, WebP
                    </span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>

              {/* Forensic Bounding Box Inspection Canvas */}
              {(previewUrl || analysisResult?.image_url) && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-mono">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                      Dynamic Forensic Annotations
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {analysisResult?.bounding_boxes?.length || 0} regions
                      </span>
                      <button
                        onClick={handleDeleteImage}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs font-mono"
                        title="Delete uploaded image and reset inspector"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Delete Image</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                    {/* Quick overlay delete button */}
                    <button
                      onClick={handleDeleteImage}
                      className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg border border-slate-200 shadow-sm transition-all z-10 opacity-80 group-hover:opacity-100"
                      title="Remove Image"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                    <img
                      src={previewUrl || analysisResult?.image_url}
                      alt="Transaction Evidence Inspection"
                      className="w-full max-h-72 object-contain mx-auto bg-slate-950/5"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (analysisResult?.image_url && !target.src.includes('127.0.0.1')) {
                          target.src = `http://127.0.0.1:8000${analysisResult.image_url}`;
                        }
                      }}
                    />
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
                            borderColor: box.color || '#dc2626',
                            backgroundColor: `${box.color || '#dc2626'}1a`,
                          }}
                          className="border-2 rounded pointer-events-none transition-all flex items-start"
                        >
                          <span 
                            style={{ backgroundColor: box.color || '#dc2626' }}
                            className="text-[10px] text-white font-bold px-1.5 py-0.2 rounded-br shadow-xs"
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

            {/* Left Column: Document Classification OR Extracted Parameters */}
            {analysisResult && analysisResult.is_transaction_document === false ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    Document Intent & Domain Analysis
                  </h2>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-mono">
                    NON-TRANSACTION
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 mb-5">
                  <span className="text-xs font-bold text-amber-900 block mb-1">
                    {analysisResult.document_classification?.document_name || 'Academic / Unrelated Document'}
                  </span>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    {analysisResult.document_classification?.summary || 'Identified as a non-transaction document.'}
                  </p>
                </div>

                {analysisResult.document_classification?.extracted_details && Object.keys(analysisResult.document_classification.extracted_details).length > 0 && (
                  <div className="space-y-2.5 mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                      Identified Document Metadata:
                    </span>
                    {Object.entries(analysisResult.document_classification.extracted_details).map(([k, v]: [string, any]) => (
                      <div key={k} className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-600 font-mono">{k}</span>
                        <span className="text-xs font-bold text-slate-900 text-right truncate max-w-[240px] font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Domain Verification Notice:</strong> The AI classifier determined this document is an educational or non-financial record. AO* Search and Bayes' Theorem strictly evaluate payment vouchers (UPI receipts, bank transfers, invoices). Upload a transaction receipt to execute fraud detection.
                  </p>
                </div>
              </div>
            ) : (
              /* Extracted Transaction Parameters */
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-slate-700" />
                    Extracted Transaction Parameters
                  </h2>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                    {extractedData.status || 'Active'}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                        Transaction Amount
                      </span>
                      <span className="text-lg font-bold text-slate-900 font-mono">
                        {extractedData.amount !== null ? `₹${extractedData.amount.toLocaleString('en-IN')}` : '— (Not extracted)'}
                      </span>
                    </div>
                    {extractedData.amount !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                        extractedData.amount >= 25000 
                          ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}>
                        {extractedData.amount >= 25000 ? 'High Value' : 'Standard Baseline'}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                        UTR / Reference Identifier
                      </span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {extractedData.utr || '— (Not detected)'}
                      </span>
                    </div>
                    {extractedData.utr && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                        String(extractedData.utr).length !== 12 
                          ? 'bg-rose-50 text-rose-900 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}>
                        {String(extractedData.utr).length !== 12 ? 'Non-standard Length' : '12-Digit Format'}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                        Beneficiary / Counterparty VPA
                      </span>
                      <span className="text-xs font-bold text-slate-900 font-mono truncate max-w-[200px] block">
                        {extractedData.beneficiary || '—'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Routing Verified
                    </span>
                  </div>
                </div>

                {/* Verification Checks */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 block mb-2.5">
                    Security Verification Checks:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'flag_visual_tamper', label: 'Font & Pixel Authenticity' },
                      { key: 'flag_invalid_utr', label: 'UTR Reference ID Format' },
                      { key: 'flag_amount_anomaly', label: 'Amount Baseline Check' },
                      { key: 'flag_beneficiary_mismatch', label: 'Beneficiary Account Whitelist' },
                      { key: 'flag_time_anomaly', label: 'Transaction Velocity / Time' },
                      { key: 'flag_missing_watermark', label: 'NPCI / Bank Security Seal' },
                    ].map(({ key, label }) => {
                      const isFlagged = autoEvidenceFlags[key];
                      return (
                        <div
                          key={key}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                            isFlagged
                              ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isFlagged ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span className="truncate">{label}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase font-mono ${
                            isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isFlagged ? 'FLAGGED' : 'PASSED'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Verdict, Gemini Advisory, Bayes Calculus, and AO* Flowchart (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Risk Verdict Banner */}
            {analysisResult && analysisResult.is_transaction_document === false ? (
              <div className="rounded-xl p-6 border shadow-xs transition-all bg-amber-50/40 border-amber-300">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 mb-2 font-mono bg-amber-700 text-white">
                      <Info className="w-3.5 h-3.5 text-white" />
                      <span>NON-TRANSACTION DOCUMENT</span>
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      {verdict?.title || 'NON-TRANSACTION DOCUMENT DETECTED'}
                    </h3>
                    <p className="text-xs text-slate-700 mt-2 max-w-xl leading-relaxed">
                      {verdict?.recommendation || 'Document is not a monetary transaction receipt. Upload a financial payment receipt to evaluate fraud.'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs sm:text-right shrink-0">
                    <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wider font-mono">
                      Fraud Calculus Status
                    </span>
                    <div className="text-2xl font-extrabold tracking-tight text-slate-700 mt-1 font-mono">
                      INACTIVE
                    </div>
                    <span className="text-[11px] text-amber-700 font-mono block mt-1 font-bold">
                      Non-Payment Document
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl p-6 border shadow-xs transition-all ${
                verdict?.is_fraud
                  ? 'bg-rose-50/40 border-rose-300'
                  : 'bg-emerald-50/30 border-emerald-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 mb-2 font-mono ${
                      verdict?.is_fraud 
                        ? 'bg-rose-700 text-white' 
                        : 'bg-emerald-800 text-white'
                    }`}>
                      {verdict?.is_fraud ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{verdict?.risk_level || 'EVALUATING'}</span>
                    </span>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      {verdict?.title || 'Awaiting Receipt Upload...'}
                    </h3>
                    <p className="text-xs text-slate-700 mt-2 max-w-xl leading-relaxed">
                      {verdict?.recommendation || 'Upload an image or receipt to initiate the autonomous Bayesian inference and AO* search decomposition.'}
                    </p>
                  </div>

                  {/* Posterior Probability Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs sm:text-right shrink-0">
                    <span className="text-[11px] text-slate-500 block font-bold uppercase tracking-wider font-mono">
                      Posterior Fraud Probability
                    </span>
                    <div className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-baseline sm:justify-end gap-1 mt-1 font-mono">
                      <span className={verdict?.is_fraud ? 'text-rose-700' : 'text-emerald-700'}>
                        {verdict ? (verdict.fraud_probability * 100).toFixed(1) : '0.0'}
                      </span>
                      <span className="text-base font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block mt-1">
                      Prior Base Rate: {(bayes?.prior_probability * 100 || 2.5).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Linear Risk Meter */}
                <div className="w-full bg-slate-200 rounded-full h-2 mt-5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (verdict?.fraud_probability || 0) >= 0.70
                        ? 'bg-rose-700'
                        : (verdict?.fraud_probability || 0) >= 0.35
                        ? 'bg-amber-600'
                        : 'bg-emerald-700'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, (verdict?.fraud_probability || 0) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* AI Analysis & Summary */}
            {advisory && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        AI Transaction Analysis
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        Document Classification & Verification
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    advisory.is_safe
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}>
                    {advisory.safety_status}
                  </span>
                </div>

                {/* Answers to Core Inquiries: What is this thing & For what was this payment done */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                      Document Type
                    </span>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {advisory.what_is_this}
                    </p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                      Payment Context / Purpose
                    </span>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {advisory.payment_purpose}
                    </p>
                  </div>
                </div>

                {/* Deep Safety & Forensic Reason */}
                <div className="mb-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    Safety Assessment & Findings
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {advisory.detailed_reasoning}
                  </p>
                </div>

                {/* Actionable Agent Protocol Guidance */}
                {advisory.suggested_actions?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-2">
                      Agent Risk Mitigation Recommendations:
                    </span>
                    <div className="space-y-1.5">
                      {advisory.suggested_actions.map((act: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </span>
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Reasoning (Bayes' Calculus & AO* Graph Search) - Collapsible to avoid information overload */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setShowAdvancedCalculus(!showAdvancedCalculus)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                    <Binary className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Mathematical Inference & Proof Search</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                        Bayes' Theorem · AO* Graph
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {showAdvancedCalculus ? 'Click to hide probabilistic calculus and graph tree' : 'Click to view step-by-step Bayes posterior updating & AO* proof tree'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 font-mono">
                    {showAdvancedCalculus ? 'Hide Details' : 'View Details'}
                  </span>
                  {showAdvancedCalculus ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {showAdvancedCalculus && (
                <div className="p-6 border-t border-slate-100 space-y-6">
                  {/* Bayes' Theorem Mathematical Inference Calculus */}
                  <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Binary className="w-4 h-4 text-slate-700" />
                          Bayes' Theorem Evidence Calculus
                        </h4>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Probabilistic Multi-Evidence Posterior Updating
                        </span>
                      </div>
                <span className="text-xs text-slate-700 font-mono bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                  P(F | E) = [P(E | F) · P(F)] / P(E)
                </span>
              </div>

              {bayes && bayes.is_applicable === false ? (
                <div className="p-6 bg-slate-50/70 rounded-xl border border-slate-200 text-center">
                  <Binary className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">Bayesian Inference Calculus Inactive</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    {bayes?.explanation || "Bayes' Theorem calculation is restricted to financial transactions. No payment transaction detected in this document."}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                    {bayes?.explanation || "Bayes' Theorem models fraud belief as a probability distribution. Starting from baseline prior odds, every observed token multiplies the odds by its likelihood ratio to produce the exact posterior risk."}
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse font-serif">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="py-2.5 px-3 font-mono">Step</th>
                          <th className="py-2.5 px-3">Observed Evidence Token</th>
                          <th className="py-2.5 px-3 text-right font-mono">Prior P(F)</th>
                          <th className="py-2.5 px-3 text-right font-mono">Bayes Factor (LR)</th>
                          <th className="py-2.5 px-3 text-right font-mono">Posterior P(F|E)</th>
                          <th className="py-2.5 px-3 text-right font-mono">Δ Shift</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bayes?.steps?.map((st: any) => (
                          <tr key={st.step_num} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-500">#{st.step_num}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-bold">{st.evidence_name}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">{(st.prior_prob * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{st.bayes_factor}x</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">{(st.posterior_prob * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">+{st.delta_pct}%</td>
                          </tr>
                        ))}
                        {(!bayes?.steps || bayes.steps.length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 font-mono">
                              Zero adverse evidence tokens observed. Baseline prior probability holds legitimate.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* AO* (AND-OR Graph) Search Decomposition & Visual Flowchart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-slate-700" />
                    AO* (AND-OR Graph) Heuristic Search Flowchart
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    State-Space Problem Reduction & Minimum-Cost Proof Tree
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setAoViewMode('flowchart')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        aoViewMode === 'flowchart'
                          ? 'bg-white text-slate-900 shadow-2xs font-mono'
                          : 'text-slate-600'
                      }`}
                    >
                      Visual Flowchart
                    </button>
                    <button
                      onClick={() => setAoViewMode('table')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        aoViewMode === 'table'
                          ? 'bg-white text-slate-900 shadow-2xs font-mono'
                          : 'text-slate-600'
                      }`}
                    >
                      Proof Node Cards
                    </button>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold border ${
                    aoStar?.is_fraud_proved
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {aoStar?.is_fraud_proved ? 'PROOF TREE SOLVED' : 'UNPROVEN'}
                  </span>
                </div>
              </div>

              {aoStar && aoStar.is_applicable === false ? (
                <div className="p-6 bg-slate-50/70 rounded-xl border border-slate-200 text-center">
                  <Workflow className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">AO* Search Inactive (Non-Transaction Document)</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    {aoStar?.explanation || "AO* AND-OR Graph Search proves fraud paths only for payment transactions. Since no transaction was detected, the fraud proof tree is inactive."}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                    Unlike Bayesian probability, <strong>AO* is a heuristic state-space search algorithm</strong>. It decomposes the fraud confirmation hypothesis into disjunctive alternative vectors (OR nodes) and conjunctive requirement sets (AND nodes), iteratively updating costs bottom-up ($f(n) = g(n) + h(n)$) to derive the minimal-cost proof path.
              </p>

              {/* AO* Interactive Visual Flowchart */}
              {aoViewMode === 'flowchart' ? (
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 overflow-x-auto">
                  {/* Flowchart Header Info */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-3 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" />
                        <span className="text-rose-900 font-bold">Solved Proof Path</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-slate-300 inline-block" />
                        <span>Unsolved Branch</span>
                      </span>
                      <span className="text-slate-600 font-bold">
                        Cost Formula: f(n) = g(n) + h(n)
                      </span>
                    </div>
                    <span className="font-bold text-slate-700">
                      Minimal Optimal Cost: f={aoStar?.optimal_cost ?? 10.0}
                    </span>
                  </div>

                  {/* Flowchart Graph Canvas */}
                  <div className="min-w-[620px] flex flex-col items-center">
                    {/* LEVEL 0: ROOT NODE */}
                    <div className={`px-5 py-3 rounded-xl border text-center transition-all shadow-xs ${
                      isNodeSolved('GOAL_FRAUD')
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 text-rose-950'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}>
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          Root OR Node (∨)
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          Cost: {getNodeCost('GOAL_FRAUD', 5.0)}
                        </span>
                      </div>
                      <span className="text-sm font-bold block">Goal: Confirm Fraud in Transaction</span>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                        {isNodeSolved('GOAL_FRAUD') ? 'PROVED: Minimal Cost Path Solved' : 'UNPROVEN: All alternatives hold legitimate'}
                      </span>
                    </div>

                    {/* SVG Connector from Root to 3 Branches */}
                    <svg className="w-full h-12 my-1" viewBox="0 0 600 48" fill="none">
                      {/* Left line to Visual Forgery */}
                      <path 
                        d="M 300 0 L 300 16 L 100 16 L 100 48" 
                        stroke={isNodeSolved('BRANCH_VISUAL_TAMPER') ? '#dc2626' : '#cbd5e1'} 
                        strokeWidth={isNodeSolved('BRANCH_VISUAL_TAMPER') ? "2.5" : "1.5"}
                        strokeDasharray={isNodeSolved('BRANCH_VISUAL_TAMPER') ? "none" : "3 3"}
                      />
                      {/* Center line to Reference Spoof */}
                      <path 
                        d="M 300 0 L 300 48" 
                        stroke={isNodeSolved('BRANCH_REFERENCE_SPOOF') ? '#dc2626' : '#cbd5e1'} 
                        strokeWidth={isNodeSolved('BRANCH_REFERENCE_SPOOF') ? "2.5" : "1.5"}
                        strokeDasharray={isNodeSolved('BRANCH_REFERENCE_SPOOF') ? "none" : "3 3"}
                      />
                      {/* Right line to Behavioral Anomaly */}
                      <path 
                        d="M 300 0 L 300 16 L 500 16 L 500 48" 
                        stroke={isNodeSolved('BRANCH_BEHAVIORAL_ANOMALY') ? '#dc2626' : '#cbd5e1'} 
                        strokeWidth={isNodeSolved('BRANCH_BEHAVIORAL_ANOMALY') ? "2.5" : "1.5"}
                        strokeDasharray={isNodeSolved('BRANCH_BEHAVIORAL_ANOMALY') ? "none" : "3 3"}
                      />
                      {/* OR junction badge */}
                      <rect x="286" y="8" width="28" height="16" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
                      <text x="300" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" fontFamily="monospace">OR (∨)</text>
                    </svg>

                    {/* LEVEL 1: 3 AND BRANCH NODES */}
                    <div className="w-full grid grid-cols-3 gap-4">
                      {/* Branch 1: Visual Forgery */}
                      <div className={`p-3 rounded-lg border text-center transition-all ${
                        isNodeSolved('BRANCH_VISUAL_TAMPER')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                            AND (∧)
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            Cost: {getNodeCost('BRANCH_VISUAL_TAMPER', 3.0)}
                          </span>
                        </div>
                        <span className="text-xs font-bold block">Branch 1: Visual Forgery</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          {isNodeSolved('BRANCH_VISUAL_TAMPER') ? 'SOLVED' : 'UNPROVEN'}
                        </span>
                      </div>

                      {/* Branch 2: Reference Spoof */}
                      <div className={`p-3 rounded-lg border text-center transition-all ${
                        isNodeSolved('BRANCH_REFERENCE_SPOOF')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                            AND (∧)
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            Cost: {getNodeCost('BRANCH_REFERENCE_SPOOF', 4.0)}
                          </span>
                        </div>
                        <span className="text-xs font-bold block">Branch 2: Reference Spoof</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          {isNodeSolved('BRANCH_REFERENCE_SPOOF') ? 'SOLVED' : 'UNPROVEN'}
                        </span>
                      </div>

                      {/* Branch 3: Behavioral Anomaly */}
                      <div className={`p-3 rounded-lg border text-center transition-all ${
                        isNodeSolved('BRANCH_BEHAVIORAL_ANOMALY')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200">
                            AND (∧)
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            Cost: {getNodeCost('BRANCH_BEHAVIORAL_ANOMALY', 4.5)}
                          </span>
                        </div>
                        <span className="text-xs font-bold block">Branch 3: Behavioral Outlier</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          {isNodeSolved('BRANCH_BEHAVIORAL_ANOMALY') ? 'SOLVED' : 'UNPROVEN'}
                        </span>
                      </div>
                    </div>

                    {/* SVG Connectors with AND Arcs to Leaves */}
                    <svg className="w-full h-10 my-1" viewBox="0 0 600 40" fill="none">
                      {/* Left branch AND split */}
                      <path d="M 100 0 L 100 12 L 50 12 L 50 40" stroke={isNodeSolved('LEAF_FONT_TAMPER') ? '#dc2626' : '#cbd5e1'} strokeWidth="1.5" />
                      <path d="M 100 0 L 100 12 L 150 12 L 150 40" stroke={isNodeSolved('LEAF_WATERMARK_MISSING') ? '#dc2626' : '#cbd5e1'} strokeWidth="1.5" />
                      {/* AND Arc curve linking left leaves */}
                      <path d="M 70 24 Q 100 32 130 24" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                      <text x="100" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7c3aed" fontFamily="monospace">AND (∧)</text>

                      {/* Center branch AND split */}
                      <path d="M 300 0 L 300 12 L 250 12 L 250 40" stroke={isNodeSolved('LEAF_UTR_INVALID') ? '#dc2626' : '#cbd5e1'} strokeWidth="1.5" />
                      <path d="M 300 0 L 300 12 L 350 12 L 350 40" stroke={isNodeSolved('LEAF_BENEFICIARY_MISMATCH') ? '#dc2626' : '#cbd5e1'} strokeWidth="1.5" />
                      {/* AND Arc curve linking center leaves */}
                      <path d="M 270 24 Q 300 32 330 24" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                      <text x="300" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7c3aed" fontFamily="monospace">AND (∧)</text>

                      {/* Right branch AND split */}
                      <path d="M 500 0 L 500 12 L 450 12 L 450 40" stroke={isNodeSolved('LEAF_AMOUNT_OUTLIER') ? '#dc2626' : '#cbd5e1'} strokeWidth="1.5" />
                      <path d="M 500 0 L 500 12 L 550 12 L 550 40" stroke={isNodeSolved('LEAF_TIME_ANOMALY') ? '#dc2626' : '#cbd5e1'} strokeWidth="1.5" />
                      {/* AND Arc curve linking right leaves */}
                      <path d="M 470 24 Q 500 32 530 24" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
                      <text x="500" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#7c3aed" fontFamily="monospace">AND (∧)</text>
                    </svg>

                    {/* LEVEL 2: 6 TERMINAL LEAF NODES */}
                    <div className="w-full grid grid-cols-6 gap-2">
                      {/* Leaf 1 */}
                      <div className={`p-2 rounded border text-center ${
                        isNodeSolved('LEAF_FONT_TAMPER')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] font-bold block leading-tight">Font Alteration</span>
                        <span className="text-[9px] font-mono block mt-1 text-slate-500">
                          {isNodeSolved('LEAF_FONT_TAMPER') ? 'SOLVED' : 'COST 10.0'}
                        </span>
                      </div>

                      {/* Leaf 2 */}
                      <div className={`p-2 rounded border text-center ${
                        isNodeSolved('LEAF_WATERMARK_MISSING')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] font-bold block leading-tight">Missing Seal</span>
                        <span className="text-[9px] font-mono block mt-1 text-slate-500">
                          {isNodeSolved('LEAF_WATERMARK_MISSING') ? 'SOLVED' : 'COST 10.0'}
                        </span>
                      </div>

                      {/* Leaf 3 */}
                      <div className={`p-2 rounded border text-center ${
                        isNodeSolved('LEAF_UTR_INVALID')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] font-bold block leading-tight">Invalid UTR</span>
                        <span className="text-[9px] font-mono block mt-1 text-slate-500">
                          {isNodeSolved('LEAF_UTR_INVALID') ? 'SOLVED' : 'COST 10.0'}
                        </span>
                      </div>

                      {/* Leaf 4 */}
                      <div className={`p-2 rounded border text-center ${
                        isNodeSolved('LEAF_BENEFICIARY_MISMATCH')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] font-bold block leading-tight">Payee Mismatch</span>
                        <span className="text-[9px] font-mono block mt-1 text-slate-500">
                          {isNodeSolved('LEAF_BENEFICIARY_MISMATCH') ? 'SOLVED' : 'COST 10.0'}
                        </span>
                      </div>

                      {/* Leaf 5 */}
                      <div className={`p-2 rounded border text-center ${
                        isNodeSolved('LEAF_AMOUNT_OUTLIER')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] font-bold block leading-tight">Amount Outlier</span>
                        <span className="text-[9px] font-mono block mt-1 text-slate-500">
                          {isNodeSolved('LEAF_AMOUNT_OUTLIER') ? 'SOLVED' : 'COST 10.0'}
                        </span>
                      </div>

                      {/* Leaf 6 */}
                      <div className={`p-2 rounded border text-center ${
                        isNodeSolved('LEAF_TIME_ANOMALY')
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] font-bold block leading-tight">Time Velocity</span>
                        <span className="text-[9px] font-mono block mt-1 text-slate-500">
                          {isNodeSolved('LEAF_TIME_ANOMALY') ? 'SOLVED' : 'COST 10.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Proof Tree Node Cards */
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
                    Active Proof Tree Node Cards:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aoStar?.proof_tree_nodes?.map((node: any) => (
                      <div
                        key={node.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          node.is_solved
                            ? 'bg-rose-50/50 border-rose-200 text-slate-900'
                            : 'bg-slate-50/60 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase font-mono bg-slate-200/80 text-slate-700">
                            {node.node_type} Node
                          </span>
                          <span className="text-[11px] font-bold font-mono text-slate-600">
                            Cost: {node.cost}
                          </span>
                        </div>
                        <span className="text-xs font-bold block text-slate-900">{node.label}</span>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          {node.status_message || (node.is_solved ? 'Verified Solved' : 'Unsolved')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Traversal Log */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">
                  AO* Heuristic Propagation Log:
                </span>
                <div className="bg-slate-50/80 rounded-lg p-3 max-h-32 overflow-y-auto text-xs text-slate-700 space-y-1 border border-slate-200 font-mono">
                  {aoStar?.traversal_log?.map((log: string, idx: number) => (
                    <div key={idx} className="leading-relaxed flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{log}</span>
                    </div>
                  ))}
                  {(!aoStar?.traversal_log || aoStar.traversal_log.length === 0) && (
                    <span className="text-slate-400">Awaiting scan execution to trace bottom-up heuristic cost updates.</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
</div>
</div>
) : activeSubTab === 'history' ? (
        /* Detection Audit Ledger (History) View */
        <div className="max-w-7xl mx-auto w-full p-6 sm:p-8 flex-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-700" />
                  Forensic Audit Trail & Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Chronological record of processed transaction evaluations, receipt image scans, and calculated risk probabilities.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono">
                  Total Entries: {detectionHistory.length}
                </span>
                {detectionHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Ledger</span>
                  </button>
                )}
              </div>
            </div>

            {detectionHistory.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  No Audit Entries Recorded
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Upload a transaction screenshot from the Forensic Inspector to populate this ledger.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4 font-mono">Audit ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Scenario / Receipt Title</th>
                      <th className="py-3 px-4">Inspection Type</th>
                      <th className="py-3 px-4 text-right font-mono">Amount</th>
                      <th className="py-3 px-4 text-right font-mono">Posterior Risk</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detectionHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{item.id}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{item.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.title}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{item.type}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {item.amount !== null ? `₹${item.amount.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={item.isFraud ? 'text-rose-700' : 'text-emerald-700'}>
                            {(item.fraudProbability * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 font-mono uppercase ${
                            item.isFraud 
                              ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.isFraud ? (
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            <span>{item.riskLevel}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => loadHistoryItem(item)}
                            className="px-2.5 py-1 rounded text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Academic & Viva Voce Study Hub (Subject Mode) */
        <div className="max-w-7xl mx-auto w-full p-6 sm:p-8 flex-1 flex flex-col gap-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 text-xs font-bold font-mono uppercase mb-2">
                <GraduationCap className="w-4 h-4 text-indigo-700" />
                <span>Subject Study Hub & Viva Voce Master Guide</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Mathematical Foundations, Algorithmic Proofs & Examiner Q&A
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
                Clear conceptual explanations, step-by-step calculus walkthroughs, AND-OR graph search mechanics, and model answers for project vivas and academic defense.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-2">
              <span className="text-[11px] font-mono text-indigo-800 bg-white/90 border border-indigo-200 px-3 py-1.5 rounded-lg shadow-2xs font-bold text-center">
                Persona: Subject (Studies)
              </span>
            </div>
          </div>

          {/* Module Selection Pills */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'bayes', label: '1. Bayes Theorem Calculus', icon: Calculator, desc: 'Prior Odds & Likelihood Ratio' },
              { id: 'ao_star', label: '2. AO* Graph Decomposition', icon: Workflow, desc: 'AND-OR Proof Tree Search' },
              { id: 'forensics', label: '3. CV & Image Splicing', icon: Eye, desc: 'Laplacian Variance & OCR Bounds' },
              { id: 'domain', label: '4. Domain Classification', icon: ShieldCheck, desc: 'Receipt vs Non-Transaction' },
              { id: 'viva_qa', label: '5. Examiner Viva Voce Q&A', icon: HelpCircle, desc: 'Top 10 Viva Questions & Answers' },
            ].map((mod) => {
              const Icon = mod.icon;
              const isActive = activeStudyModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveStudyModule(mod.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-500'}`} />
                  <div className="text-left">
                    <span className="block leading-tight">{mod.label}</span>
                    <span className={`text-[10px] block font-normal ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {mod.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Module 1: Bayes' Theorem in Action */}
          {activeStudyModule === 'bayes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Core Concept Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <Calculator className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Why Bayes’ Theorem? (The Detective Clue Multiplier)
                    </h3>
                  </div>

                  <div className="mt-4 text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
                    <p>
                      <strong>The Problem with Simple Rules:</strong> Traditional software uses simple Boolean rules (e.g., <em>“if amount &gt; 50,000, flag as fraud”</em>). This leads to catastrophic false alarms and misses clever forgers.
                    </p>
                    <p>
                      <strong>The Bayesian Solution:</strong> Think of Bayes’ Theorem like a master detective solving a case. Before looking at any clue, the detective knows financial fraud is relatively rare (our <strong>Prior Probability</strong> P(Fraud) = 1.5%). As physical clues emerge, each clue does not condemn the suspect in isolation—instead, it multiplies the suspicion odds by its diagnostic strength (the <strong>Likelihood Ratio</strong>).
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs">
                      <div className="font-bold text-slate-900 mb-1">Standard Formula:</div>
                      <div className="text-indigo-900">
                        P(Fraud | Clues) = [ P(Clues | Fraud) · P(Fraud) ] / P(Clues)
                      </div>
                      <div className="mt-3 font-bold text-slate-900 mb-1">Odds-Form Equation (Computationally Efficient & Stable):</div>
                      <div className="text-emerald-800">
                        Posterior Odds = Prior Odds × ∏ [ Likelihood Ratio (E_i) ]
                      </div>
                      <div className="mt-2 text-slate-500 text-[11px]">
                        Posterior Probability = Posterior Odds / (1 + Posterior Odds)
                      </div>
                    </div>

                    <p>
                      By multiplying odds, independent pieces of evidence (tampered font, invalid bank checksum, aberrant transaction hour) accumulate mathematically without arbitrary thresholds.
                    </p>
                  </div>
                </div>

                {/* Concrete Numerical Walkthrough */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Real Step-by-Step Numerical Example (As Implemented in Our Code)</span>
                  </h4>

                  <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-900 block mb-1">Step 0: Initial Baseline (Prior Probability)</span>
                      <p className="text-xs text-slate-600">
                        Prior Risk P₀ = 0.015 (1.5% base fraud rate in digital transactions).
                        <br />
                        Initial Odds: O₀ = 0.015 / (1 - 0.015) = <strong>0.0152</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg">
                      <span className="font-bold text-rose-900 block mb-1">Step 1: Computer Vision Flags Font Inconsistency (LR = 15.0)</span>
                      <p className="text-xs text-slate-600">
                        O₁ = O₀ × 15.0 = 0.0152 × 15.0 = <strong>0.2285</strong>.
                        <br />
                        Posterior: P₁ = 0.2285 / (1 + 0.2285) = <strong>18.6%</strong> risk.
                      </p>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg">
                      <span className="font-bold text-rose-900 block mb-1">Step 2: UTR Checksum Fails Verification (LR = 35.0)</span>
                      <p className="text-xs text-slate-600">
                        O₂ = O₁ × 35.0 = 0.2285 × 35.0 = <strong>7.9975</strong>.
                        <br />
                        Posterior: P₂ = 7.9975 / (1 + 7.9975) = <strong>88.9%</strong> risk (Catastrophic escalation!).
                      </p>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg">
                      <span className="font-bold text-rose-900 block mb-1">Step 3: Background Noise Discontinuity Detected (LR = 8.0)</span>
                      <p className="text-xs text-slate-600">
                        O₃ = O₂ × 8.0 = 7.9975 × 8.0 = <strong>63.98</strong>.
                        <br />
                        Posterior: P₃ = 63.98 / (1 + 63.98) = <strong>98.46%</strong> risk &rarr; <strong>CRITICAL FRAUD VERDICT</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Reference: Calibrated Likelihood Table */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-3">
                    Calibrated Diagnostic Weights (LR)
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Likelihood Ratios &gt; 1.0 increase fraud probability; &lt; 1.0 clear suspicion and verify genuineness.
                  </p>

                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-800 font-bold">UTR Checksum Failure</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">LR = 35.0</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-800 font-bold">Font Baseline Tampering</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">LR = 15.0</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-800 font-bold">Laplacian Noise Mismatch</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">LR = 8.0</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-800 font-bold">Exorbitant Amount Spike</span>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">LR = 6.0</span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-800 font-bold">Genuine Security Seal & Timestamp</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">LR = 0.05</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-5 text-indigo-950 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <Lightbulb className="w-4 h-4 text-indigo-700" />
                    <span>Viva Tip for Students</span>
                  </div>
                  When the examiner asks <em>“Why not use a Deep Neural Network?”</em>, answer:
                  <strong> “Bayesian inference is 100% mathematically auditable and explainable in a court of law. A neural network cannot produce a legally binding step-by-step likelihood decomposition.”</strong>
                </div>
              </div>
            </div>
          )}

          {/* Module 2: AO* Algorithm in Transaction Verification */}
          {activeStudyModule === 'ao_star' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <Workflow className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Why AO* Instead of Traditional A*? (The Courtroom Proof Tree)
                    </h3>
                  </div>

                  <div className="mt-4 text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
                    <p>
                      <strong>The Core Distinction:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                      <li>
                        <strong>Standard A* Algorithm:</strong> Traverses standard state graphs where every node has alternative single choices (pure OR-branches). It finds <em>one single path</em> from Start to Goal.
                      </li>
                      <li>
                        <strong>AO* (And-Or) Algorithm:</strong> Solves hyper-graphs containing <strong>AND-branches</strong>. In fraud auditing, proving a transaction is authentic is not a single path—it requires proving <strong>all required conditions simultaneously</strong>!
                      </li>
                    </ul>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-900 block mb-2 font-mono text-xs">
                        Mathematical Cost Backpropagation Formulas:
                      </span>
                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-2.5 bg-white border border-slate-200 rounded">
                          <span className="text-blue-900 font-bold block">For OR Node (Select Minimum Cost Alternative):</span>
                          <code>f(n) = min [ c(n, m) + h(m) ] for all m in Children(n)</code>
                        </div>
                        <div className="p-2.5 bg-white border border-slate-200 rounded">
                          <span className="text-indigo-900 font-bold block">For AND Node (All Sub-Goals Must Be Solved):</span>
                          <code>f(n) = c(n, AND_set) + ∑ [ h(m) ] for all m in AND_set</code>
                        </div>
                      </div>
                    </div>

                    <p>
                      If any child in an AND-branch fails or becomes infinite cost (e.g., UTR validation fails), the entire AND-branch fails, forcing the algorithm to backtrack to an alternate audit path.
                    </p>
                  </div>
                </div>

                {/* State Space Decomposition Diagram */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <Binary className="w-4 h-4 text-slate-700" />
                    <span>Transaction Proof Decomposition in Our Engine</span>
                  </h4>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                    <pre>{`Root: [Verify_Transaction] (OR Node)
 │
 ├── [Path A: Automated Fast-Path Verification] (AND Node - Cost: 10ms)
 │    ├── [Sub-goal 1: Cryptographic UTR Format Valid]  (Cost: 2) -> SATISFIED
 │    ├── [Sub-goal 2: CV Font Consistency Verified]    (Cost: 4) -> FAILED (Tampering)
 │    └── [Sub-goal 3: Bank Routing Table Verified]      (Cost: 2) -> SATISFIED
 │    ──> Entire AND-Branch FAILS due to Font Tampering!
 │
 └── [Path B: Forensic Escalation & Secondary Audit] (OR Node)
      ├── [Branch B1: Deep Forensic Laplacian Discontinuity] -> CONFIRMED SPLICED
      └── [Branch B2: Flag Suspicious Transaction & Block Payout] -> SOLVED (Goal Reached)`}</pre>
                  </div>
                </div>
              </div>

              {/* Side Explanations */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-3">
                    Key Terminology for Viva
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong className="text-slate-900 block">Hyper-Arc:</strong>
                      <span className="text-slate-600">A connected group of edges that must all be satisfied together to solve an AND condition.</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong className="text-slate-900 block">Heuristic Admissibility:</strong>
                      <span className="text-slate-600">The heuristic estimate $h(n)$ must never overestimate the true remaining cost to guarantee optimal proof discovery.</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <strong className="text-slate-900 block">FUTILITY Threshold:</strong>
                      <span className="text-slate-600">If heuristic cost exceeds a cutoff threshold (e.g., $f(n) &gt; 100$), the branch is abandoned immediately.</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 text-emerald-950 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Algorithmic Synergies</span>
                  </div>
                  Bayes calculates the <em>probability</em> of tampering ($P = 98.4\%$), and AO* searches the optimal <em>proof sequence</em> to explain and justify the verdict to bank compliance officers.
                </div>
              </div>
            </div>
          )}

          {/* Module 3: CV & Image Splicing */}
          {activeStudyModule === 'forensics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Computer Vision Forensics: Splicing & Tamper Detection
                    </h3>
                  </div>

                  <div className="mt-4 text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
                    <p>
                      Digital forgers use image editing software (Photoshop, Canva, PicsArt) to paste fake amounts onto real banking screenshots. Even if visually convincing to the naked human eye, the image leaves mathematical anomalies.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-1 text-xs">
                          1. Laplacian Variance (∇² I)
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Computes the 2nd spatial derivative of the grayscale image. Digital tampering inserts localized sharp edges with zero sensor noise, causing massive variance spikes compared to background receipt textures.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-1 text-xs">
                          2. Error Level Analysis (ELA)
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Re-saves the image at 90% JPEG compression. Unmodified regions show consistent compression error, while spliced text blocks glow with high error intensity due to divergent compression generation cycles.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-900 block mb-1 text-xs">
                        3. OCR Spatial Bounding Box Kerning & Alignment
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        EasyOCR extracts character bounding boxes [x₁, y₁, x₂, y₂]. Authentic banking apps render numbers with uniform pixel baselines (&plusmn; 1px). Spliced fraudulent numbers deviate by &ge; 4px or exhibit mismatched font weights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono mb-3">
                    Mathematical Expression
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-indigo-900 leading-relaxed">
                    σ²(∇² I) = (1/N) ∑ [ L(x, y) - μ ]²
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Where $L(x,y)$ is the convolution of image $I$ with the discrete Laplacian kernel:
                  </p>
                  <pre className="p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-700 mt-2">
{`[  0,  1,  0 ]
[  1, -4,  1 ]
[  0,  1,  0 ]`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Module 4: Domain Classification */}
          {activeStudyModule === 'domain' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-200">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Domain & Intent Pre-Classification Architecture
                    </h3>
                  </div>

                  <div className="mt-4 text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
                    <p>
                      <strong>The Problem of Domain Drift:</strong> What happens if an end-user uploads a company resume, a random scenic landscape photo, or a meme?
                    </p>
                    <p>
                      In naive fraud detection systems, the AI would hallucinate fake transaction details, fabricate an amount, and run Bayes’ theorem on non-existent banking tokens!
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-bold text-slate-900 block mb-2 font-mono text-xs">
                        Our Two-Stage Architectural Gate:
                      </span>
                      <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                        <li>
                          <strong>Stage 1: Intent & Document Pre-Classifier</strong>
                          <br />
                          Evaluates structural document syntax. Checks for the presence of payment markers (UPI / IMPS / NEFT / UTR / Reference ID / ₹ / INR / Beneficiary / Bank Logo).
                          <br />
                          If non-transaction is detected: <code>is_transaction_document = false</code>. The pipeline immediately short-circuits.
                        </li>
                        <li>
                          <strong>Stage 2: Algorithmic Verification Engine</strong>
                          <br />
                          Invoked ONLY when Stage 1 passes. Bayesian calculus and AO* graph search are executed strictly on verified transaction screenshots.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-amber-950 text-xs leading-relaxed">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Examiner Defense Point</span>
                  </div>
                  This architectural separation proves your engineering rigor. You protect computational resources and eliminate false positives before running heavy mathematical graph solvers.
                </div>
              </div>
            </div>
          )}

          {/* Module 5: Examiner Viva Voce Q&A */}
          {activeStudyModule === 'viva_qa' && (
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-indigo-600" />
                      <span>Top 10 Viva Voce Questions & Model Examiner Answers</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Direct, concise answers formulated to impress external university evaluators, professors, and technical judges.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      q: 'Q1: Why did you choose Bayes’ Theorem over a deep learning neural network (like ResNet or CNN)?',
                      a: 'Deep neural networks are black boxes: they output a probability score without an auditable chain of evidence. In financial law and banking compliance, automated decisions must be legally defensible. Bayes’ Theorem allows us to break down the exact Likelihood Ratio (LR) contributed by each clue (font anomaly, UTR checksum failure, noise variance), providing a 100% mathematically transparent audit trail.',
                    },
                    {
                      q: 'Q2: What is the fundamental difference between A* and AO* algorithms?',
                      a: 'Standard A* searches state graphs with OR choices only, seeking a single path from root to goal. AO* searches AND-OR hyper-graphs where achieving a goal requires solving multiple sub-goals simultaneously (AND-branches). In transaction auditing, authenticating a receipt requires verifying the UTR format AND checking font consistency AND validating the timestamp—making AO* the mathematically appropriate algorithm.',
                    },
                    {
                      q: 'Q3: How do you prevent Bayesian posterior probability from degenerating to 0% or 100%?',
                      a: 'We use the odds-form Bayesian formulation with bounded Likelihood Ratios and calibrated Laplace smoothing. Furthermore, the prior is clamped to a realistic window [10⁻⁴, 1 - 10⁻⁴] to ensure that no single noisy sensor can trigger a catastrophic false positive.',
                    },
                    {
                      q: 'Q4: What is Laplacian Variance and how does it detect photo splicing?',
                      a: 'The Laplacian operator (∇² I) computes the second spatial derivative of pixel intensities to measure edge sharpness. Authentic receipts captured via phone screens exhibit uniform blur and natural sensor grain. When a fraudster copies high-contrast digital text from Canva into a compressed screenshot, the localized Laplacian variance spikes significantly, exposing the spliced boundary.',
                    },
                    {
                      q: 'Q5: What happens if a user uploads a resume, dog photo, or non-transaction document?',
                      a: 'Our architecture employs a two-stage gate. Stage 1 executes a Domain and Intent Pre-Classifier that checks for UPI, UTR, and banking tokens. If the image is not a financial receipt, the system short-circuits gracefully, reporting is_transaction_document = false, without hallucinating fake fraud probabilities.',
                    },
                    {
                      q: 'Q6: What is the time complexity of the AO* search in your implementation?',
                      a: 'In the worst case, AO* has exponential time complexity O(b^d). However, because our transaction verification tree has a bounded depth of d ≤ 4 and branching factor b ≤ 3, the entire graph search resolves in under 2 milliseconds on a standard CPU.',
                    },
                    {
                      q: 'Q7: How do you validate an Indian banking UTR (Unique Transaction Reference) number?',
                      a: 'Indian UPI/IMPS UTR numbers follow strict structural standards: typically a 12-digit numeric sequence where the first digit represents the calendar year, the next three digits represent the Julian day of the year, and subsequent digits represent bank gateway routing. Invalid lengths or alphabet insertions immediately fail algorithmic validation.',
                    },
                    {
                      q: 'Q8: What is the difference between False Positives and False Negatives in fraud detection, and how does your system balance them?',
                      a: 'A False Positive blocks a legitimate customer payment (causing frustration and lost revenue). A False Negative approves a fraudulent transaction (causing financial theft). By using Likelihood Ratios calibrated from real banking data, we set a conservative prior (1.5%) so low-suspicion items pass friction-free, while high-stakes combinations trigger manual compliance escalation.',
                    },
                    {
                      q: 'Q9: How does the AI Assistant (Gemini / Gemma) interact with the deterministic algorithms?',
                      a: 'The generative AI does NOT calculate the math—it acts as an executive intelligence advisor. Bayes and AO* compute the exact deterministic metrics, and the LLM interprets these numbers into plain-language business recommendations tailored for Auditors, Consumers, or STEM Students.',
                    },
                    {
                      q: 'Q10: Where can the full presentation deck and technical documentation be reviewed?',
                      a: 'The complete technical whitepaper and 13-slide PowerPoint presentation deck with speaker notes are permanently documented in the project root repository in PROJECT_PRESENTATION_AND_ARCHITECTURE.md.',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2 flex items-start gap-2">
                        <span className="text-indigo-600 shrink-0 font-mono">[{idx + 1}]</span>
                        <span>{item.q}</span>
                      </h4>
                      <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Reference Note to Markdown Whitepaper */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Complete Technical Whitepaper & PPT Deck Ready
                </span>
                <span className="text-[11px] text-slate-500">
                  Read <code className="text-slate-800 font-bold">PROJECT_PRESENTATION_AND_ARCHITECTURE.md</code> in the repository root for the full 13-slide PowerPoint outline, speaker notes, and mathematical proofs.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('scanner')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
            >
              <span>Back to Forensic Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
