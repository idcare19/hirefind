import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavbarTop() {
  const { user, profile, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          HireFind <h5 className="text-muted" >by IDCARE19</h5><h6></h6>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div id="nav" className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto gap-2">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>

            {profile?.role === "candidate" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/candidate">
                  Dashboard
                </NavLink>
              </li>
            )}
            {profile?.role === "company" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/company">
                  Company
                </NavLink>
              </li>
            )}
            {profile?.role === "admin" && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">
                  Admin
                </NavLink>
              </li>
            )}

            {!user ? (
              <li className="nav-item">
                <NavLink className="btn btn-primary btn-sm" to="/login">
                  Login
                </NavLink>
              </li>
            ) : (
              <li className="nav-item d-flex align-items-center gap-2">
                <span className="small text-muted">{profile?.role}</span>
                <button className="btn btn-outline-dark btn-sm" onClick={logout}>
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}