import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  RiAppsLine, RiGlobeLine, RiServerLine, RiHistoryLine,
  RiTeamLine, RiAddLine, RiCloseLine,
  RiSearchLine, RiCheckLine, RiDeleteBinLine, RiUserLine, RiEditLine, RiStackLine,
  RiShieldLine, RiPulseLine, RiCheckboxCircleLine, RiTimeLine, RiNodeTree, RiSettings3Line
} from "react-icons/ri";
import { SiKubernetes } from "react-icons/si";

import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import {
  applicationsApi,
  infrastructureApi,
  skeEnvironmentsApi,
  usersApi,
  importApi,
  opsApi,
  securityApi
} from "../api/services";
import { notify } from "../store/notificationStore";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import useNavigationStore from "../store/navigationStore";
import StatusBadge from "../components/ui/StatusBadge";
import SkeletonTable from "../components/ui/SkeletonTable";
import { RiSunLine, RiMoonLine } from "react-icons/ri";

const categories = [
  { id: "profile", label: "Profile", icon: RiUserLine },
  { id: "applications", label: "Applications", icon: RiAppsLine },
  { id: "environments", label: "Environments", icon: RiGlobeLine },
  { id: "servers", label: "Servers", icon: RiServerLine },
  { id: "services", label: "Services", icon: RiHistoryLine },
  { id: "skeclusters", label: "SKE Clusters", icon: SiKubernetes },
  { id: "skenamespaces", label: "SKE Namespaces", icon: RiNodeTree },
  { id: "skeenvironments", label: "SKE Environments", icon: RiGlobeLine },
  { id: "skeservices", label: "SKE Services", icon: RiStackLine },
  { id: "users", label: "Users", icon: RiTeamLine },
  { id: "security", label: "Security", icon: RiShieldLine },
  { id: "operations", label: "Operations", icon: RiPulseLine },
];

