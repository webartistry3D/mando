import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
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
import SalesOverviewPage from '@/features/sales/SalesOverviewPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ReportsPage from '@/features/reports/ReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Layout><SalesOverviewPage /></Layout></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Layout><ProductListPage /></Layout></ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute><Layout><ProductNewPage /></Layout></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><Layout><ProductDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Layout><CustomerListPage /></Layout></ProtectedRoute>} />
        <Route path="/customers/new" element={<ProtectedRoute><Layout><CustomerNewPage /></Layout></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><Layout><CustomerDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/estimates" element={<ProtectedRoute><Layout><EstimateListPage /></Layout></ProtectedRoute>} />
        <Route path="/estimates/new" element={<ProtectedRoute><Layout><EstimateNewPage /></Layout></ProtectedRoute>} />
        <Route path="/estimates/:id" element={<ProtectedRoute><Layout><EstimateDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Layout><InvoiceListPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><Layout><InvoiceNewPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><Layout><InvoiceDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Layout><PaymentListPage /></Layout></ProtectedRoute>} />
        <Route path="/payments/new" element={<ProtectedRoute><Layout><PaymentNewPage /></Layout></ProtectedRoute>} />
        <Route path="/payments/:id" element={<ProtectedRoute><Layout><PaymentDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Layout><ExpenseListPage /></Layout></ProtectedRoute>} />
        <Route path="/expenses/new" element={<ProtectedRoute><Layout><ExpenseNewPage /></Layout></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute><Layout><DeliveryListPage /></Layout></ProtectedRoute>} />
        <Route path="/deliveries/new" element={<ProtectedRoute><Layout><DeliveryNewPage /></Layout></ProtectedRoute>} />
        <Route path="/deliveries/:id" element={<ProtectedRoute><Layout><DeliveryDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><ReportsPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/settings/business" element={<ProtectedRoute><Layout><BusinessSettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/settings/users" element={<ProtectedRoute><Layout><UserManagementPage /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
