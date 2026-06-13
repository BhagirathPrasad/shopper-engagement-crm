import { Link, useLocation } from 'react-router-dom';
import { Users, ShoppingCart, LayoutDashboard, Megaphone, BarChart } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Analytics', path: '/analytics', icon: BarChart },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 text-2xl font-bold tracking-wider text-indigo-400">Xeno AI</div>
      <nav className="flex-1 mt-6">
        <ul>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <li key={link.name} className="px-4 py-2">
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-sm text-slate-500">Xeno AI-Native CRM v1.0</div>
      </div>
    </div>
  );
};

export default Sidebar;
