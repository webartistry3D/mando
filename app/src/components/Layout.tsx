import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from './NotificationBell';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/sales', label: 'Sales', icon: '💼' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/estimates', label: 'Estimates', icon: '📄' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/payments', label: 'Payments', icon: '💰' },
  { to: '/expenses', label: 'Expenses', icon: '📉' },
  { to: '/deliveries', label: 'Deliveries', icon: '🚚' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', icon: '📊' },
  { to: '/sales', label: 'Sales', icon: '💼' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:border-r md:bg-card">
        <div className="flex h-14 items-center px-4 border-b">
          <span className="text-xl font-bold">Mando</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <NavLink to="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
            <span>⚙️</span> Settings
          </NavLink>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent text-muted-foreground"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Desktop main content */}
      <div className="md:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <span className="text-lg font-bold md:hidden">Mando</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-background md:hidden">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
