import React from 'react';
import type { RoleMode } from '../types';
import { ShieldCheck, ShieldAlert, FileText, UserCheck, Briefcase, GraduationCap, Scale, Cpu } from 'lucide-react';


interface HeaderProps {
  roleMode?: RoleMode;
  onRoleModeChange?: (role: RoleMode) => void;
  onOpenConflicts?: () => void;
  conflictCount?: number;
  activeTab?: 'fraud' | 'documents';
  onTabChange?: (tab: 'fraud' | 'documents') => void;
}

const ROLES: { id: RoleMode; label: string; icon: any; desc: string }[] = [
  { id: 'Executive', label: 'Executive', icon: Briefcase, desc: 'High-level summaries & ROI' },
  { id: 'Auditor', label: 'Fraud Analyst', icon: ShieldCheck, desc: 'Forensic audit verification & Bayes weights' },
  { id: 'Data Scientist', label: 'AI Researcher', icon: Cpu, desc: 'Bayesian posterior & AO* graph traversal' },
  { id: 'Subject', label: 'Subject', icon: GraduationCap, desc: 'Intuitive plain-language learning' },
  { id: 'Legal Counsel', label: 'Compliance Officer', icon: Scale, desc: 'Regulatory compliance & SAR filing' },
];

export const Header: React.FC<HeaderProps> = ({
  roleMode = 'Auditor',
  onRoleModeChange,
  onOpenConflicts,
  conflictCount = 0,
  activeTab = 'fraud',
  onTabChange
}) => {
  return (
    <header 
      className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs"
      style={{ 
        fontFamily: "'Times New Roman', Times, 'Nimbus Roman No9 L', Georgia, serif",
        letterSpacing: "0.01em"
      }}
    >
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <ShieldAlert className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base text-slate-900 font-bold tracking-tight leading-none">
              AI-Based Fraud Detection in Transactions
            </span>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Bayes · AO* Graph
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-serif leading-tight mt-0.5">
            Institutional Receipt Forensics & Probabilistic Risk Engine
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => onTabChange?.('fraud')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeTab === 'fraud'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
          <span>Fraud Detection & Screenshots</span>
        </button>
        <button
          onClick={() => onTabChange?.('documents')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeTab === 'documents'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-700" />
          <span>Document Intelligence</span>
        </button>
      </div>

      {/* Center / Right controls: Role Selector & System Capabilities */}
      <div className="flex items-center space-x-3">
        {/* Sleek Persona Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-100 pl-3 pr-2 py-1 rounded-xl border border-slate-200">
          <UserCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Persona:</span>
          <select
            value={roleMode}
            onChange={(e) => onRoleModeChange?.(e.target.value as RoleMode)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-slate-500 shadow-2xs cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>


        {/* Conflicts Modal Quick Action */}
        {onOpenConflicts && (
          <button
            onClick={onOpenConflicts}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Discrepancy Audit</span>
            {conflictCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                {conflictCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

