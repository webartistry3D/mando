import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import DispatchPasswordModal from '@/features/settings/DispatchPasswordModal';
import {
  LayoutDashboard, Users, Package, FileText,
  Receipt, Banknote, TrendingDown, Truck, BarChart3,
  Settings, LogOut, MoreHorizontal, Briefcase, X, Calculator,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/estimates', label: 'Estimates', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/payments', label: 'Payments', icon: Banknote },
  { to: '/expenses', label: 'Expenses', icon: TrendingDown },
  { to: '/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/tax', label: 'Tax', icon: Calculator },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

interface BottomGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  action?: 'logout';
  children?: { to?: string; label: string; icon: React.ComponentType<{ className?: string }>; disabled?: boolean; action?: 'logout' }[];
}

const bottomGroups: BottomGroup[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    key: 'assets',
    label: 'Assets',
    icon: Package,
    children: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/products', label: 'Products', icon: Package },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    icon: Briefcase,
    children: [
      { to: '/estimates', label: 'Estimates', icon: FileText },
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/payments', label: 'Payments', icon: Banknote },
      { to: '/expenses', label: 'Expenses', icon: TrendingDown },
    ],
  },
  {
    key: 'dispatch',
    label: 'Deliveries  ',
    icon: Truck,
    to: '/deliveries',
  },
  {
    key: 'more',
    label: 'More',
    icon: MoreHorizontal,
    children: [
      { to: '/tax', label: 'Tax', icon: Calculator },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/settings', label: 'Settings', icon: Settings },
      { action: 'logout', label: 'Logout', icon: LogOut },
    ],
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isStaff = user?.role === 'STAFF';
  const isDispatch = user?.role === 'DISPATCH';
  const staffHidden = ['/dashboard', '/reports', '/tax'];
  const dispatchAllowed = ['/deliveries', '/dispatch'];
  
  let visibleNavItems = navItems;
  let visibleBottomGroups = bottomGroups;

  if (isDispatch) {
    // Dispatch users can only see deliveries + settings (password) + logout
    visibleNavItems = navItems.filter((item) => dispatchAllowed.includes(item.to));
    visibleBottomGroups = [
      bottomGroups.find((g) => g.key === 'dispatch')!,
      {
        key: 'settings',
        label: 'Settings',
        icon: Settings,
      },
      {
        key: 'logout',
        label: 'Logout',
        icon: LogOut,
        action: 'logout' as const,
      },
    ];
  } else if (isStaff) {
    // Staff cannot see dashboard, reports, tax
    visibleNavItems = navItems.filter((item) => !staffHidden.includes(item.to));
    visibleBottomGroups = bottomGroups
      .filter((g) => g.key !== 'dashboard')
      .map((g) =>
        g.key === 'more'
          ? { ...g, children: g.children?.filter((c) => c.action === 'logout') }
          : g,
      );
  }

  function closeTray() {
    setClosing(true);
    setTimeout(() => {
      setOpenGroup(null);
      setClosing(false);
    }, 200);
  }

  function handleGroupClick(key: string, to?: string, action?: 'logout') {
    if (action === 'logout') {
      setShowLogout(true);
      return;
    }
    if (to) {
      if (isDispatch && key === 'settings') {
        setShowPasswordModal(true);
        return;
      }
      navigate(to);
      return;
    }
    if (openGroup === key) {
      closeTray();
      return;
    }
    setClosing(false);
    setOpenGroup(key);
  }

  function isGroupActive(group: BottomGroup): boolean {
    const path = location.pathname;
    if (group.to === path) return true;
    return group.children?.some((c) => c.to && (path === c.to || (c.to !== '/' && path.startsWith(c.to + '/')))) ?? false;
  }

  function isDispatchGroupActive(key: string): boolean {
    if (key === 'settings') return location.pathname === '/settings';
    return false;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:border-r md:bg-card">
        <div className="flex h-14 items-center px-4 border-b">
          <span className="text-xl font-bold">mando</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          {!isStaff && !isDispatch && (
            <NavLink to="/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
              <Settings className="h-4 w-4" /> Settings
            </NavLink>
          )}
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent text-muted-foreground"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Desktop main content */}
      <div className="md:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
          <span className="text-lg font-bold md:hidden">mando</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      {/* Submenu modal — fade in, centered, vertically stacked items */}
      {openGroup && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeTray}
          />
          <div
            className={`absolute inset-0 flex items-center justify-center p-6 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeTray}
          >
            <div className="relative w-full max-w-xs rounded-xl border bg-card p-3 shadow-3d" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closeTray}
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {visibleBottomGroups.find((g) => g.key === openGroup)?.label}
              </div>
              <div className="divide-y divide-gray-300 dark:divide-gray-600">
                {visibleBottomGroups.find((g) => g.key === openGroup)?.children?.map((child) => (
                  <button
                    key={child.to || child.label}
                    disabled={child.disabled}
                    onClick={() => {
                      if (child.disabled) return;
                      closeTray();
                      if (child.action === 'logout') {
                        setShowLogout(true);
                      } else if (child.to) {
                        navigate(child.to);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-lg font-medium transition-colors ${
                      child.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                    }`}
                  >
                    <child.icon className="h-6 w-6 shrink-0" />
                    {child.label}
                    {child.disabled && <span className="text-xs text-muted-foreground ml-auto">Soon</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogout && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowLogout(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-6 animate-fade-in">
            <div className="relative w-full max-w-xs rounded-xl border bg-card p-4 shadow-3d" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">Logout</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Are you sure you want to logout?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogout(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
        <div className="flex">
          {visibleBottomGroups.map((group) => (
            <button
              key={group.key}
              onClick={() => handleGroupClick(group.key, group.to, group.action)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                openGroup === group.key || isGroupActive(group) || (isDispatch && isDispatchGroupActive(group.key)) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <group.icon className="h-6 w-6" />
              {group.label}
            </button>
          ))}
        </div>
      </nav>

      <DispatchPasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
}
