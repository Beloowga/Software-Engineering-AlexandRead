import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import BookDetail from './pages/BookDetail.jsx';
import SearchResults from './pages/SearchResults.jsx';
import AuthPage from './pages/Auth.jsx';
import AccountPage from './pages/Account.jsx';
import SubscriptionPage from './pages/Subscription.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ActivityPage from './pages/Activity.jsx';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
