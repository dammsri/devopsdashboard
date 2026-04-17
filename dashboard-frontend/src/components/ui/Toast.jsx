import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCheckboxCircleFill, 
  RiErrorWarningFill, 
  RiInformationFill, 
  RiCloseLine,
  RiAlertFill
} from 'react-icons/ri';
import { useNotificationStore } from '../../store/notificationStore';

const TOAST_TYPES = {
  success: {
    icon: RiCheckboxCircleFill,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-100 dark:border-emerald-800',
  },
  error: {
    icon: RiErrorWarningFill,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-100 dark:border-red-800',
  },
  warning: {
    icon: RiAlertFill,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-100 dark:border-amber-800',
  },
  info: {
    icon: RiInformationFill,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-800',
  },
};

export function Toast({ id, type, message }) {
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-md rounded-2xl shadow-xl border ${config.bg} ${config.border} backdrop-blur-md`}
    >
      <div className={`p-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm ${config.color}`}>
        <Icon className="text-xl" />
      </div>
      <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
        {message}
      </div>
      <button
        onClick={() => removeNotification(id)}
        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <RiCloseLine className="text-xl" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const notifications = useNotificationStore((state) => state.notifications);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <Toast {...n} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
