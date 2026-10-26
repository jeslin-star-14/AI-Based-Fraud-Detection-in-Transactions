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
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-sans tracking-tight text-white font-bold leading-none flex items-center gap-2">
            AI-Based Fraud Detection in Transactions
            <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              Bayes + AO*
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium leading-tight">
            Multimodal Receipt Forensics & Probabilistic Decision Trees
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
        <button
          onClick={() => onTabChange?.('fraud')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeTab === 'fraud'
            ? 'bg-red-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Fraud Detection & Screenshots</span>
        </button>
        <button
          onClick={() => onTabChange?.('documents')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeTab === 'documents'
            ? 'bg-slate-700 text-white shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Intelligence</span>
        </button>
      </div>


      {/* Center / Right controls: Role Selector & System Capabilities */}
      <div className="flex items-center space-x-3">
        {/* Role Mode Selector */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#0d5c4d]" />
            Persona:
          </span>
          <div className="flex items-center space-x-1">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = roleMode === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleModeChange?.(r.id)}
                  title={`${r.label}: ${r.desc}`}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${isActive
                    ? 'bg-[#0d5c4d] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conflicts Modal Quick Action */}
        {onOpenConflicts && (
          <button
            onClick={onOpenConflicts}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-lg text-xs font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Audit Discrepancies</span>
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
