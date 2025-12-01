import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import BookDetail from './pages/BookDetail.jsx';
import SearchResults from './pages/SearchResults.jsx';
import AuthPage from './pages/Auth.jsx';
import AccountPage from './pages/Account.jsx';
import SubscriptionPage from './pages/Subscription.jsx';

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
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
