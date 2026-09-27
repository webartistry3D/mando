import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import GoogleAuthSuccessPage from '@/features/auth/GoogleAuthSuccessPage';
import SettingsPage from '@/features/settings/SettingsPage';
import DispatchSettingsPage from '@/features/settings/DispatchSettingsPage';
import CustomerListPage from '@/features/customers/CustomerListPage';
import CustomerDetailPage from '@/features/customers/CustomerDetailPage';
import ProductListPage from '@/features/products/ProductListPage';
import ProductDetailPage from '@/features/products/ProductDetailPage';
import EstimateListPage from '@/features/estimates/EstimateListPage';
import EstimateNewPage from '@/features/estimates/EstimateNewPage';
import EstimateDetailPage from '@/features/estimates/EstimateDetailPage';
import InvoiceListPage from '@/features/invoices/InvoiceListPage';
import InvoiceNewPage from '@/features/invoices/InvoiceNewPage';
import InvoiceDetailPage from '@/features/invoices/InvoiceDetailPage';
import PaymentListPage from '@/features/payments/PaymentListPage';
import PaymentDetailPage from '@/features/payments/PaymentDetailPage';
import ExpenseListPage from '@/features/expenses/ExpenseListPage';
import DeliveryListPage from '@/features/deliveries/DeliveryListPage';
import DeliveryDetailPage from '@/features/deliveries/DeliveryDetailPage';
// import SalesOverviewPage from '@/features/sales/SalesOverviewPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import ReportsPage from '@/features/reports/ReportsPage';
import TaxPage from '@/features/tax/TaxPage';
import DispatchTrackerPage from '@/features/dispatch/DispatchTrackerPage';
import LandingPage from '@/features/landing/LandingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><Layout><DashboardPage /></Layout></ProtectedRoute>} />
        {/* <Route path="/sales" element={<ProtectedRoute><Layout><SalesOverviewPage /></Layout></ProtectedRoute>} /> */}
        <Route path="/products" element={<ProtectedRoute><Layout><ProductListPage /></Layout></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><Layout><ProductDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Layout><CustomerListPage /></Layout></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><Layout><CustomerDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/estimates" element={<ProtectedRoute><Layout><EstimateListPage /></Layout></ProtectedRoute>} />
        <Route path="/estimates/new" element={<ProtectedRoute><Layout><EstimateNewPage /></Layout></ProtectedRoute>} />
        <Route path="/estimates/:id" element={<ProtectedRoute><Layout><EstimateDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Layout><InvoiceListPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices/new" element={<ProtectedRoute><Layout><InvoiceNewPage /></Layout></ProtectedRoute>} />
        <Route path="/invoices/:id" element={<ProtectedRoute><Layout><InvoiceDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Layout><PaymentListPage /></Layout></ProtectedRoute>} />
        <Route path="/payments/:id" element={<ProtectedRoute><Layout><PaymentDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Layout><ExpenseListPage /></Layout></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'STAFF', 'DISPATCH']}><Layout><DeliveryListPage /></Layout></ProtectedRoute>} />
        <Route path="/deliveries/:id" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'STAFF', 'DISPATCH']}><Layout><DeliveryDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/dispatch" element={<ProtectedRoute><Layout><DispatchTrackerPage /></Layout></ProtectedRoute>} />
        <Route path="/tax" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><Layout><TaxPage /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><Layout><ReportsPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}><Layout><SettingsPage /></Layout></ProtectedRoute>} />
        <Route path="/dispatch-settings" element={<ProtectedRoute allowedRoles={['DISPATCH']}><Layout><DispatchSettingsPage /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
