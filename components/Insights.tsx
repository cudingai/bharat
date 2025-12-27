
import React from 'react';
import { Transaction, Language } from '../types';
import { translations } from '../translations';

interface InsightsProps {
  transactions: Transaction[];
  lang: Language;
}

const Insights: React.FC<InsightsProps> = ({ transactions, lang }) => {
  const t = translations[lang];
  const categories = ['Food', 'Travel', 'Subscriptions', 'Impulse', 'Misc'];
  const data = categories.map(cat => ({
    name: cat,
    total: transactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  }));
  const max = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="px-6 pt-12 pb-32 space-y-10 max-w-lg mx-auto" lang={lang}>
      <div className="space-y-1">
        <h2 className="text-3xl font-outfit font-semibold text-gray-900">{t.insights}</h2>
        <p className="text-sm text-gray-400 font-medium">{t.dataViz}</p>
      </div>

      {/* Custom SVG Bar Chart */}
      <div className="bento-card p-8">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">{t.categoryLeakage}</h3>
        <div className="space-y-6">
          {data.map((d, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{d.name}</span>
                <span className="text-xs font-bold text-gray-400">₹{d.total}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${(d.total / max) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spending Character Card */}
      <div className="bento-card p-8 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">{t.persona}</p>
        <h4 className="text-2xl font-outfit font-bold mb-2 text-teal-400">
          {lang === 'en' ? 'The Conscious Drifter' : '✓'}
        </h4>
        <p className="text-sm opacity-70 leading-relaxed font-medium">
          {lang === 'en' 
            ? 'Your small spends are frequent but calculated. You value convenience at a micro-scale.'
            : 'আপনার ছোট খরচগুলো নিয়মিত হলেও পরিকল্পিত।'}
        </p>
      </div>
    </div>
  );
};

export default Insights;
