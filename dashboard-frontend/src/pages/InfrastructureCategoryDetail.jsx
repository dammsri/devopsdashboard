import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { infrastructureApi } from "../api/services";
import { RiAppsLine, RiArrowRightSLine, RiServerLine } from "react-icons/ri";
import HexagonCard from "../components/ui/HexagonCard";

import { usePreferences } from "../context/PreferencesContext";

export default function InfrastructureCategoryDetail() {
  const { category } = useParams();
  const [categoryData, setCategoryData] = useState(null);
  const { layoutStyle } = usePreferences();

  useEffect(() => {
    infrastructureApi.getInfrastructureGroups().then(r => {
      const match = r.data.find(g => g.id === category);
      setCategoryData(match);
    }).catch(console.error);
  }, [category]);

  if (!categoryData) return <div className="p-8 text-slate-500 animate-pulse">Loading {category} infrastructure...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link to="/dashboard/infrastructure" className="hover:text-brand-600 transition-colors">Infrastructure</Link>
          <RiArrowRightSLine />
          <span className="capitalize">{category}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <RiServerLine className="text-brand-500" /> {categoryData.name} Tier
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Select an application to view dedicated server specifications and host mapping.
        </p>
      </div>

      {layoutStyle === "table" ? (
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Application Name</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryData.apps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium flex items-center gap-3">
                      <RiAppsLine className="text-brand-500 text-lg" /> {app.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/infrastructure/${category}/${app.id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
                        View Servers
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
            {Array.from({ length: Math.ceil(categoryData.apps.length / 4) }).map((_, rowIndex) => {
              const rowApps = categoryData.apps.slice(rowIndex * 4, (rowIndex + 1) * 4);
              return (
                <div key={rowIndex} className="honeycomb-row">
                  {rowApps.map((app) => (
                    <HexagonCard
                      key={app.id}
                      title={app.name}
                      subtitle={`${app.server_count || 0} Servers`}
                      icon={RiAppsLine}
                      to={`/dashboard/infrastructure/${category}/${app.id}`}
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
