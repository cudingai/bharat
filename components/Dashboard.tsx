
import React from 'react';
import { LeakageStats, Transaction, Language } from '../types';
import { translations } from '../translations';

interface DashboardProps {
  stats: LeakageStats;
  recentTransactions: Transaction[];
  aiInsight: string;
  onViewAll: () => void;
  lang: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentTransactions, aiInsight, onViewAll, lang }) => {
  const t = translations[lang];

  return (
    <div className="px-6 pt-12 pb-32 space-y-8 max-w-lg mx-auto" lang={lang}>
      {/* Zen Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-outfit font-semibold tracking-tight text-gray-900">Axiony</h1>
          <p className="text-sm text-gray-400 font-medium">{t.slogan}</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-100 transition-colors shadow-sm active:scale-95">
          <i className="fa-solid fa-bell"></i>
        </button>
      </div>

      {/* The Central Score */}
      <div className="relative py-8 flex flex-col items-center justify-center">
        <div className="absolute w-64 h-64 bg-[#4FA3A5] rounded-full blur-3xl opacity-5 pulse-aura"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-2">{t.leakageScore}</span>
          <div className="text-9xl font-outfit font-bold text-gray-900 leading-none">
            {stats.leakageScore}
          </div>
          <div className="mt-4 px-4 py-1.5 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-teal-600 uppercase tracking-widest shadow-sm">
            {stats.leakageScore < 40 ? (lang === 'en' ? 'Calm Waters' : '✓') : (lang === 'en' ? 'Active Leakage' : '⚠')}
          </div>
        </div>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bento-card p-6 flex flex-col justify-between aspect-square">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <i className="fa-solid fa-droplet text-sm"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t.todayLeak}</p>
            <p className="text-2xl font-outfit font-bold">₹{stats.todayTotal}</p>
          </div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-between aspect-square">
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <i className="fa-solid fa-bolt text-sm"></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t.mostLeaky}</p>
            <p className="text-lg font-outfit font-bold truncate">{stats.topCategory}</p>
          </div>
        </div>
      </div>

      {/* AI Intelligence Strip */}
      <div className="bento-card p-6 border-l-4 border-l-teal-500">
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">{t.pennytraceAI}</span>
        </div>
        <p className="text-sm leading-relaxed text-gray-600 font-medium italic">
          "{aiInsight}"
        </p>
      </div>

      {/* Mini Feed */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t.recentFlow}</h3>
          <button 
            onClick={onViewAll}
            className="text-[10px] font-bold text-teal-600 uppercase hover:underline active:opacity-70 transition-all"
          >
            {t.history}
          </button>
        </div>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 hover:border-teal-100 transition-colors shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{tx.merchant}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{tx.category}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900">₹{tx.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
