import { useState } from 'react';
import Navbar from '../components/Navbar';
import SearchSidebar from '../components/SearchSidebar';
import TransactionDetail from '../components/TransactionDetail';

const TransactionDetailPage = () => {
  const [selectedTransaction, setSelectedTransaction] = useState('#3G327H');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <SearchSidebar 
          onSelectTransaction={setSelectedTransaction}
          selectedId={selectedTransaction}
        />
        <TransactionDetail />
      </div>
    </div>
  );
};

export default TransactionDetailPage;
