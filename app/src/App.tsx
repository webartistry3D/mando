import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Placeholder name="Login" />} />
        <Route path="/register" element={<Placeholder name="Register" />} />
        <Route path="/dashboard" element={<Placeholder name="Dashboard" />} />
        <Route path="/sales" element={<Placeholder name="Sales" />} />
        <Route path="/products" element={<Placeholder name="Products" />} />
        <Route path="/products/new" element={<Placeholder name="New Product" />} />
        <Route path="/products/:id" element={<Placeholder name="Product Detail" />} />
        <Route path="/customers" element={<Placeholder name="Customers" />} />
        <Route path="/customers/new" element={<Placeholder name="New Customer" />} />
        <Route path="/customers/:id" element={<Placeholder name="Customer Detail" />} />
        <Route path="/estimates" element={<Placeholder name="Estimates" />} />
        <Route path="/estimates/new" element={<Placeholder name="New Estimate" />} />
        <Route path="/estimates/:id" element={<Placeholder name="Estimate Detail" />} />
        <Route path="/invoices" element={<Placeholder name="Invoices" />} />
        <Route path="/invoices/new" element={<Placeholder name="New Invoice" />} />
        <Route path="/invoices/:id" element={<Placeholder name="Invoice Detail" />} />
        <Route path="/payments" element={<Placeholder name="Payments" />} />
        <Route path="/payments/new" element={<Placeholder name="New Payment" />} />
        <Route path="/payments/:id" element={<Placeholder name="Payment Detail" />} />
        <Route path="/expenses" element={<Placeholder name="Expenses" />} />
        <Route path="/expenses/new" element={<Placeholder name="New Expense" />} />
        <Route path="/deliveries" element={<Placeholder name="Deliveries" />} />
        <Route path="/deliveries/new" element={<Placeholder name="New Delivery" />} />
        <Route path="/deliveries/:id" element={<Placeholder name="Delivery Detail" />} />
        <Route path="/reports" element={<Placeholder name="Reports" />} />
        <Route path="/settings" element={<Placeholder name="Settings" />} />
        <Route path="/settings/business" element={<Placeholder name="Business Settings" />} />
        <Route path="/settings/users" element={<Placeholder name="User Management" />} />
      </Routes>
    </BrowserRouter>
  );
}
