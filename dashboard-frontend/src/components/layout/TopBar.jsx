import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import {
  RiSunLine, RiMoonLine, RiBellLine,
  RiUserLine, RiLogoutBoxLine, RiSettings3Line,
} from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const ROLE_BADGE = {
  admin: "badge-purple",
  developer: "badge-info",
  viewer: "badge-success",
};

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.replace("/dashboard", "").split("/").filter(Boolean);

  if (parts.length === 0) {
    return [{ label: "Dashboard", to: "/dashboard" }];
  }

  const crumbs = [{ label: "Dashboard", to: "/dashboard" }];
  let currentPath = "/dashboard";

  parts.forEach((part) => {
    currentPath += `/${part}`;
    // Exclude ID portions from looking ugly if possible, but for now just title case everything
    // e.g. /applications/app-1/environments/env-1
    const label = part.startsWith("app-") || part.startsWith("env-")
      ? part.replace("app-", "App: ").replace("env-", "Env: ")
      : part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");

    crumbs.push({ label, to: currentPath });
  });

  return crumbs;
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const crumbs = useBreadcrumbs();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-semibold text-slate-900 dark:text-white cursor-default">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.to} className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <motion.button
          id="theme-toggle"
          onClick={toggle}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Toggle theme"
        >
          {isDark
            ? <RiSunLine className="text-lg text-amber-400" />
            : <RiMoonLine className="text-lg text-brand-500" />
          }
        </motion.button>

        {/* Notifications */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
          <RiBellLine className="text-lg" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User menu */}
        <Menu as="div" className="relative">
          <Menu.Button id="user-menu-btn" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.first_name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.first_name || "User"}
              </p>
              <p className="text-xs text-slate-400 leading-tight capitalize">{user?.role}</p>
            </div>
            {user?.role && (
              <span className={`badge ${ROLE_BADGE[user.role] || "badge-info"} hidden md:inline-flex`}>
                {user.role}
              </span>
            )}
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 py-2 z-50 focus:outline-none">
              {[
                { icon: RiUserLine, label: "Profile", href: "/dashboard/settings/profile" },
                { icon: RiSettings3Line, label: "Settings", href: "/dashboard/settings" },
              ].map(({ icon: Icon, label, href }) => (
                <Menu.Item key={label}>
                  {({ active }) => (
                    <Link to={href} className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${active ? "bg-slate-50 dark:bg-slate-700/60 text-brand-600 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                      <Icon className="text-base" /> {label}
                    </Link>
                  )}
                </Menu.Item>
              ))}

              <div className="my-1.5 border-t border-slate-100 dark:border-slate-700" />

              <Menu.Item>
                {({ active }) => (
                  <button
                    id="logout-btn"
                    onClick={logout}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${active ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    <RiLogoutBoxLine className="text-base" /> Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
