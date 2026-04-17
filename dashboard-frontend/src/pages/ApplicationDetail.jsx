import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsApi } from "../api/services";
import { RiAppsLine, RiArrowRightSLine, RiGlobeLine, RiCheckboxCircleLine, RiErrorWarningLine, RiCloseCircleLine } from "react-icons/ri";
import HexagonCard from "../components/ui/HexagonCard";

const STATUS_MAP = {
  healthy: "badge-success",
  ready: "badge-success",
  running: "badge-success",
  active: "badge-success",
  degraded: "badge-warning",
  warning: "badge-warning",
  failed: "badge-danger",
  error: "badge-danger",
  unknown: "badge-info",
};

function StatusIcon({ status }) {
  const s = status?.toLowerCase();
  if (["healthy", "ready", "running", "active"].includes(s)) return <RiCheckboxCircleLine className="text-emerald-500" />;
  if (["degraded", "warning"].includes(s)) return <RiErrorWarningLine className="text-amber-500" />;
  return <RiCloseCircleLine className="text-red-500" />;
}

import { usePreferences } from "../context/PreferencesContext";

export default function ApplicationDetail() {
  const { appId } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const { layoutStyle } = usePreferences();

  useEffect(() => {
    setLoading(true);
    applicationsApi.getApplications()
      .then(res => {
        const found = res.data.find(a => String(a.itam_id) === String(appId));
        setApp(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading application...</div>;
  if (!app) return <div className="p-8 text-red-500">Application not found.</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link to="/dashboard/applications" className="hover:text-brand-600 transition-colors">Applications</Link>
          <RiArrowRightSLine />
          <span className="font-medium text-slate-900 dark:text-white">{app.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <RiAppsLine className="text-brand-500" /> {app.name}
          </h1>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-medium">
            {app.environments?.length || 0} Environment{(app.environments?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          {app.description || "Select an environment to view infrastructure servers, deployed components, and recent deployment history."}
        </p>
      </div>

      {/* Environments View */}
      {layoutStyle === "table" ? (
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Environment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {app.environments?.map(env => (
                  <tr key={env.env_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium flex items-center gap-3">
                      <RiGlobeLine className="text-brand-500 text-lg" /> {env.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={env.status} />
                        <span className={`badge text-[10px] px-2 py-0.5 ${STATUS_MAP[env.status?.toLowerCase()] || 'badge-info'}`}>
                          {env.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/applications/${app.itam_id}/environments/${env.env_id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
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
        <div className="honeycomb-container py-8">
          <div className="honeycomb-grid">
            {Array.from({ length: Math.ceil((app.environments?.length || 0) / 4) }).map((_, rowIndex) => {
              const rowEnvs = (app.environments || []).slice(rowIndex * 4, (rowIndex + 1) * 4);
              return (
                <div key={rowIndex} className="honeycomb-row">
                  {rowEnvs.map((env) => (
                    <HexagonCard
                      key={env.env_id}
                      title={env.name}
                      status={env.status}
                      icon={RiGlobeLine}
                      to={`/dashboard/applications/${app.itam_id}/environments/${env.env_id}`}
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
