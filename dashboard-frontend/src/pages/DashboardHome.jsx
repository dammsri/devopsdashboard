import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/services";
import {
    RiRocketLine, RiServerLine, RiCheckDoubleLine, RiAlertLine,
    RiAppsLine, RiGlobeLine, RiHistoryLine,
    RiArrowRightSLine, RiPulseLine, RiPercentLine, RiStackLine,
    RiLineChartLine, RiPieChartLine
} from "react-icons/ri";
import { SiKubernetes } from "react-icons/si";
import AIInsightsCard from "../components/ai/AIInsightsCard";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const ICONS = {
    total_applications: RiAppsLine,
    total_environments: RiGlobeLine,
    total_servers: RiServerLine,
    total_services: RiStackLine,
    success_rate: RiPercentLine,
};

const COLORS = {
    total_applications: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800",
    total_environments: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800",
    total_servers: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800",
    total_services: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-800",
    success_rate: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400 border border-teal-100 dark:border-teal-800",
};

const CHART_COLORS = ['#6366f1', '#2dd4bf', '#fbbf24', '#f43f5e'];

const LABELS = {
    total_applications: "Applications",
    total_environments: "Environments",
    total_servers: "Infrastructure Servers",
    total_services: "Microservices",
    success_rate: "Platform Success Rate",
};

const FORMAT = {
    success_rate: (v) => `${v}%`,
};

function timeAgo(isoString) {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardHome() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [skeEnvironments, setSkeEnvironments] = useState([]);
    const [trends, setTrends] = useState(null);

    useEffect(() => {
        dashboardApi.getStats().then(r => setStats(r.data)).catch(console.error);
        dashboardApi.getActivity().then(r => setActivity(r.data)).catch(console.error);
        dashboardApi.getEnvironmentSummaries().then(r => setSkeEnvironments(r.data)).catch(console.error);
        dashboardApi.getTrends().then(r => setTrends(r.data)).catch(console.error);
    }, []);

    const getStatusMarker = (status) => {
        if (status === 'healthy') return 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
        if (status === 'warning') return 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
        return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">DevOps Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Standard Chartered Development Ecosystem Dashboard</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">System Online</span>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {stats && Object.keys(ICONS).map((key) => {
                    if (stats[key] === undefined) return null;
                    const Icon = ICONS[key];
                    const rawValue = stats[key];
                    const value = FORMAT[key] ? FORMAT[key](rawValue) : rawValue;
                    return (
                        <div key={key} className="stat-card group">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110 ${COLORS[key]}`}>
                                    <Icon />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider truncate">{LABELS[key]}</p>
                                    <h3 className="text-2xl font-bold dark:text-white mt-0.5">{value}</h3>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visual Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                            <RiLineChartLine className="text-brand-500" /> Platform Health Trends
                        </h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">7 Day Success Rate</span>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends?.success_rate_trend || []}>
                                <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
                                <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                            <RiPieChartLine className="text-teal-500" /> Infrastructure Allocation
                        </h2>
                    </div>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={trends?.cluster_allocation || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {trends?.cluster_allocation?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Resources</p>
                            <p className="text-2xl font-black dark:text-white">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SKE Environment Ecosystem Widget */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                            <SiKubernetes className="text-brand-500" /> SKE Environment Ecosystem
                        </h2>
                        <Link to="/dashboard/settings/skeenvironments" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                            Manage Environments <RiArrowRightSLine />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skeEnvironments?.map((env) => (
                            <Link key={env.id} to={`/dashboard/skeenvironments/${env.id}`} className="glass p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{env.name}</span>
                                    <div className={`w-2 h-2 rounded-full ${getStatusMarker(env.status)}`} />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Services</p>
                                        <p className="text-lg font-bold dark:text-white leading-tight">{env.service_count}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Health</p>
                                        <p className={`text-sm font-bold ${env.health_percent >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{env.health_percent}%</p>
                                    </div>
                                </div>
                                <div className="mt-3 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${env.health_percent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${env.health_percent}%` }}
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* AI & Activity Feed Column */}
                <div className="space-y-8">
                    <AIInsightsCard />

                    {/* Activity Feed */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                                <RiPulseLine className="text-rose-500" /> Platform Pulse
                            </h2>
                        </div>
                        <div className="glass rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                            {activity?.map((item) => (
                                <div key={item.id} className="relative flex items-start gap-4">
                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 z-10 ${item.status === 'success' ? 'bg-emerald-500' :
                                        item.status === 'warning' ? 'bg-amber-500' :
                                            item.status === 'failed' ? 'bg-red-500' : 'bg-brand-500'
                                        } shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm dark:text-slate-200 leading-snug">
                                            <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-widest block mb-0.5 opacity-60">{item.type}</span>
                                            <span className="text-slate-600 dark:text-slate-400">{item.detail}</span> on <span className="font-bold text-brand-600 dark:text-brand-400">{item.resource}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase">{timeAgo(item.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                            <button className="w-full py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
                                View Audit Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
