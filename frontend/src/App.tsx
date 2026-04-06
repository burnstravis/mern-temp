import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage.tsx';
import CardPage from './pages/CardPage.tsx';
import Register from './components/register.tsx';
function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/cards" element={<CardPage />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
  );
}
export default App;