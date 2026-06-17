import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { BusinessProfilePage } from './pages/BusinessProfilePage';
import CheckoutPage from './pages/CheckoutPage'; // Imerekebishwa (Default export)
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/business/:id" element={<BusinessProfilePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Checkout Flow */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />

        {/* Dashboard Routes (Inatakiwa kulindwa kwa Auth) */}
        <Route path="/dashboard/customer" element={<CustomerDashboardPage />} />
        <Route path="/dashboard/business" element={<BusinessDashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* 404 Not Found fallback */}
        <Route path="*" element={<div className="p-10 text-center">Page Not Found - 404</div>} />
      </Routes>
    </Router>
  );
}

export default App;