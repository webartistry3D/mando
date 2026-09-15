import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Business {
  id: string;
  name: string;
  logoAttachmentId: string | null;
  cacNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

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

export default function BusinessSettingsPage() {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<Business & { settings: BusinessSettings }>('/business'),
  });

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cacNumber: '',
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
    if (business) {
      setProfile({
        name: business.name || '',
        phone: business.phone || '',
        email: business.email || '',
        address: business.address || '',
        cacNumber: business.cacNumber || '',
      });
      if (business.settings) {
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
    }
  }, [business]);

  const updateBusiness = useMutation({
    mutationFn: (data: Partial<typeof profile>) => api.patch('/business', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      setMsg('Business profile updated');
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  const updateSettings = useMutation({
    mutationFn: (data: Partial<typeof settings>) => api.patch('/business/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      setMsg('Settings updated');
    },
    onError: (err) => setMsg(err instanceof Error ? err.message : 'Update failed'),
  });

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Business Settings</h1>

      {msg && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{msg}</div>}

      {/* Business Profile */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateBusiness.mutate(profile);
        }}
        className="rounded-lg border bg-card p-4 space-y-4"
      >
        <h2 className="text-lg font-semibold">Business Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Business Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">CAC / Registration Number</label>
            <input
              type="text"
              value={profile.cacNumber}
              onChange={(e) => setProfile((p) => ({ ...p, cacNumber: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={updateBusiness.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {updateBusiness.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Operational Settings */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateSettings.mutate({
            ...settings,
            taxRate: settings.taxRate,
          });
        }}
        className="rounded-lg border bg-card p-4 space-y-4"
      >
        <h2 className="text-lg font-semibold">Operational Settings</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Currency</label>
            <input
              type="text"
              value={settings.currency}
              onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
            />
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
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
