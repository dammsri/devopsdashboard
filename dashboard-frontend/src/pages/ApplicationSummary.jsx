import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiSearchLine, 
  RiInformationLine, 
  RiFilter3Line, 
  RiDownload2Line,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiCloseCircleFill,
  RiRefreshLine
} from 'react-icons/ri';
import { summaryApi } from '../api/services';
import StatusBadge from '../components/ui/StatusBadge';
import SkeletonTable from '../components/ui/SkeletonTable';

export default function ApplicationSummary() {
  const { itamId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await summaryApi.getApplicationSummary(itamId);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [itamId]);

  const filteredResources = useMemo(() => {
    if (!data?.resources) return [];
    return data.resources.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.environment.toLowerCase().includes(search.toLowerCase()) ||
      r.primary_identifier.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="h-20 w-1/3 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8 animate-pulse"></div>
        <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 animate-pulse"></div>
        <SkeletonTable rows={10} cols={4} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {data?.name} <span className="text-slate-400 font-normal">Summary</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Comprehensive resource view for ITAM {itamId}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <RiDownload2Line /> Export CSV
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search all resources (Name, IP, Type, Env)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold">
             Total: {data?.resources?.length || 0}
           </span>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Environment</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredResources.map((resource, idx) => (
                <motion.tr
                  key={`${resource.type}-${resource.primary_identifier}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.02 }}
                  onMouseEnter={() => setHoveredRow(`${resource.type}-${resource.primary_identifier}`)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className="group hover:bg-slate-50 dark:hover:bg-brand-900/10 border-b border-slate-50 dark:border-slate-800 transition-colors cursor-pointer relative"
                >
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3">
                      {resource.name}
                      <RiInformationLine className="text-slate-300 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    
                    {/* Simplified Detail Popover */}
                    {hoveredRow === `${resource.type}-${resource.primary_identifier}` && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute left-full ml-4 z-50 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl p-4 min-w-[240px] pointer-events-none"
                      >
                         <h4 className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-2 font-bold text-sm text-brand-600">Resource Details</h4>
                         <div className="space-y-2 text-xs">
                            <div className="flex justify-between gap-4"><span className="text-slate-400">ID:</span> <span className="font-mono">{resource.primary_identifier}</span></div>
                            {resource.details && Object.entries(resource.details).map(([k, v]) => (
                               <div key={k} className="flex justify-between gap-4">
                                 <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                                 <span>{String(v)}</span>
                               </div>
                            ))}
                         </div>
                      </motion.div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                    {resource.environment}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                       <StatusBadge status={resource.status} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredResources.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                   No resources found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
