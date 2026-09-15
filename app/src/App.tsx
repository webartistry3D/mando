import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import SettingsPage from '@/features/settings/SettingsPage';
import BusinessSettingsPage from '@/features/settings/BusinessSettingsPage';
import UserManagementPage from '@/features/settings/UserManagementPage';

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-muted-foreground mt-2">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Placeholder name="Dashboard" /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Placeholder name="Sales" /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Placeholder name="Products" /></ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute><Placeholder name="New Product" /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><Placeholder name="Product Detail" /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Placeholder name="Customers" /></ProtectedRoute>} />
        <Route path="/customers/new" element={<ProtectedRoute><Placeholder name="New Customer" /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><Placeholder name="Customer Detail" /></ProtectedRoute>} />
        <Route path="/estimates" element={<ProtectedRoute><Placeholder name="Estimates" /></ProtectedRoute>} />
        <Route path="/estimates/new" element={<ProtectedRoute><Placeholder name="New Estimate" /></ProtectedRoute>} />
        <Route path="/estimates/:id" element={<ProtectedRoute><Placeholder name="Estimate Detail" /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Placeholder name="Invoices" /></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><Placeholder name="New Invoice" /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><Placeholder name="Invoice Detail" /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Placeholder name="Payments" /></ProtectedRoute>} />
        <Route path="/payments/new" element={<ProtectedRoute><Placeholder name="New Payment" /></ProtectedRoute>} />
        <Route path="/payments/:id" element={<ProtectedRoute><Placeholder name="Payment Detail" /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Placeholder name="Expenses" /></ProtectedRoute>} />
        <Route path="/expenses/new" element={<ProtectedRoute><Placeholder name="New Expense" /></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute><Placeholder name="Deliveries" /></ProtectedRoute>} />
        <Route path="/deliveries/new" element={<ProtectedRoute><Placeholder name="New Delivery" /></ProtectedRoute>} />
        <Route path="/deliveries/:id" element={<ProtectedRoute><Placeholder name="Delivery Detail" /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Placeholder name="Reports" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/business" element={<ProtectedRoute><BusinessSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
