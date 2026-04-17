import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { infrastructureApi } from "../api/services";
import { RiServerLine, RiInformationLine, RiCheckboxCircleLine, RiErrorWarningLine } from "react-icons/ri";

export default function InfrastructureServerList() {
  const { category, appId } = useParams();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    infrastructureApi.getInfrastructureServers(category, appId)
      .then(res => setServers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, appId]);

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "healthy" || s === "running" || s === "ready") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
          <RiCheckboxCircleLine className="text-sm" /> Healthy
        </span>
      );
    }
    if (s === "warning" || s === "degraded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
          <RiErrorWarningLine className="text-sm" /> Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
        {status}
      </span>
    );
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading server list...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <RiServerLine className="text-brand-500" /> 
          <span className="capitalize">{category}</span>: {appId.toUpperCase()}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Viewing detailed server specifications and health metrics for {appId} in {category}.
        </p>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hostname</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type / OS</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CPU / Memory</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {servers?.map((server) => (
                <tr key={server.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white">{server.hostname}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {server.ip_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{server.role}</span>
                      <span className="text-xs text-slate-500">{server.os || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{server.cpu || "N/A"}</span>
                      <span className="text-xs text-slate-500">{server.memory || "N/A"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(server.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
        <RiInformationLine className="text-xl text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Showing real-time data from Standard Chartered Primary VPC. Resource metrics are updated every 60 seconds.
        </p>
      </div>
    </div>
  );
}
