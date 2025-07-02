'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Settings, LogOut, Briefcase } from 'lucide-react';
import clsx from 'clsx';


const navItems = [
  { href: '/admin/services', label: 'Services', Icon: Briefcase },
  { href: '/admin/client', label: 'Clients', Icon: Users },
  { href: '/admin/campaign', label: 'Campaigns', Icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminToken');
    router.replace('/admin/login');
  };

  return (
    <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
      <h2 className="text-2xl font-semibold mb-6">Admin Panel</h2>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            )}
          >
            <Icon className="w-5 h-5" /> {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-6 flex items-center gap-3 text-red-600 hover:text-red-800"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </aside>
  );
}
