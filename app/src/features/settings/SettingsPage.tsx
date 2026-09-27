import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import BusinessProfileModal from './BusinessProfileModal';
import OperationalSettingsModal from './OperationalSettingsModal';
import UserManagementModal from './UserManagementModal';
import DispatchPasswordModal from './DispatchPasswordModal';

export default function SettingsPage() {
  const { user } = useAuth();
  const [businessOpen, setBusinessOpen] = useState(false);
  const [operationalOpen, setOperationalOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const isDispatch = user?.role === 'DISPATCH';

  const sections = isDispatch
    ? [
        {
          title: 'Change Password',
          description: 'Update your account password',
          onClick: () => setPasswordOpen(true),
        },
      ]
    : [
        {
          title: 'Business Profile',
          description: 'Name, logo, CAC number, address, contact info',
          onClick: () => setBusinessOpen(true),
        },
        {
          title: 'Operational Settings',
          description: 'Currency, prefixes, tax, payment instructions',
          onClick: () => setOperationalOpen(true),
        },
        {
          title: 'Users & Roles',
          description: 'Manage staff members and their roles',
          onClick: () => setUsersOpen(true),
        },
      ];

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-md space-y-3">
        {sections.map((s) => (
          <button
            key={s.title}
            onClick={s.onClick}
            className="w-full text-left block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors shadow-3d-sm"
          >
            <h2 className="font-semibold">{s.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
          </button>
        ))}
      </div>

      {!isDispatch && (
        <>
          <BusinessProfileModal open={businessOpen} onClose={() => setBusinessOpen(false)} />
          <OperationalSettingsModal open={operationalOpen} onClose={() => setOperationalOpen(false)} />
          <UserManagementModal open={usersOpen} onClose={() => setUsersOpen(false)} />
        </>
      )}
      {isDispatch && <DispatchPasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}
