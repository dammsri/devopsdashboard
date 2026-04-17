import React from "react";
import { Link } from "react-router-dom";
import { RiCheckboxCircleLine, RiErrorWarningLine, RiCloseCircleLine } from "react-icons/ri";

export default function HexagonCard({ title, subtitle, icon: Icon, status, to, onClick }) {
  const getStatusIcon = () => {
    const s = status?.trim().toLowerCase();
    if (s === "healthy" || s === "ready" || s === "running" || s === "active") {
      return <RiCheckboxCircleLine className="text-emerald-500 text-sm" title="Healthy" />;
    }
    if (s === "degraded" || s === "warning") {
      return <RiErrorWarningLine className="text-amber-500 text-sm" title="Degraded" />;
    }
    if (status) {
      return <RiCloseCircleLine className="text-red-500 text-sm" title="Error" />;
    }
    return null;
  };

  const content = (
    <div className="honeycell-inner">
      <div className="flex flex-col items-center justify-center gap-2">
        {Icon && (
          <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Icon className="text-sm" />
          </div>
        )}
        <h3 className="font-bold text-slate-800 dark:text-white leading-tight text-[8px] text-center px-1">
          {title}
        </h3>
        {subtitle && (
          <span className="text-[7px] text-slate-500 dark:text-slate-400 font-medium -mt-1">
            {subtitle}
          </span>
        )}
        {status && (
          <div className="mt-0.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            {getStatusIcon()}
            <span className="text-[6px] font-semibold text-slate-600 dark:text-slate-300 capitalize">{status}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <div className="honeycell">
        <Link to={to} className="w-full h-full block">
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div className="honeycell" onClick={onClick}>
      {content}
    </div>
  );
}
