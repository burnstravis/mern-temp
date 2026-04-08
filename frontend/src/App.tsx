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
import ConversationPage from "./pages/ConversationPage.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import Navbar from "./components/Navbar.tsx";
import FriendsPage from "./pages/FriendsPage.tsx";

const ProtectedRoute = () => {
    const isLogged = localStorage.getItem('user_data');

    if (!isLogged) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="app-layout">
            <Navbar />
            <Outlet />
        </div>
    );
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
            <Route path="/notifications" element={<NotificationPage />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/cards" element={<CardPage />} />
                <Route path="/conversation" element={<ConversationPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/friends" element={<FriendsPage />} />
            </Route>
        </Routes>
      </BrowserRouter>
  );
}
export default App;