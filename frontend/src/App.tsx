import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import CardPage from './pages/CardPage.tsx';
import RegisterPage from "./pages/RegisterPage.tsx";
import NotificationPage from "./pages/NotificationPage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => { //keeps unlogged in users from viewing certain pages
    const isLogged = localStorage.getItem('user_data');

    return isLogged ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
            <Route path="/resetPassword" element={<ResetPasswordPage />} />
            <Route path="/notification" element={<NotificationPage />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/cards" element={<CardPage />} />
            </Route>
        </Routes>
      </BrowserRouter>
  );
}
export default App;