import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { skeEnvironmentsApi } from "../api/services";
import { RiRocketLine, RiArrowRightSLine, RiPulseLine, RiHardDrive2Line, RiSettings4Line, RiCpuLine } from "react-icons/ri";

const STATUS_BADGE = {
  running: "badge-success",
  healthy: "badge-success",
  ready: "badge-success",
  warning: "badge-warning",
  degraded: "badge-warning",
  failed: "badge-danger",
  error: "badge-danger",
};

export default function SKEServiceDetail() {
  const { skeEnvId, serviceId } = useParams();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    skeEnvironmentsApi.getServiceDetail(skeEnvId, serviceId)
      .then(res => setDetails(res.data))
      .catch(console.error);
  }, [skeEnvId, serviceId]);

  if (!details) return <div className="p-8 text-slate-500 animate-pulse">Loading service metadata...</div>;

  const badgeClass = STATUS_BADGE[details.status?.toLowerCase()] || "badge-info";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link to="/dashboard/skeenvironments" className="hover:text-brand-600 transition-colors">SKE Environments</Link>
          <RiArrowRightSLine />
          <Link to={`/dashboard/skeenvironments/${skeEnvId}`} className="uppercase hover:text-brand-600 transition-colors">{skeEnvId}</Link>
          <RiArrowRightSLine />
          <span className="font-medium text-slate-900 dark:text-white uppercase">{serviceId}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <RiRocketLine className="text-brand-500" /> {details.name}
          </h1>
          <div className="flex gap-2">
            <span className={`badge ${badgeClass}`}>{details.status}</span>
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Uptime: {details.uptime}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Replica Status */}
        <div className="stat-card md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Deployment Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border-r border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 mb-1 uppercase">Desired</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{details.replicas.desired}</p>
            </div>
            <div className="text-center p-4 border-r border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 mb-1 uppercase">Current</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{details.replicas.current}</p>
            </div>
            <div className="text-center p-4">
              <p className="text-xs text-slate-400 mb-1 uppercase">Ready</p>
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{details.replicas.ready}</p>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <RiPulseLine /> Resources
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">CPU Limit</span>
              <span className="font-mono text-brand-600 font-bold">{details.resources.cpu}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Memory Limit</span>
              <span className="font-mono text-emerald-600 font-bold">{details.resources.memory}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pods Table */}
      {details.pods && details.pods.length > 0 && (
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <RiCpuLine className="text-brand-500" />
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pod Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Pod Name</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Ready</th>
                  <th className="px-6 py-3 text-center">Restarts</th>
                  <th className="px-6 py-3">Age</th>
                  <th className="px-6 py-3">Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {details.pods.map((pod) => (
                  <tr key={pod.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{pod.name}</td>
                    <td className="px-6 py-3">
                      <span className={`badge ${STATUS_BADGE[pod.status?.toLowerCase()] || 'badge-info'}`}>{pod.status}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={pod.ready ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                        {pod.ready ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`font-mono font-semibold ${pod.restarts > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {pod.restarts}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{pod.age}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs">{pod.node}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <RiHardDrive2Line /> Container Metadata
          </h3>
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">Namespace</span>
              <span className="text-sm font-semibold dark:text-white px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded w-fit">{details.namespace}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1 border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">Image Artifact</span>
              <span className="text-xs font-mono text-slate-500 break-all">{details.image}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-brand-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <RiSettings4Line /> Quick Controls
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary py-2 text-xs">Restart Deployment</button>
            <button className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-2 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">View Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
}

