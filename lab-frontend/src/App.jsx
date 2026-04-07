import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css'; // تأكد من وجود هذا السطر في الأعلى
import ChercheurDashboard from './pages/ChercheurDashboard';
import ChefEquipeDashboard from './pages/ChefEquipeDashboard';

export default function App() {
  // دالة صغيرة باش نعرفو شكون راه مكونيكتي
  const getDashboard = () => {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    if (!user) return <Navigate to="/login" />;

    if (user.role === 'Chercheur') return <ChercheurDashboard user={user} />;
    if (user.role === 'ChefEquipe') return <ChefEquipeDashboard user={user} />;
    return <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" key={window.location.pathname} element={getDashboard()} />
      </Routes>
    </BrowserRouter>
  );
}