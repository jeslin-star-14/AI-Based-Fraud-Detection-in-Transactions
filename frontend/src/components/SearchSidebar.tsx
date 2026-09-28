import { Search, Filter, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { mockTransactions } from '../data/mockData';
import { Transaction } from '../types';

interface SearchSidebarProps {
  onSelectTransaction: (id: string) => void;
  selectedId?: string;
}

const SearchSidebar = ({ onSelectTransaction, selectedId }: SearchSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('322');
  
  // Use mock transaction data
  const transactions: Transaction[] = mockTransactions;

  const getRiskColor = (score: number) => {
    if (score >= 900) return 'text-green-600';
    if (score >= 700) return 'text-yellow-600';
    if (score >= 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 900) return 'bg-green-50 border-green-200';
    if (score >= 700) return 'bg-yellow-50 border-yellow-200';
    if (score >= 500) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Search Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-xs text-gray-500 uppercase font-medium">
          34 Search Results Found
        </div>
      </div>

      {/* Pagination */}
      <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                page === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            onClick={() => onSelectTransaction(transaction.id)}
            className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
              selectedId === transaction.id
                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-mono">
                    {transaction.id}
                  </span>
                  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${getRiskBgColor(transaction.riskScore)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getRiskColor(transaction.riskScore).replace('text-', 'bg-')}`}></div>
                    <span className={`text-xs font-bold ${getRiskColor(transaction.riskScore)}`}>
                      {transaction.riskScore}
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mt-1">
                  {transaction.customerName}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{transaction.location}</span>
              <span>•</span>
              <span>{transaction.date}</span>
            </div>
            
            <div className="mt-2 text-sm font-bold text-gray-900">
              ${transaction.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchSidebar;
