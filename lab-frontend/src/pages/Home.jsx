import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const navigate = useNavigate();
  const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

  return (
    <div style={{ background: "#030712", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ height: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center" }}>
        <div style={{ maxWidth: "700px", padding: "20px" }}>
          <h1 className="fw-bold mb-3 text-white" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>Elevate Your Research</h1>
          <p style={{ color: "#d1d5db", marginBottom: "30px", fontSize: "1.1rem" }}>Secure & Professional Lab Workspace.</p>
          
          {!loggedUser ? (
            <button  
              onClick={() => navigate('/register')} 
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", border: "none", padding: "14px 40px", borderRadius: "14px", fontWeight: "bold", color: "white", cursor: "pointer" }}>
              Get Started
            </button>
          ) : (
            <button 
              onClick={() => { localStorage.removeItem("loggedUser"); window.location.reload(); }} 
              style={{ background: "#ff4d4d", border: "none", padding: "14px 40px", borderRadius: "14px", fontWeight: "bold", color: "white", cursor: "pointer" }}>
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}