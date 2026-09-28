import { Shield, Bell, Settings, User, Search, BarChart3, AlertTriangle, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">FraudGuard</span>
                <span className="text-xs text-gray-500">AI Detection System</span>
              </div>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/" icon={<Search className="w-4 h-4" />} label="Transactions" />
              <NavLink to="/dashboard" icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" />
              <NavLink to="/alerts" icon={<AlertTriangle className="w-4 h-4" />} label="Alerts" active />
              <NavLink to="/reports" icon={<FileText className="w-4 h-4" />} label="Reports" />
              <NavLink to="/team" icon={<Users className="w-4 h-4" />} label="Team" />
            </div>
          </div>

          {/* Right: Actions and Profile */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200"></div>

            {/* User Profile */}
            <button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-gray-900">Sarah Chen</div>
                <div className="text-xs text-gray-500">Fraud Analyst</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavLink = ({ to, icon, label, active }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default Navbar;
