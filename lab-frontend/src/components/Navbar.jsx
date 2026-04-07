import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ background: "#030712" }}>
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4" to="/">Lab Management</Link>
        <div className="ms-auto">
          <ul className="navbar-nav d-flex flex-row gap-3">
            <li className="nav-item"><Link className="nav-link text-white small fw-bold" to="/">Home</Link></li>
            <li className="nav-item"><Link className="nav-link text-white small fw-bold" to="/login">Login</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/register" style={{ color: "#6366f1", fontWeight: 900 }}>Register</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}