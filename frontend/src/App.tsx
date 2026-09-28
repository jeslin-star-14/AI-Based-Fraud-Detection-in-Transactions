import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransactionDetailPage from './pages/TransactionDetailPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TransactionDetailPage />} />
        <Route path="/transaction/:id" element={<TransactionDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