const FormField = ({ label, children, required }) => (
  <div className="flex flex-col gap-2 grow min-w-[200px]">
    <label className="text-xs font-bold text-slate-500 uppercase px-1 flex items-center gap-1">
      {label}
      {required && <span className="text-rose-500 text-sm">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    name={props.name || props.label?.toLowerCase().replace(' ', '_')}
    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white disabled:opacity-50"
  />
);

const MultiChipSelect = memo(({ name, options, defaultValue = [], loading, ...props }) => {
  const defaultList = useMemo(() => {
    if (!defaultValue) return [];
    // If it's a list of objects (common in API responses), extract the IDs
    const items = Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    return items.map(item => (typeof item === 'object' && item !== null) ? (item.value || item.id || item.env_id) : item);
  }, [defaultValue]);

  const [selected, setSelected] = useState(defaultList);
  const [lastSyncedDefault, setLastSyncedDefault] = useState(JSON.stringify(defaultList));

  // Synchronize ONLY if the parent's default values have logically changed
  // This prevents background dashboard refreshes from wiping out current user selection
  useEffect(() => {
    const nextDefaultJson = JSON.stringify(defaultList);
    if (nextDefaultJson !== lastSyncedDefault) {
      setSelected(defaultList);
      setLastSyncedDefault(nextDefaultJson);
    }
  }, [defaultList, lastSyncedDefault]);

  const toggle = (val) => {
    if (props.disabled) return;
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  return (
    <div className={`flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 ${props.disabled ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      {loading && <span className="text-slate-400 text-xs italic px-2 py-1">Loading options...</span>}
      {!loading && options.length === 0 && <span className="text-slate-400 text-xs italic px-2 py-1">No options available.</span>}
      {options.map(opt => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        const isSelected = selected.includes(val);
        return (
          <button
            key={val}
            type="button"
            disabled={props.disabled}
            onClick={() => toggle(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected
                ? "bg-brand-500 border-brand-600 text-white shadow-sm shadow-brand-500/20"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-300"
              } ${props.disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
          >
            {label}
          </button>
        );
      })}
      {/* Hidden inputs to make it work with FormData */}
      {selected.map(val => (
        <input key={val} type="hidden" name={name} value={val} />
      ))}
    </div>
  );
});

const Select = ({ options, multiple = false, loading, ...props }) => {
  if (multiple) {
    return <MultiChipSelect {...props} options={options} loading={loading} />;
  }
  return (
    <select
      {...props}
      name={props.name || props.label?.toLowerCase().replace(' ', '_')}
      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400`}
    >
      <option value="">Select option...</option>
      {options?.map(o => (
        typeof o === 'object'
          ? <option key={o.value} value={o.value}>{o.label}</option>
          : <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
};


export default function SettingsDashboard() {
  const { category } = useParams();
  const { user, loading: authLoading, hasRole, hasPermission } = useAuth();
  const { layoutStyle, setLayoutStyle, darkMode, setDarkMode } = usePreferences();

  const activeTab = useMemo(() => {
    let tab = categories.find(c => c.id === category)?.id;
    if (!tab && category === 'ske') return 'skeclusters';
    return tab || "profile";
  }, [category]);

  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reference data for dropdowns
  const [apps, setApps] = useState([]);
  const [infraEnvs, setInfraEnvs] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [skeEnvs, setSkeEnvs] = useState([]);
  const [funcs, setFuncs] = useState([]);
  const [roles, setRoles] = useState([]);

  // RBAC Helpers
  const getPermissionForTab = (tab, action = 'manage') => {
    const mapping = {
      applications: 'infra.app.manage',
      environments: 'infra.env.manage',
      servers: `infra.server.${action}`,
      services: 'infra.service.manage',
      skeclusters: 'ske.cluster.manage',
      skenamespaces: 'ske.cluster.manage',
      skeenvironments: 'ske.cluster.manage',
      skeservices: 'ske.service.manage',
      users: 'sys.security.manage',
      security: 'sys.security.manage'
    };
    return mapping[tab];
  };

  const isSuperAdmin = hasPermission('sys.security.manage');
  const visibleCategories = useMemo(() => {
    if (authLoading && !user) return categories.filter(c => c.id === "profile");
    if (isSuperAdmin) return categories;

    return categories.filter(c => {
      if (c.id === "profile") return true;
      const perm = getPermissionForTab(c.id);
      return perm && hasPermission(perm);
    });
  }, [isSuperAdmin, user, authLoading]);

  const canAdd = (isSuperAdmin || (hasRole('Developer') && ['environments', 'services', 'skeservices'].includes(activeTab)) || hasPermission(getPermissionForTab(activeTab, 'create'))) && activeTab !== 'operations';
  const canEdit = (isSuperAdmin || (hasRole('Developer') && ['environments', 'services', 'skeservices', 'servers'].includes(activeTab)) || hasPermission(getPermissionForTab(activeTab, 'update'))) && activeTab !== 'operations';
  const canDelete = isSuperAdmin || hasPermission(getPermissionForTab(activeTab, 'delete')) && activeTab !== 'operations';

  const activeCategory = useMemo(() =>
    categories.find(c => c.id === activeTab) || categories[0]
    , [activeTab]);

  const singularLabel = activeCategory.label.replace(/s$/, '').replace('Environments', 'Environment');

  const fetchData = useCallback(async (tab) => {
    const target = tab || activeTab;
    if (target === "profile") return;

    // ATOMIC: clear stale data and show spinner before any async work
    setData([]);
    setLoading(true);

    try {
      let res;
      if (target === "operations") {
        res = await opsApi.getJobs();
      } else {
        switch (target) {
          case "applications": res = await applicationsApi.getApplications(); break;
          case "environments": res = await applicationsApi.listAllEnvironments(); break;
          case "servers": res = await infrastructureApi.listServers(); break;
          case "services": res = await applicationsApi.listAllServices(); break;
          case "skeclusters": res = await skeEnvironmentsApi.listClusters(); break;
          case "skenamespaces": res = await skeEnvironmentsApi.listNamespaces(); break;
          case "skeenvironments": res = await skeEnvironmentsApi.getEnvironments(); break;
          case "skeservices": res = await skeEnvironmentsApi.listAllServices(); break;
          case "users": res = await usersApi.list(); break;
          case "security": res = await securityApi.getRoles(); break;
          default: res = { data: [] };
        }
      }
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch settings data", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadRefs = useCallback(async () => {
    try {
      const [a, c, ns, se, e] = await Promise.all([
        applicationsApi.getApplications(),
        skeEnvironmentsApi.listClusters(),
        skeEnvironmentsApi.listNamespaces(),
        skeEnvironmentsApi.getEnvironments(),
        applicationsApi.listAllEnvironments()
      ]);
      setApps(a.data || []);
      setClusters(c.data || []);
      setNamespaces(ns.data || []);
      setSkeEnvs(se.data || []);
      setInfraEnvs(e.data || []);

      const canManageSecurity = hasPermission('sys.security.manage');
      if (canManageSecurity) {
        const [f, r] = await Promise.all([
          securityApi.getFunctionalities(),
          securityApi.getRoles()
        ]);
        setFuncs(f.data || []);
        setRoles(r.data || []);
      }
    } catch (e) {
      console.error("Failed to load reference data", e);
    }
  }, [hasPermission]);

  // Load reference data for form dropdowns
  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    setView(activeTab === "profile" ? "form" : "list");
    setEditingItem(null);
    setSearch("");
    fetchData(activeTab); // pass tab directly to avoid stale closure
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleAdd = () => {
    setEditingItem(null);
    setView("form");
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setView("form");
  };

  const handleCancel = () => {
    setView("list");
    setEditingItem(null);
  };

  const handleDelete = (item) => {
    setConfirmModal({ isOpen: true, item });
  };

  const executeDelete = async () => {
    const item = confirmModal.item;
    if (!item) return;

    try {
      switch (activeTab) {
        case "applications":
          await applicationsApi.remove(item.itam_id);
          break;
        case "environments":
          await applicationsApi.removeEnvironment(item.itam_id, item.env_id);
          break;
        case "servers":
          await infrastructureApi.removeServer(item.itam_id, item.ip_address, item.username);
          break;
        case "services":
          await applicationsApi.removeService(item.itam_id, item.env_id, item.name);
          break;
        case "skeclusters":
          await skeEnvironmentsApi.removeCluster(item.itam_id, item.cluster_id);
          break;
        case "skenamespaces":
          await skeEnvironmentsApi.removeNamespace(item.itam_id, item.cluster_id, item.ske_env_id, item.namespace);
          break;
        case "skeenvironments":
          await skeEnvironmentsApi.removeEnvironment(item.itam_id, item.cluster_id, item.ske_env_id);
          break;
        case "skeservices":
          await skeEnvironmentsApi.removeService(item.itam_id, item.cluster_id, item.ske_env_id, item.namespace, item.service_id);
          break;
        case "users":
          await usersApi.remove(item.user_id);
          break;
        case "security":
          await securityApi.removeRole(item.id);
          break;
      }
      notify.success(`${singularLabel} deleted successfully.`);
      fetchData();
      loadRefs(); // Refresh dropdown references
      useNavigationStore.getState().refreshAll();
    } catch (err) {
      notify.error("Deletion failed. " + (err.response?.data?.detail || ""));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (activeTab === "profile") {
      notify.success('Profile preferences updated.');
      return;
    }

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());

    if (payload.itam_id) payload.itam_id = Number(payload.itam_id);
    if (payload.replicas) payload.replicas = Number(payload.replicas);

    if (activeTab === "servers") {
      payload.environments = formData.getAll("environments");
    }

    try {
      if (editingItem) {
        switch (activeTab) {
          case "applications":
            await applicationsApi.update(editingItem.itam_id, payload);
            break;
          case "environments":
            await applicationsApi.updateEnvironment(editingItem.itam_id, editingItem.env_id, payload);
            break;
          case "servers":
            const serverPayload = { ...payload, environments: formData.getAll("environments") };
            await infrastructureApi.updateServer(editingItem.itam_id, editingItem.ip_address, editingItem.username, serverPayload);
            break;
          case "services":
            await applicationsApi.updateService(editingItem.itam_id, editingItem.env_id, editingItem.name, payload);
            break;
          case "skeclusters":
            await skeEnvironmentsApi.updateCluster(editingItem.itam_id, editingItem.cluster_id, payload);
            break;
          case "skenamespaces":
            await skeEnvironmentsApi.updateNamespace(editingItem.itam_id, editingItem.cluster_id, editingItem.ske_env_id, editingItem.namespace, payload);
            break;
          case "skeenvironments":
            await skeEnvironmentsApi.updateEnvironment(editingItem.itam_id, editingItem.cluster_id, editingItem.ske_env_id, payload);
            break;
          case "skeservices":
            await skeEnvironmentsApi.updateService(editingItem.itam_id, editingItem.cluster_id, editingItem.ske_env_id, editingItem.namespace, editingItem.service_id, payload);
            break;
          case "users":
            const userUpdatePayload = { ...payload, role_ids: formData.getAll("role_ids").map(Number) };
            if (payload.is_external !== undefined) userUpdatePayload.is_external = formData.get("is_external") === "on";
            if (payload.is_active !== undefined) userUpdatePayload.is_active = formData.get("is_active") === "on";
            await usersApi.update(editingItem.user_id, userUpdatePayload);
            break;
          case "security":
            const roleUpdatePayload = { ...payload, functionality_ids: formData.getAll("functionality_ids").map(Number) };
            await securityApi.updateRole(editingItem.id, roleUpdatePayload);
            break;
        }
      } else {
        switch (activeTab) {
          case "applications": await applicationsApi.create(payload); break;
          case "environments": await applicationsApi.createEnvironment(payload); break;
          case "servers": await infrastructureApi.createServer(payload); break;
          case "services": await applicationsApi.createService(payload); break;
          case "skeclusters": await skeEnvironmentsApi.createCluster(payload); break;
          case "skenamespaces": await skeEnvironmentsApi.createNamespace(payload); break;
          case "skeenvironments": await skeEnvironmentsApi.createEnvironment(payload); break;
          case "skeservices": await skeEnvironmentsApi.createService(payload); break;
          case "users":
            const userCreatePayload = { ...payload, role_ids: formData.getAll("role_ids").map(Number) };
            await usersApi.create(userCreatePayload);
            break;
          case "security":
            const rolePayload = { ...payload, functionality_ids: formData.getAll("functionality_ids").map(Number) };
            await securityApi.createRole(rolePayload);
            break;
        }
      }
      setView("list");
      fetchData();
      loadRefs(); // Refresh dropdown references
      useNavigationStore.getState().refreshAll();
      notify.success(`${singularLabel} processed successfully.`);
    } catch (err) {
      console.error("Save failed", err);
      notify.error(`Save failed. ${err.response?.data?.detail || "Check all fields."}`);
    }
  };



  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Helper to render complex table cells
  const renderCell = (key, value) => {
    if (value === null || value === undefined) return <span className="text-slate-200">—</span>;
    if (key === 'status') return <StatusBadge status={value} />;

    // Handle Booleans
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${value ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    // Handle Arrays (Foreign Keys / Nested Relations)
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-300">0 records</span>;
      if (typeof value[0] === 'object') {
        const display = value.slice(0, 2).map(v => v.name || v.env_id || v.id).filter(Boolean);
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {display.map((d, i) => <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] border border-slate-200 dark:border-slate-700">{d}</span>)}
            {value.length > 2 && <span className="text-[9px] text-slate-400">+{value.length - 2} more</span>}
          </div>
        );
      }
      return <span className="text-xs">{value.join(", ")}</span>;
    }

    // Handle Objects
    if (typeof value === 'object') {
      return <span className="text-[10px] text-slate-400 italic">Record Data</span>;
    }

    // Handle Dates
    if (typeof value === 'string' && value.includes("T") && !isNaN(Date.parse(value))) {
      return <span className="text-[10px] text-slate-500">{new Date(value).toLocaleDateString()}</span>;
    }

    return <span className="text-xs">{String(value)}</span>;
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-8 max-w-4xl">
            {/* User Account Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RiUserLine className="text-brand-500" /> Account Identity
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-sm text-slate-500">Full Name</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{user?.first_name} {user?.last_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-sm text-slate-500">User ID</span>
                    <span className="text-sm font-mono font-bold text-brand-600">{user?.user_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-sm text-slate-500">Email Address</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500">Organization Role</span>
                    <div className="flex gap-1">
                      {user?.roles?.map(r => (
                        <span key={r.id} className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded text-[10px] font-bold uppercase">{r.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <RiShieldLine className="text-brand-500" /> System Metadata
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-sm text-slate-500">Auth Provider</span>
                    <span className="text-sm font-bold capitalize text-slate-800 dark:text-white">{user?.auth_source || 'Local'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-sm text-slate-500">Last Active</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-sm text-slate-500">Account Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user?.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500">Member Since</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interface Style */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Visual Preferences</h3>
                  <p className="text-sm text-slate-500">Configure how the dashboard looks and feels on your device.</p>
                </div>

                <div className="flex flex-col gap-6 w-full md:w-auto">
                  {/* Theme Toggle Placeholder (using dark/light modes of tailwind) */}
                  <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="pl-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Interface Theme</span>
                    <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setDarkMode(false)}
                        className={`p-2 rounded-lg transition-all ${!darkMode ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600' : 'text-slate-400 opacity-50 hover:opacity-100'}`}
                      >
                        <RiSunLine />
                      </button>
                      <button
                        onClick={() => setDarkMode(true)}
                        className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600' : 'text-slate-400 opacity-50 hover:opacity-100'}`}
                      >
                        <RiMoonLine />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="pl-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Dashboard Layout</span>
                    <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setLayoutStyle("honeycomb")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${layoutStyle === "honeycomb" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-600" : "text-slate-400"}`}
                      >
                        Honeycomb
                      </button>
                      <button
                        onClick={() => setLayoutStyle("table")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${layoutStyle === "table" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-600" : "text-slate-400"}`}
                      >
                        Table
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "applications":
        return (
          <div className="space-y-6 max-w-2xl">
            <FormField label="ITAM ID" required><Input name="itam_id" type="number" defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Application Name" required><Input name="name" defaultValue={editingItem?.name} required /></FormField>
            <FormField label="Description"><Input name="description" defaultValue={editingItem?.description} /></FormField>
          </div>
        );
      case "environments":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Environment ID" required><Input name="env_id" placeholder="e.g. prod-apac" defaultValue={editingItem?.env_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Friendly Name" required><Input name="name" defaultValue={editingItem?.name} required /></FormField>
            <FormField label="Service Manager / Owner"><Input name="owner" defaultValue={editingItem?.owner} /></FormField>
            <FormField label="Usage / Business Criticality"><Input name="usage" defaultValue={editingItem?.usage} /></FormField>
            <FormField label="Connectivity Requirements"><Input name="interface_connectivity" defaultValue={editingItem?.interface_connectivity} /></FormField>
            <FormField label="Health Status"><Select name="status" options={["healthy", "warning", "critical"]} defaultValue={editingItem?.status || "healthy"} /></FormField>
          </div>
        );
      case "services":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Environment" required><Select name="env_id" options={infraEnvs.map(e => ({ label: `[${e.env_id}] ${e.name}`, value: e.env_id }))} defaultValue={editingItem?.env_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Service Name" required><Input name="name" defaultValue={editingItem?.name} required disabled={!!editingItem} /></FormField>
            <FormField label="Status"><Select name="status" options={["running", "stopped", "failed"]} defaultValue={editingItem?.status || "running"} /></FormField>
            <div className="col-span-2">
              <FormField label="Description"><Input name="description" defaultValue={editingItem?.description} /></FormField>
            </div>
          </div>
        );
      case "servers":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-4xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required /></FormField>
            <FormField label="Hostname" required><Input name="hostname" defaultValue={editingItem?.hostname} required /></FormField>
            <FormField label="IP Address" required><Input name="ip_address" defaultValue={editingItem?.ip_address} required disabled={!!editingItem} /></FormField>
            <FormField label="SSH Username" required><Input name="username" defaultValue={editingItem?.username} required disabled={!!editingItem} /></FormField>
            <FormField label="SSH Password" required={!editingItem}><Input name="password" type="password" placeholder={editingItem ? "Leave blank to keep current" : "Secure SSH Password"} required={!editingItem} /></FormField>
            <FormField label="Infrastructure Role"><Select name="role" options={["Database", "Web Server", "Application", "Cache", "Load Balancer", "Jump Host"]} defaultValue={editingItem?.role} /></FormField>
            <FormField label="Lifecycle Category"><Select name="category" options={["Production", "User Acceptance", "Development", "Sandpit"]} defaultValue={editingItem?.category || "Development"} /></FormField>
            <FormField label="Operational Status"><Select name="status" options={["Online", "Maintenance", "Offline", "Decommissioned"]} defaultValue={editingItem?.status || "Online"} /></FormField>
            <FormField label="Operating System"><Input name="os" placeholder="e.g. RHEL 8.6" defaultValue={editingItem?.os} /></FormField>
            <FormField label="Processing (CPU)"><Input name="cpu" placeholder="e.g. 16 vCPU" defaultValue={editingItem?.cpu} /></FormField>
            <FormField label="Memory (RAM)"><Input name="memory" placeholder="e.g. 64GB" defaultValue={editingItem?.memory} /></FormField>
            <div className="col-span-2">
              <FormField label="Managed Environments (Multi-Select)" required>
                <Select name="environments" multiple options={infraEnvs.map(e => ({ label: `[${e.env_id}] ${e.name}`, value: e.env_id }))} defaultValue={editingItem?.environments?.map(e => e.env_id || e)} loading={loading} />
              </FormField>
            </div>
          </div>
        );
      case "skeclusters":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Cluster ID" required><Input name="cluster_id" placeholder="e.g. CL-HK-001" defaultValue={editingItem?.cluster_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Display Name"><Input name="cluster_name" defaultValue={editingItem?.cluster_name} /></FormField>
            <FormField label="Auth API URL"><Input name="auth_url" placeholder="https://ske-api..." defaultValue={editingItem?.auth_url} /></FormField>
            <FormField label="SKE Username"><Input name="username" defaultValue={editingItem?.username} /></FormField>
            <FormField label="SKE Password/Token"><Input name="password" type="password" placeholder={editingItem ? "Leave blank to keep current" : ""} defaultValue="" /></FormField>
          </div>
        );
      case "skenamespaces":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="SKE Cluster" required><Select name="cluster_id" options={clusters.map(c => ({ label: `[${c.cluster_id}] ${c.cluster_name}`, value: c.cluster_id }))} defaultValue={editingItem?.cluster_id} required disabled={!!editingItem} /></FormField>
            <FormField label="SKE Environment" required><Select name="ske_env_id" options={skeEnvs.map(e => ({ label: `[${e.ske_env_id}] ${e.name}`, value: e.ske_env_id }))} defaultValue={editingItem?.ske_env_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Namespace Name" required><Input name="namespace" placeholder="e.g. payment-svc-prod" defaultValue={editingItem?.namespace} required disabled={!!editingItem} /></FormField>
            <FormField label="Business Owner"><Input name="owner" defaultValue={editingItem?.owner} /></FormField>
            <div className="col-span-1">
              <FormField label="Mission Description"><Input name="description" defaultValue={editingItem?.description} /></FormField>
            </div>
          </div>
        );
      case "skeenvironments":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="SKE Cluster" required><Select name="cluster_id" options={clusters.map(c => ({ label: `[${c.cluster_id}] ${c.cluster_name}`, value: c.cluster_id }))} defaultValue={editingItem?.cluster_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Environment ID" required><Input name="ske_env_id" placeholder="e.g. sg-prod-v1" defaultValue={editingItem?.ske_env_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Display Name" required><Input name="name" defaultValue={editingItem?.name} required /></FormField>
            <FormField label="Service Manager"><Input name="owner" defaultValue={editingItem?.owner} /></FormField>
            <FormField label="Business Usage"><Input name="usage" defaultValue={editingItem?.usage} /></FormField>
            <FormField label="Network Connectivity"><Input name="interface_connectivity" defaultValue={editingItem?.interface_connectivity} /></FormField>
            <FormField label="Platform Health"><Select name="status" options={["Healthy", "Degraded", "Critical"]} defaultValue={editingItem?.status || "Healthy"} /></FormField>
          </div>
        );
      case "skeservices":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-4xl">
            <FormField label="Application" required><Select name="itam_id" options={apps.map(a => ({ label: `[${a.itam_id}] ${a.name}`, value: a.itam_id }))} defaultValue={editingItem?.itam_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Namespace" required><Select name="namespace" options={namespaces.map(n => ({ label: `[${n.namespace}] ${n.ske_env_id}`, value: n.namespace }))} defaultValue={editingItem?.namespace} required disabled={!!editingItem} /></FormField>
            <FormField label="Cluster" required><Select name="cluster_id" options={clusters.map(c => ({ label: `[${c.cluster_id}] ${c.cluster_name}`, value: c.cluster_id }))} defaultValue={editingItem?.cluster_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Environment" required><Select name="ske_env_id" options={skeEnvs.map(e => ({ label: `[${e.ske_env_id}] ${e.name}`, value: e.ske_env_id }))} defaultValue={editingItem?.ske_env_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Service Identity ID" required><Input name="service_id" defaultValue={editingItem?.service_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Display Name" required><Input name="name" defaultValue={editingItem?.name} required /></FormField>
            <FormField label="Container Replicas" required><Input name="replicas" type="number" defaultValue={editingItem?.replicas || 1} required /></FormField>
            <FormField label="Image Version"><Input name="version" placeholder="e.g. v2.4.1" defaultValue={editingItem?.version} /></FormField>
            <FormField label="Service Health Status"><Select name="status" options={["running", "warning", "failed", "pending"]} defaultValue={editingItem?.status || "running"} /></FormField>
          </div>
        );
      case "users":
        return (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <FormField label="User ID (Network ID)" required><Input name="user_id" defaultValue={editingItem?.user_id} required disabled={!!editingItem} /></FormField>
            <FormField label="Email Address" required><Input name="email" type="email" defaultValue={editingItem?.email} required /></FormField>
            <FormField label="First Name" required><Input name="first_name" defaultValue={editingItem?.first_name} required /></FormField>
            <FormField label="Last Name" required><Input name="last_name" defaultValue={editingItem?.last_name} required /></FormField>
            <FormField label="Login Password" required={!editingItem}><Input name="password" type="password" placeholder={editingItem ? "Leave blank to keep current" : ""} required={!editingItem} /></FormField>
            <FormField label="Auth Source"><Select name="auth_source" options={["local", "active_directory", "saml"]} defaultValue={editingItem?.auth_source || "local"} /></FormField>
            <div className="col-span-2">
              <FormField label="Assigned System Roles" required>
                <Select name="role_ids" multiple options={roles.map(r => ({ label: `[${r.id}] ${r.name}`, value: r.id }))} defaultValue={editingItem?.roles?.map(r => r.id)} loading={loading} />
              </FormField>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase cursor-pointer">
                <input type="checkbox" name="is_external" defaultChecked={editingItem?.is_external} className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                Is External Vendor
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase cursor-pointer">
                <input type="checkbox" name="is_active" defaultChecked={editingItem?.is_active ?? true} className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
                Account Active
              </label>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-6 max-w-2xl">
            <FormField label="Role Name" required><Input name="name" defaultValue={editingItem?.name} required disabled={!!editingItem} /></FormField>
            <FormField label="AD Group Mapping"><Input name="ad_group_mapping" placeholder="LDAP Distinguised Name" defaultValue={editingItem?.ad_group_mapping} /></FormField>
            <FormField label="Role Description"><Input name="description" defaultValue={editingItem?.description} /></FormField>
            <FormField label="Permissions (Functionalities)" required>
              <Select name="functionality_ids" multiple options={funcs.map(f => ({ label: `[${f.id}] ${f.name.split('.').pop().toUpperCase()}: ${f.name}`, value: f.id }))} defaultValue={editingItem?.functionalities?.map(f => f.id)} loading={loading} />
            </FormField>
          </div>
        );
      default: return <p className="text-slate-400 italic">Form for {activeTab} is not yet available.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 px-2">
        <div>
          <h1 className="text-2xl font-extrabold dark:text-white flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              {activeCategory.icon && <activeCategory.icon className="text-xl" />}
            </div>
            {activeCategory.label} Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCategory.id === 'profile'
              ? 'Manage your account preferences and interface style.'
              : `Configure and manage ${activeCategory.label.toLowerCase()} settings.`}
          </p>
        </div>
      </div>

      <div className="w-full">
        {/* Action Table or Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px]">
          {view === "list" ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" placeholder={`Search ${activeTab}...`}
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  {activeTab !== 'operations' && <button onClick={() => document.getElementById('imp').click()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"><RiHistoryLine className="text-sm" /> Import CSV</button>}
                  <input id="imp" type="file" className="hidden" onChange={async (e) => {
                    const f = e.target.files[0]; if (!f) return;
                    const fd = new FormData(); fd.append('file', f);
                    try {
                      const r = await importApi.upload(activeTab, fd);
                      notify.success(`Success: ${r.data.success_count} imported`);
                      fetchData();
                    } catch (err) { notify.error("Import failed"); }
                  }} />
                  {canAdd && <button onClick={handleAdd} className="btn-primary text-xs flex items-center gap-2"><RiAddLine /> Add {singularLabel}</button>}
                </div>
              </div>
              {loading && data.length === 0 ? (
                <SkeletonTable rows={8} cols={6} />
              ) : !loading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    {activeCategory.icon && <activeCategory.icon className="text-3xl text-slate-400" />}
                  </div>
                  <p className="text-slate-500 font-semibold">No {activeCategory.label} found</p>
                  <p className="text-slate-400 text-xs mt-1">Use <strong>Import CSV</strong> or <strong>Add</strong> to get started.</p>
                </div>
              ) : (
                <div className={`overflow-x-auto transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        {data[0] && Object.keys(data[0]).filter(k => !['password', 'id', 'services', 'functionalities', 'environments'].includes(k)).map(key => (
                          <th key={key} className="px-4 py-3">{key.replace('_', ' ')}</th>
                        ))}
                        {activeTab !== 'operations' && <th className="px-4 py-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {filteredData.map(item => (
                        <tr key={item.id || item.itam_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                          {Object.entries(item).filter(([k, v]) => !['password', 'id', 'services', 'functionalities', 'environments'].includes(k)).map(([k, v]) => (
                            <td key={k} className="px-4 py-4 text-slate-600 dark:text-slate-300 capitalize text-xs">
                              {renderCell(k, v)}
                            </td>
                          ))}
                          {activeTab !== 'operations' && (
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEdit && <button onClick={() => handleEdit(item)} className="text-brand-500 hover:scale-110 transition-transform" title="Edit"><RiEditLine /></button>}
                                {canDelete && <button onClick={() => handleDelete(item)} className="text-rose-500 hover:scale-110 transition-transform" title="Delete"><RiDeleteBinLine /></button>}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="p-8">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h2 className="text-lg font-bold dark:text-white uppercase tracking-tight">{editingItem ? 'Edit' : 'Create'} {singularLabel}</h2>
                <p className="text-xs text-slate-400">Complete the hierarchy links below.</p>
              </div>
              <div className="space-y-6">
                {renderFormFields()}
                <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <button type="submit" className="btn-primary py-3 px-8 text-sm font-bold uppercase tracking-widest flex items-center gap-2"><RiCheckLine /> Save</button>
                  <button type="button" onClick={handleCancel} className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, item: null })}
        onConfirm={executeDelete}
        title="Confirm Deletion"
        message="This action will permanently remove this resource and may affect dependent entities due to cascading rules."
      />
    </div>
  );
}
