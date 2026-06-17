import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage'; // Imesafishwa
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
        <Route path="/" element={<HomePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/booking/success" element={<BookingSuccessPage />} />
        <Route path="/dashboard/customer" element={<CustomerDashboardPage />} />
        <Route path="/dashboard/business" element={<BusinessDashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;