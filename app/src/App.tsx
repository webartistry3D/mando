import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import SettingsPage from '@/features/settings/SettingsPage';
import BusinessSettingsPage from '@/features/settings/BusinessSettingsPage';
import UserManagementPage from '@/features/settings/UserManagementPage';
import CustomerListPage from '@/features/customers/CustomerListPage';
import CustomerNewPage from '@/features/customers/CustomerNewPage';
import CustomerDetailPage from '@/features/customers/CustomerDetailPage';
import ProductListPage from '@/features/products/ProductListPage';
import ProductNewPage from '@/features/products/ProductNewPage';
import ProductDetailPage from '@/features/products/ProductDetailPage';
import EstimateListPage from '@/features/estimates/EstimateListPage';
import EstimateNewPage from '@/features/estimates/EstimateNewPage';
import EstimateDetailPage from '@/features/estimates/EstimateDetailPage';
import InvoiceListPage from '@/features/invoices/InvoiceListPage';
import InvoiceNewPage from '@/features/invoices/InvoiceNewPage';
import InvoiceDetailPage from '@/features/invoices/InvoiceDetailPage';
import PaymentListPage from '@/features/payments/PaymentListPage';
import PaymentNewPage from '@/features/payments/PaymentNewPage';
import PaymentDetailPage from '@/features/payments/PaymentDetailPage';
import ExpenseListPage from '@/features/expenses/ExpenseListPage';
import ExpenseNewPage from '@/features/expenses/ExpenseNewPage';
import DeliveryListPage from '@/features/deliveries/DeliveryListPage';
import DeliveryNewPage from '@/features/deliveries/DeliveryNewPage';
import DeliveryDetailPage from '@/features/deliveries/DeliveryDetailPage';

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
        <Route path="/products" element={<ProtectedRoute><ProductListPage /></ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute><ProductNewPage /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomerListPage /></ProtectedRoute>} />
        <Route path="/customers/new" element={<ProtectedRoute><CustomerNewPage /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/estimates" element={<ProtectedRoute><EstimateListPage /></ProtectedRoute>} />
        <Route path="/estimates/new" element={<ProtectedRoute><EstimateNewPage /></ProtectedRoute>} />
        <Route path="/estimates/:id" element={<ProtectedRoute><EstimateDetailPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><InvoiceListPage /></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><InvoiceNewPage /></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentListPage /></ProtectedRoute>} />
        <Route path="/payments/new" element={<ProtectedRoute><PaymentNewPage /></ProtectedRoute>} />
        <Route path="/payments/:id" element={<ProtectedRoute><PaymentDetailPage /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><ExpenseListPage /></ProtectedRoute>} />
        <Route path="/expenses/new" element={<ProtectedRoute><ExpenseNewPage /></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute><DeliveryListPage /></ProtectedRoute>} />
        <Route path="/deliveries/new" element={<ProtectedRoute><DeliveryNewPage /></ProtectedRoute>} />
        <Route path="/deliveries/:id" element={<ProtectedRoute><DeliveryDetailPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Placeholder name="Reports" /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/business" element={<ProtectedRoute><BusinessSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
