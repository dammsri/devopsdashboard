import { useEffect, useState } from "react";
import { applicationsApi } from "../api/services";
import HexagonCard from "../components/ui/HexagonCard";
import { RiAppsLine } from "react-icons/ri";

import { usePreferences } from "../context/PreferencesContext";
import { Link } from "react-router-dom";

export default function ApplicationsIndex() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const { layoutStyle } = usePreferences();

  useEffect(() => {
    setLoading(true);
    applicationsApi.getApplications()
      .then(res => setApps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading applications...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <RiAppsLine className="text-brand-500" /> All Applications
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Select an application below to view and manage its respective environments.
        </p>
      </div>

      {layoutStyle === "table" ? (
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Application Name</th>
                  <th className="px-6 py-4 font-semibold">Environments Count</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apps.map(app => (
                  <tr key={app.itam_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium flex items-center gap-3">
                      <RiAppsLine className="text-brand-500 text-lg" /> {app.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{app.environments?.length || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/applications/${app.itam_id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
                        View Matrix
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
            {Array.from({ length: Math.ceil(apps.length / 4) }).map((_, rowIndex) => {
              const rowApps = apps.slice(rowIndex * 4, (rowIndex + 1) * 4);
              return (
                <div key={rowIndex} className="honeycomb-row">
                  {rowApps.map((app) => (
                    <HexagonCard
                      key={app.itam_id}
                      title={app.name}
                      subtitle={`${app.environments?.length || 0} Environments`}
                      icon={RiAppsLine}
                      to={`/dashboard/applications/${app.itam_id}`}
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
