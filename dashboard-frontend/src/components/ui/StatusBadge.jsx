import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiCloseCircleFill,
  RiQuestionLine,
  RiLoader4Line
} from "react-icons/ri";

const statusConfig = {
  healthy: { color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: RiCheckboxCircleFill, label: "Healthy" },
  running: { color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: RiCheckboxCircleFill, label: "Running" },
  online: { color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: RiCheckboxCircleFill, label: "Online" },
  active: { color: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", icon: RiCheckboxCircleFill, label: "Active" },
  
  warning: { color: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", icon: RiErrorWarningFill, label: "Warning" },
  degraded: { color: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", icon: RiErrorWarningFill, label: "Degraded" },
  pending: { color: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20", icon: RiLoader4Line, label: "Pending" },
  
  failed: { color: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20", icon: RiCloseCircleFill, label: "Failed" },
  error: { color: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20", icon: RiCloseCircleFill, label: "Error" },
  offline: { color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", icon: RiCloseCircleFill, label: "Offline" },
  
  unknown: { color: "bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700", icon: RiQuestionLine, label: "Unknown" },
};

export default function StatusBadge({ status }) {
  const normStatus = status?.toLowerCase() || "unknown";
  const config = statusConfig[normStatus] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${config.color}`}>
      <Icon className="text-sm" />
      {status || config.label}
    </span>
  );
}
