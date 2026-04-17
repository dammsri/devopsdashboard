import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { applicationsApi } from "../api/services";
import { RiServerLine, RiStackLine, RiCheckboxCircleLine, RiErrorWarningLine, RiCloseCircleLine } from "react-icons/ri";

export default function EnvironmentSummary() {
  const { appId, envId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    applicationsApi.getEnvironmentDetails(appId, envId)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appId, envId]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading environment data...</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load environment data.</div>;

  const getStatusIcon = (status) => {
      const s = status?.toLowerCase();
      if (s === "healthy" || s === "ready" || s === "running") return <RiCheckboxCircleLine className="text-emerald-500" />;
      if (s === "degraded" || s === "warning") return <RiErrorWarningLine className="text-amber-500" />;
      return <RiCloseCircleLine className="text-red-500" />;
  };

  const getStatusClass = (status) => {
      const s = status?.toLowerCase();
      if (s === "healthy" || s === "ready" || s === "running") return "badge-success";
      if (s === "degraded" || s === "warning") return "badge-warning";
      return "badge-danger";
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{data.app_name || data.application?.name || "Application"}</p>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    {data.name} Environment
                    <span className={`badge text-sm px-3 py-1 ${getStatusClass(data.status)}`}>
                        {data.status}
                    </span>
                </h1>
            </div>
            <div className="text-right">
                <p className="text-sm text-slate-500 dark:text-slate-400">Last Deployment</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                    {data.last_deployment && data.last_deployment !== "N/A" ? new Date(data.last_deployment).toLocaleString() : "N/A"}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Infra Servers */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <RiServerLine className="text-brand-500" /> Infrastructure Servers
                </h2>
                <div className="grid gap-4">
                    {data.infra_servers && data.infra_servers.length > 0 ? (
                        data.infra_servers.map((server, idx) => (
                            <div key={idx} className="glass rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <RiServerLine className="text-slate-500 dark:text-slate-400 text-lg" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                                            {server.name || server.hostname} {getStatusIcon(server.status)}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{server.ip || server.ip_address} • {server.type || server.role || "Compute"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 sm:border-l sm:border-slate-200 sm:dark:border-slate-700 sm:pl-4">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">CPU</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{server.cpu_usage || "N/A"}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500">MEM</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{server.mem_usage || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-slate-400 italic text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">Nothing to display</div>
                    )}
                </div>
            </div>

            {/* Deployed Components */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <RiStackLine className="text-indigo-500" /> Platform Services
                </h2>
                <div className="overflow-hidden glass rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3 font-medium">Service Name</th>
                                <th className="px-4 py-3 font-medium">Description</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.services?.length > 0 ? (
                                data.services.map((svc, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{svc.name}</td>
                                        <td className="px-4 py-3 text-slate-500 italic">{svc.description || "No description provided."}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${getStatusClass(svc.status)}`}>
                                                {svc.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-4 py-10 text-center text-slate-400 italic">No services registered for this environment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
}
