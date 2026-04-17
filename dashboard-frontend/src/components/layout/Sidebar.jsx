import { useState, useCallback, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiDashboardLine,
  RiSettings3Line,
  RiTeamLine,
  RiUserLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiAppsLine,
  RiServerLine,
  RiBarChartLine,
  RiLineChartLine,
  RiNodeTree,
  RiGlobeLine,
  RiShieldLine,
  RiPulseLine,
  RiStackLine,
  RiLayoutMasonryLine,
  RiHistoryLine
} from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import useNavigationStore from "../../store/navigationStore";
import { SiKubernetes } from "react-icons/si";

export default function Sidebar({ collapsed, onToggle }) {
  const [openGroups, setOpenGroups] = useState({});
  const { applications, infrastructure, skeEnvironments, refreshAll } = useNavigationStore();
  const { hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const toggleGroup = useCallback((id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isGroupActive = useCallback((item) => {
    if (item.to && location.pathname === item.to) return true;
    return item.children?.some((c) => {
      if (location.pathname === c.to) return true;
      if (c.children?.some(gc => location.pathname === gc.to)) return true;
      return false;
    }) || false;
  }, [location.pathname]);

  const NAV_TREE = useMemo(() => {
    const staticTop = [
      {
        id: "overview",
        label: "Overview",
        icon: RiDashboardLine,
        to: "/dashboard",
        exact: true,
      }
    ];

    // ── Applications Section ────────────────────────────────────────────────
    const appsGroup = {
      id: "applications",
      label: "Environments",
      icon: RiAppsLine,
      to: "/dashboard/applications",
      children: applications?.map(app => ({
        id: `sidebar-app-honey-${app.itam_id}`,
        label: app.name,
        icon: RiAppsLine,
        to: `/dashboard/applications/${app.itam_id}`,
      })) || []
    };

    // ── Summary Section ──────────────────────────────────────────────────────
    const summaryGroup = {
      id: "summary",
      label: "Summary",
      icon: RiLayoutMasonryLine,
      children: applications?.map(app => ({
        id: `summary-app-${app.itam_id}`,
        label: app.name,
        icon: RiAppsLine,
        to: `/dashboard/summary/${app.itam_id}`,
      })) || []
    };

    // ── Infrastructure Section ───────────────────────────────────────────────
    const infraGroup = {
      id: "infrastructure",
      label: "Infrastructure",
      icon: RiServerLine,
      to: "/dashboard/infrastructure",
      children: infrastructure?.map(group => ({
         id: `infra-${group.id}`,
         label: group.name,
         icon: RiServerLine,
         to: `/dashboard/infrastructure/${group.id}`,
         children: group.apps?.length > 0 ? group.apps.map(app => ({
            id: `infra-${group.id}-${app.id}`,
            label: app.name,
            icon: RiAppsLine,
            to: `/dashboard/infrastructure/${group.id}/${app.id}`,
         })) : undefined
      })) || []
    };

    // ── SKE Environments Section (3-Level: App -> Env) ────────────────────────
    const appSkeMap = {};
    skeEnvironments?.forEach(env => {
      if (!appSkeMap[env.itam_id]) {
        const app = applications.find(a => a.itam_id === env.itam_id);
        appSkeMap[env.itam_id] = {
          name: app?.name || `App ${env.itam_id}`,
          envs: []
        };
      }
      appSkeMap[env.itam_id].envs.push(env);
    });

    const skeGroup = {
      id: "skeenvironments",
      label: "SKE Environments",
      icon: SiKubernetes,
      to: "/dashboard/skeenvironments",
      children: Object.keys(appSkeMap).map(itamId => ({
        id: `ske-app-${itamId}`,
        label: appSkeMap[itamId].name,
        icon: RiAppsLine,
        children: appSkeMap[itamId].envs.map(env => ({
          id: `ske-env-${env.ske_env_id}`,
          label: env.name,
          icon: RiGlobeLine,
          to: `/dashboard/skeenvironments/${env.ske_env_id}`,
        }))
      })) || []
    };

    const monitoringGroup = {
      id: "monitoring",
      label: "Monitoring",
      icon: RiBarChartLine,
      children: [
        { id: "mon-analytics", label: "Analytics", icon: RiBarChartLine, to: "/dashboard/monitoring/analytics" },
        { id: "mon-metrics",   label: "Metrics",   icon: RiLineChartLine, to: "/dashboard/monitoring/metrics" },
        { id: "mon-traces",    label: "Traces",    icon: RiNodeTree,      to: "/dashboard/monitoring/traces" },
      ]
    };

    const settingsGroup = {
      id: "settings",
      label: "Settings",
      icon: RiSettings3Line,
      to: "/dashboard/settings",
      children: [
        { id: "set-apps",      label: "Applications", icon: RiAppsLine,   to: "/dashboard/settings/applications", roles: ["Super Admin"] },
        { id: "set-envs",      label: "Environments", icon: RiGlobeLine,  to: "/dashboard/settings/environments", roles: ["Super Admin"] },
        { id: "set-servers",   label: "Servers",      icon: RiServerLine, to: "/dashboard/settings/servers",      roles: ["Super Admin"] },
        { id: "set-infra-svc", label: "Infra Services", icon: RiHistoryLine,to: "/dashboard/settings/services",     roles: ["Super Admin"] },
        { id: "set-ske-clr",   label: "SKE Clusters", icon: SiKubernetes, to: "/dashboard/settings/skeclusters",  roles: ["Super Admin"] },
        { id: "set-ske-ns",    label: "SKE Namespaces", icon: RiNodeTree,  to: "/dashboard/settings/skenamespaces", roles: ["Super Admin"] },
        { id: "set-ske-env",   label: "SKE Environments", icon: RiGlobeLine, to: "/dashboard/settings/skeenvironments", roles: ["Super Admin"] },
        { id: "set-ske-svc",   label: "SKE Services", icon: RiStackLine,  to: "/dashboard/settings/skeservices",   roles: ["Super Admin"] },
        { id: "set-users",     label: "Users",        icon: RiTeamLine,    to: "/dashboard/settings/users",        roles: ["Super Admin"] },
        { id: "set-security",  label: "Security",     icon: RiShieldLine,  to: "/dashboard/settings/security",     roles: ["Super Admin"] },
        { id: "set-ops",       label: "Operations",   icon: RiPulseLine,   to: "/dashboard/settings/operations",   roles: ["Super Admin"] },
        { id: "set-profile",   label: "Profile",      icon: RiUserLine,    to: "/dashboard/settings/profile" },
      ]
    };

    return [...staticTop, summaryGroup, appsGroup, infraGroup, skeGroup, monitoringGroup, settingsGroup];
  }, [applications, infrastructure, skeEnvironments]);

  // Expand parents if a child is active
  useEffect(() => {
    const newOpenGroups = { ...openGroups };
    let changed = false;

    const findAndExpand = (items) => {
      for (const item of items) {
        if (item.children) {
          const hasActiveChild = item.children.some(c => 
            (c.to && location.pathname === c.to) || 
            (c.children && c.children.some(gc => location.pathname === gc.to))
          );
          
          if (hasActiveChild && !newOpenGroups[item.id]) {
            newOpenGroups[item.id] = true;
            changed = true;
          }
          findAndExpand(item.children);
        }
      }
    };

    findAndExpand(NAV_TREE);
    if (changed) setOpenGroups(newOpenGroups);
  }, [location.pathname, NAV_TREE]);

  const renderNavItems = (items, level = 0) => {
    return items?.map((item) => {
      if (item.roles && !hasRole(...item.roles)) return null;

      if (!item.children) {
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""} ${level > 0 ? (level === 1 ? 'text-sm py-2 ml-4' : 'text-xs py-1.5 ml-6 border-l border-slate-100 dark:border-slate-800 pl-3') : ''}`
            }
          >
            {item.icon && <item.icon className={`${level > 0 ? 'text-base' : 'text-xl'} flex-shrink-0`} />}
            {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
          </NavLink>
        );
      }

      const active = isGroupActive(item);
      const isOpen = openGroups[item.id] || false;
      
      return (
        <div key={item.id} className={level > 0 ? "mb-0.5" : "mt-2"}>
          <button
            onClick={() => toggleGroup(item.id)}
            className={`nav-item w-full ${active ? "active text-brand-600" : ""} ${collapsed ? "justify-center px-2" : ""} ${level > 0 ? 'ml-4 py-1.5 text-sm' : ''}`}
          >
            {item.icon && <item.icon className={`${level > 0 ? 'text-base' : 'text-xl'} flex-shrink-0`} />}
            {!collapsed && <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>}
            {!collapsed && (isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />)}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed && isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-0.5"
              >
                {renderNavItems(item.children, level + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 280 }}
      className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all select-none z-20"
    >
      <div className="h-16 flex items-center px-4 gap-3 border-b border-slate-200 dark:border-slate-800">
        <img src="/sc-logo.svg" alt="SC" className="w-8 h-8" />
        {!collapsed && <span className="font-bold text-slate-800 dark:text-white">DevOps Dashboard</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {renderNavItems(NAV_TREE)}
      </nav>

      <div className="p-3 border-t border-slate-50 dark:border-slate-800">
        <button onClick={onToggle} className="w-full flex justify-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
          {collapsed ? <RiArrowRightSLine /> : <RiArrowLeftSLine />}
        </button>
      </div>
    </motion.aside>
  );
}
