import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { infrastructureApi } from "../api/services";
import HexagonCard from "../components/ui/HexagonCard";
import { RiServerLine } from "react-icons/ri";

import { usePreferences } from "../context/PreferencesContext";

export default function InfrastructureIndex() {
  const [groups, setGroups] = useState([]);
  const { layoutStyle } = usePreferences();

  useEffect(() => {
    infrastructureApi.getInfrastructureGroups().then(r => setGroups(r.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <RiServerLine className="text-brand-500" /> Infrastructure
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Global platform infrastructure monitoring. Select a tier to view associated applications.
        </p>
      </div>

      {layoutStyle === "table" ? (
        <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tier Name</th>
                  <th className="px-6 py-4 font-semibold">Applications</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {groups.map(group => (
                  <tr key={group.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium flex items-center gap-3">
                      <RiServerLine className="text-brand-500 text-lg" /> {group.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{group.apps?.length || 0} Apps</td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/dashboard/infrastructure/${group.id}`} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-bold px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition-colors">
                        Explore Tier
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
            {Array.from({ length: Math.ceil(groups.length / 4) }).map((_, rowIndex) => {
              const rowGroups = groups.slice(rowIndex * 4, (rowIndex + 1) * 4);
              return (
                <div key={rowIndex} className="honeycomb-row">
                  {rowGroups.map((group) => (
                    <HexagonCard
                      key={group.id}
                      title={group.name}
                      subtitle={`${group.apps?.length || 0} Applications`}
                      icon={RiServerLine}
                      to={`/dashboard/infrastructure/${group.id}`}
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
