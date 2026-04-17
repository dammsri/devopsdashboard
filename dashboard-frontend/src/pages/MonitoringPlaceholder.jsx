import { useParams } from "react-router-dom";
import { RiBarChartLine, RiLineChartLine, RiNodeTree, RiExternalLinkLine } from "react-icons/ri";

const CONTENT = {
  analytics: {
    title: "Platform Analytics",
    desc: "Aggregated usage trends, deployment frequency, and user engagement metrics.",
    icon: RiBarChartLine,
    color: "text-blue-500",
    tools: ["Splunk", "Google Analytics", "Mixpanel"]
  },
  metrics: {
    title: "Performance Metrics",
    desc: "Real-time CPU, RAM, and Disk utilization across all clusters.",
    icon: RiLineChartLine,
    color: "text-emerald-500",
    tools: ["Grafana", "Prometheus", "Datadog"]
  },
  traces: {
    title: "Distributed Tracing",
    desc: "End-to-end request path visualization and latency analysis.",
    icon: RiNodeTree,
    color: "text-purple-500",
    tools: ["Jaeger", "Zipkin", "Honeycomb"]
  }
};

export default function MonitoringPlaceholder() {
  const { type } = useParams();
  const info = CONTENT[type] || CONTENT.analytics;
  const Icon = info.icon;

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Icon className={info.color} /> {info.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">{info.desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
        <div className="flex flex-col items-center justify-center p-6 lg:p-12 glass rounded-3xl border-2 border-slate-200 dark:border-slate-800 relative overflow-hidden group">
            {/* Embedded SVG Chart Placeholder */}
            <div className="w-full relative opacity-60 group-hover:opacity-100 transition-opacity duration-700">
                <svg viewBox="0 0 400 200" className="w-full h-auto drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Grid lines */}
                    <path d="M0 160H400M0 120H400M0 80H400M0 40H400" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-slate-200 dark:text-slate-800" />
                    
                    {/* Fill */}
                    <path d="M0 180 L40 140 L80 160 L120 90 L160 110 L200 60 L240 85 L280 40 L320 60 L360 20 L400 30 L400 200 L0 200 Z" fill="url(#gradientChart)" className="opacity-20 dark:opacity-10" />
                    
                    {/* Line path 1 */}
                    <path d="M0 180 L40 140 L80 160 L120 90 L160 110 L200 60 L240 85 L280 40 L320 60 L360 20 L400 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={info.color} />
                    
                    {/* Line path 2 (overlay) */}
                    <path d="M0 190 L50 170 L100 130 L150 140 L200 90 L250 100 L300 50 L350 80 L400 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" className="text-brand-400 opacity-50" />
                    
                    {/* Defs for gradient */}
                    <defs>
                        <linearGradient id="gradientChart" x1="0" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="currentColor" className={info.color} stopOpacity="1" />
                            <stop offset="100%" stopColor="currentColor" className={info.color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                </svg>
                
                {/* Overlay Pending Text label covering the chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[2px] bg-white/30 dark:bg-slate-900/40 rounded-xl transition-all duration-300">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center flex items-center justify-center gap-2 drop-shadow-md">
                        <Icon /> Integration Pending
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 text-center max-w-xs leading-relaxed drop-shadow-md">
                        Standard Chartered Central Observability Stack integration coming soon.
                    </p>
                </div>
            </div>
           
            <div className="flex flex-wrap justify-center gap-2 mt-8 relative z-10">
              {info.tools.map(t => (
                <span key={t} className="px-3 py-1 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm">
                  {t}
                </span>
              ))}
            </div>
        </div>

        <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Planned External Links</h4>
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl group cursor-not-allowed grayscale">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Icon className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Global {info.title} Instance {i}</p>
                                <p className="text-xs text-slate-400 italic">Instance ID: SC-MON-00{i}</p>
                            </div>
                        </div>
                        <RiExternalLinkLine className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                ))}
            </div>
            
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed font-medium">
                    Note: Direct single-sign-on (SSO) through your **AD Credentials** will be required once tokens are Provisioned.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
