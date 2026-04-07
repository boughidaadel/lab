import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: 'Connexion en cours...' });

    try {
      const res = await fetch("http://localhost/lab_management/lab-backend/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      // نتحققو إذا الـ Response رجعت قبل ما نقرأو الـ JSON
      if (!res.ok) {
        const errorData = await res.json();
        setFeedback({ type: 'error', msg: errorData.error || "Erreur" });
        return;
      }

      const result = await res.json();

      if (result.success) {
        localStorage.setItem("loggedUser", JSON.stringify(result.user));
        setFeedback({ type: 'success', msg: 'Login successful ✅' });

        // جرب هادي مباشرة بلا setTimeout
        window.location.replace("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: "Erreur serveur ou réseau" });
    }
  };

  return (
    <div style={{ background: "#030712", minHeight: "100vh" }}>
      <Navbar />
      <div className="wrapper">

        <form
          onSubmit={handleLogin}
          className="card-glass shadow-lg"
          // We add specific padding here to make the Login form taller, matching the original design
          style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", padding: "35px 40px" }}
        >
          <h2 className="text-center mb-4 fw-bold text-white">Login</h2>

          {feedback.msg && (
            <div className={feedback.type === 'success' ? 'success-msg' : 'error-msg'}>
              {feedback.msg}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: "12px", padding: "12px 15px" }} // Added specific margin and padding
          />
          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: "12px", padding: "12px 15px" }} // Added specific margin and padding
          />

          <button type="submit" className="btn-grad" style={{ marginTop: "10px", padding: "15px" }}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}