import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiLightbulbLine, RiRefreshLine, RiArrowRightSLine } from 'react-icons/ri';
import { useAIStore } from '../../store/aiStore';

const AIInsightsCard = () => {
  const { insights, fetchInsights, isLoading } = useAIStore();

  useEffect(() => {
    if (insights.length === 0) {
      fetchInsights();
    }
  }, []);

  return (
    <div className="glass rounded-[2.5rem] overflow-hidden h-full flex flex-col border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
            <RiLightbulbLine size={18} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">AI Proactive Insights</h3>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={isLoading}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-200"
        >
          <RiRefreshLine size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
        {insights.length === 0 && !isLoading ? (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic">
            No insights available at the moment.
          </div>
        ) : (
          insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border group cursor-pointer
                         bg-slate-100/50 dark:bg-slate-700/30 
                         border-transparent 
                         hover:bg-slate-50 dark:hover:bg-slate-700/60 
                         hover:shadow-md hover:border-brand-100 dark:hover:border-brand-900/40
                         hover:-translate-y-0.5"
            >
              <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-400 group-hover:bg-brand-600 dark:group-hover:bg-brand-400 transition-colors shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{insight}</p>
              </div>
              <RiArrowRightSLine className="text-slate-300 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 self-center transition-colors" />
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-100/40 dark:bg-slate-800/40 border-t border-slate-200/60 dark:border-slate-700/60">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center font-bold">
          Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default AIInsightsCard;
