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
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center text-white shadow-sm shadow-rose-200">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base text-slate-900 font-bold tracking-tight leading-none">
              AI-Based Fraud Detection in Transactions
            </span>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-rose-600" />
              Bayes + AO* Search
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
            Multimodal Receipt Forensics & Probabilistic Decision Graph
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
        <button
          onClick={() => onTabChange?.('fraud')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'fraud'
              ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Fraud Detection & Screenshots</span>
        </button>
        <button
          onClick={() => onTabChange?.('documents')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'documents'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Document Intelligence</span>
        </button>
      </div>

      {/* Center / Right controls: Role Selector & System Capabilities */}
      <div className="flex items-center space-x-3">
        {/* Role Mode Selector */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-700" />
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
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
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

