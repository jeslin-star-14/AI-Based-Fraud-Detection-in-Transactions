import React, { useRef, useEffect } from 'react';
import { BarChart3, GitCompare, Sparkles, Layers, Calculator } from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode, ChatAttachment } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: MessageType[];
  isLoading: boolean;
  selectedCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  onFileUpload?: (files: FileList | File[]) => void;
  stagedAttachments?: ChatAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onOpenConflicts: (conflicts: ConflictRecord[]) => void;
  language: LanguageCode;
  selectedDocName?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  selectedCitation,
  onCitationClick,
  onSendMessage,
  onFileUpload,
  stagedAttachments = [],
  onRemoveAttachment,
  onOpenConflicts,
  language,
  selectedDocName,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, stagedAttachments.length]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto select-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center mb-4 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Multimodal Document Intelligence
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
              Upload documents or ask natural inquiries to query across PDFs, scans, charts, and tables with pixel-level visual citations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full text-left">
              <button
                onClick={() => onSendMessage("Summarize the key metrics and figures across the uploaded documents.")}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50/80 transition-all text-xs text-slate-700 cursor-pointer group flex items-start gap-3 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-indigo-100">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 block">Summarize Metrics</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">Extract key KPIs, figures, and dates</span>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Are there any conflicting numbers or statements between the files?")}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:bg-slate-50/80 transition-all text-xs text-slate-700 cursor-pointer group flex items-start gap-3 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-rose-100">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 block">Detect Conflicts</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">Cross-document discrepancy audit</span>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Extract all charts, vector drawings, and visual figures.")}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50/80 transition-all text-xs text-slate-700 cursor-pointer group flex items-start gap-3 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 block">Visual Figures</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">Decompile charts, plots, and axes</span>
                </div>
              </button>

              <button
                onClick={() => onSendMessage("Verify mathematical calculations and percentage variances.")}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-slate-50/80 transition-all text-xs text-slate-700 cursor-pointer group flex items-start gap-3 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-100">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-900 block">Math Verification</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block leading-snug">Deterministic AST formula derivation</span>
                </div>
              </button>
            </div>
          </div>
        ) : (


          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              selectedCitation={selectedCitation}
              onCitationClick={onCitationClick}
              onOpenConflicts={onOpenConflicts}
              language={language}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#0d5c4d] font-medium py-2">
            <span className="w-2 h-2 rounded-full bg-[#0d5c4d] animate-ping" />
            <span>Reading and analyzing document evidence...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        onFileUpload={onFileUpload}
        stagedAttachments={stagedAttachments}
        onRemoveAttachment={onRemoveAttachment}
        isLoading={isLoading}
        language={language}
        selectedDocName={selectedDocName}
      />
    </div>
  );
};
