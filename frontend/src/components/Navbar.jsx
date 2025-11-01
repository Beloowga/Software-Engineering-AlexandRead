import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__content">
        <Link to="/" className="brand">
          📚 AlexandRead
        </Link>
        <nav className="navbar__links">
          <Link to="/">Catalogue</Link>
          {/* plus tard: <Link to="/profile">Mon compte</Link> */}
        </nav>
      </div>
    </header>
  );
}
