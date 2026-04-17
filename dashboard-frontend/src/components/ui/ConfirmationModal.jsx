import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { RiAlertLine, RiCloseLine } from 'react-icons/ri';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Delete", 
  cancelText = "Cancel",
  variant = "danger" // 'danger', 'primary', 'warning'
}) {
  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
    primary: "bg-brand-600 hover:bg-brand-700 shadow-brand-500/20",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
  };

  const iconStyles = {
    danger: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    primary: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-8 border border-white/10">
                <div className="absolute right-6 top-6">
                  <button
                    type="button"
                    className="rounded-full p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    onClick={onClose}
                  >
                    <RiCloseLine className="text-2xl" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${iconStyles[variant]} sm:mx-0`}>
                    <RiAlertLine className="text-2xl" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-6 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900 dark:text-white">
                      {title}
                    </Dialog.Title>
                    <div className="mt-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-lg active:scale-95 transition-all sm:w-auto ${variantStyles[variant]}`}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-8 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all sm:w-auto"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
