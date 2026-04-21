import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
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
import AddFriendsPage from "./pages/AddFriendsPage.tsx";
import SupportPage from "./pages/SupportPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";

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
            <Route element={<ProtectedRoute />}>
                <Route path="/notifications" element={<NotificationPage />} />
                <Route path="/conversation/:friendId" element={<ConversationPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/notifications" element={<NotificationPage />} />
                <Route path="/addfriends" element={<AddFriendsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/settings" element={<SettingsPage />} />

            </Route>
        </Routes>
      </BrowserRouter>
  );
}
export default App;