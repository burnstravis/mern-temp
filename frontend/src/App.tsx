import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage.tsx';
import CardPage from './pages/CardPage.tsx';
import RegisterPage from "./pages/RegisterPage.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import { Navigate, Outlet } from 'react-router-dom';
import ConversationPage from "./pages/ConversationPage.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import HomePage from "./pages/HomePage.tsx";

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
            <Route element={<ProtectedRoute />}>
                <Route path="/cards" element={<CardPage />} />
                <Route path="/conversation" element={<ConversationPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/home" element={<HomePage />} />

            </Route>
        </Routes>
      </BrowserRouter>
  );
}
export default App;