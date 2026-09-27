import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

interface BusinessSettings {
  id: string;
  businessId: string;
  currency: string;
  invoicePrefix: string;
  estimatePrefix: string;
  deliveryPrefix: string;
  taxEnabled: boolean;
  taxRate: string;
  paymentInstructions: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function OperationalSettingsModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<{ settings: BusinessSettings }>('/business'),
    enabled: open,
  });

  const [settings, setSettings] = useState({
    currency: 'NGN',
    invoicePrefix: 'INV',
    estimatePrefix: 'EST',
    deliveryPrefix: 'DEL',
    taxEnabled: false,
    taxRate: '0',
    paymentInstructions: '',
  });

  useEffect(() => {
    if (business?.settings) {
      setSettings({
        currency: business.settings.currency,
        invoicePrefix: business.settings.invoicePrefix,
        estimatePrefix: business.settings.estimatePrefix,
        deliveryPrefix: business.settings.deliveryPrefix,
        taxEnabled: business.settings.taxEnabled,
        taxRate: business.settings.taxRate,
        paymentInstructions: business.settings.paymentInstructions || '',
      });
    }
  }, [business]);

  const updateSettings = useMutation({
    mutationFn: (data: Partial<typeof settings>) => api.patch('/business/settings', {
      ...data,
      taxRate: data.taxRate !== undefined ? parseFloat(data.taxRate) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      setMsg('Settings updated');
      setTimeout(() => {
        handleClose();
      }, 1500);
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  function handleClose() {
    setMsg('');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border bg-card shadow-3d"
          >
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
              <h2 className="font-semibold">Operational Settings</h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              <AnimatePresence>
                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-md bg-green-50 p-3 text-sm text-green-700"
                  >
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-4"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateSettings.mutate({
                      invoicePrefix: settings.invoicePrefix,
                      estimatePrefix: settings.estimatePrefix,
                      deliveryPrefix: settings.deliveryPrefix,
                      taxEnabled: settings.taxEnabled,
                      taxRate: settings.taxRate,
                      paymentInstructions: settings.paymentInstructions,
                    });
                  }}
                  className="rounded-lg border bg-card p-4 space-y-4"
                >
                  <h3 className="text-lg font-semibold">Operational Settings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium">₦</span>
                        <input
                          type="text"
                          value={settings.currency}
                          readOnly
                          className="w-full rounded-md border bg-muted px-3 py-2 text-sm pl-8 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Invoice Prefix</label>
                      <input
                        type="text"
                        value={settings.invoicePrefix}
                        onChange={(e) => setSettings((s) => ({ ...s, invoicePrefix: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Estimate Prefix</label>
                      <input
                        type="text"
                        value={settings.estimatePrefix}
                        onChange={(e) => setSettings((s) => ({ ...s, estimatePrefix: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Delivery Prefix</label>
                      <input
                        type="text"
                        value={settings.deliveryPrefix}
                        onChange={(e) => setSettings((s) => ({ ...s, deliveryPrefix: e.target.value }))}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={settings.taxEnabled}
                        onChange={(e) => setSettings((s) => ({ ...s, taxEnabled: e.target.checked }))}
                        className="rounded"
                      />
                      Enable VAT/Tax
                    </label>
                    {settings.taxEnabled && (
                      <input
                        type="number"
                        step="0.01"
                        value={settings.taxRate}
                        onChange={(e) => setSettings((s) => ({ ...s, taxRate: e.target.value }))}
                        className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Rate %"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Instructions</label>
                    <textarea
                      value={settings.paymentInstructions}
                      onChange={(e) => setSettings((s) => ({ ...s, paymentInstructions: e.target.value }))}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                      rows={3}
                      placeholder="Bank name, account number, etc."
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={updateSettings.isPending}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
