import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { skeEnvironmentsApi } from "../api/services";
import { RiRocketLine, RiArrowRightSLine } from "react-icons/ri";
import { SiKubernetes } from "react-icons/si";
import HexagonCard from "../components/ui/HexagonCard";

import { usePreferences } from "../context/PreferencesContext";

export default function SKEEnvironmentServiceGrid() {
  const { skeEnvId } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { layoutStyle } = usePreferences();

  useEffect(() => {
    setLoading(true);
    skeEnvironmentsApi.getEnvironmentServices(skeEnvId)
      .then(res => setServices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [skeEnvId]);

  const getStatusColor = (status) => {
    const s = status?.trim().toLowerCase();
    switch (s) {
      case "running":
      case "healthy":
      case "ready":   return "text-emerald-500";
      case "warning":
      case "degraded": return "text-amber-500";
      case "failed":
      case "error":   return "text-red-500";
      default:        return "text-slate-400";
    }
  };

  const getStatusBg = (status) => {
    const s = status?.trim().toLowerCase();
    switch (s) {
      case "running":
      case "healthy":
      case "ready":   return "bg-emerald-50 dark:bg-emerald-900/20";
      case "warning":
      case "degraded": return "bg-amber-50 dark:bg-amber-900/20";
      case "failed":
      case "error":   return "bg-red-50 dark:bg-red-900/20";
      default:        return "bg-slate-50 dark:bg-slate-900/40";
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading {skeEnvId} services...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link to="/dashboard/skeenvironments" className="hover:text-brand-600 transition-colors">SKE Environments</Link>
          <RiArrowRightSLine />
          <span className="uppercase">{skeEnvId}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <SiKubernetes className="text-brand-500" /> Environment {skeEnvId.toUpperCase()}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Service mesh overview. Select a service to view health metrics, replicas, and pod logs.
        </p>
      </div>

      {layoutStyle === "table" ? (
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Service Name</th>
                  <th className="px-6 py-4 font-semibold">Version</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {services?.map(svc => (
                    <tr key={svc.service_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium flex items-center gap-3">
                        <RiRocketLine className={`text-brand-500 text-lg ${getStatusColor(svc.status)}`} /> {svc.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{svc.version}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBg(svc.status)} ${getStatusColor(svc.status)}`}>
                          {svc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/dashboard/skeenvironments/${skeEnvId}/services/${svc.service_id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
                          Inspect
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
            {Array.from({ length: Math.ceil((services?.length || 0) / 4) }).map((_, rowIndex) => {
              const rowServices = (services || []).slice(rowIndex * 4, (rowIndex + 1) * 4);
              return (
                <div key={rowIndex} className="honeycomb-row">
                  {rowServices.map((svc) => (
                    <HexagonCard
                      key={svc.service_id}
                      title={svc.name}
                      subtitle={svc.version}
                      status={svc.status}
                      icon={RiRocketLine}
                      to={`/dashboard/skeenvironments/${skeEnvId}/services/${svc.service_id}`}
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
