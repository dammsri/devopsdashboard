import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { skeEnvironmentsApi } from "../api/services";
import { SiKubernetes } from "react-icons/si";
import HexagonCard from "../components/ui/HexagonCard";

import { usePreferences } from "../context/PreferencesContext";

export default function SKEEnvironmentsIndex() {
  const [environments, setEnvironments] = useState([]);
  const { layoutStyle } = usePreferences();

  useEffect(() => {
    skeEnvironmentsApi.getEnvironments().then(r => setEnvironments(r.data)).catch(console.error);
  }, []);

  const getStatusColor = (status) => {
    const s = status?.trim().toLowerCase();
    if (s === "healthy" || s === "running" || s === "ready") return "text-emerald-500";
    if (s === "warning" || s === "degraded") return "text-amber-500";
    return "text-red-500";
  };

  const getStatusBg = (status) => {
    const s = status?.trim().toLowerCase();
    if (s === "healthy" || s === "running" || s === "ready") return "bg-emerald-50 dark:bg-emerald-900/20";
    if (s === "warning" || s === "degraded") return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <SiKubernetes className="text-brand-500" /> SKE Environments
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Management and observability for Standard Chartered Kubernetes Ecosystem (SKE) Environments.
        </p>
      </div>

      {layoutStyle === "table" ? (
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Environment Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {environments?.map(env => (
                    <tr key={env.ske_env_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium flex items-center gap-3">
                        <SiKubernetes className="text-brand-500 text-lg" /> {env.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBg(env.status)} ${getStatusColor(env.status)}`}>
                          {env.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/dashboard/skeenvironments/${env.ske_env_id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
                          Manage Services
                        </Link>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="honeycomb-container py-10">
          <div className="honeycomb-grid">
            {/* Group environments into rows of 4 for interlocking */}
            {Array.from({ length: Math.ceil((environments?.length || 0) / 4) }).map((_, rowIndex) => {
              const rowEnvs = (environments || []).slice(rowIndex * 4, (rowIndex + 1) * 4);
              return (
                <div key={rowIndex} className="honeycomb-row">
                  {rowEnvs.map((env) => (
                    <HexagonCard
                      key={env.ske_env_id}
                      title={env.name}
                      status={env.status}
                      icon={SiKubernetes}
                      to={`/dashboard/skeenvironments/${env.ske_env_id}`}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
