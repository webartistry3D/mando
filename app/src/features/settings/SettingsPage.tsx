import { Link } from 'react-router-dom';

export default function SettingsPage() {
  const sections = [
    {
      title: 'Business Profile',
      description: 'Name, logo, CAC number, address, contact info',
      href: '/settings/business',
    },
    {
      title: 'Users & Roles',
      description: 'Manage staff members and their roles',
      href: '/settings/users',
    },
  ];

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            to={s.href}
            className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
          >
            <h2 className="font-semibold">{s.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
