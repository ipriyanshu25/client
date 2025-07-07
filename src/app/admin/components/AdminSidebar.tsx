import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, LogOut, Briefcase, FileText, Settings } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/admin/services', label: 'Services', Icon: Briefcase },
  { href: '/admin/client', label: 'Clients', Icon: Users },
  { href: '/admin/campaign', label: 'Campaigns', Icon: Users },
  {
    label: 'Documents',
    Icon: FileText,
    children: [
      { href: '/admin/document/faqs', label: 'FAQs' },
      { href: '/admin/document/terms-of-use', label: 'Terms of Use' },
      { href: '/admin/document/shipping-delivery', label: 'Shipping & Delivery Policy' },
      { href: '/admin/document/privacy-policy', label: 'Privacy Policy' },
      { href: '/admin/document/returns-policy', label: 'Returns Policy' },
      { href: '/admin/document/cookie-policy', label: 'Cookie Policy' },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openDocs, setOpenDocs] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminToken');
    router.replace('/admin/login');
  };

  const toggleDocs = () => setOpenDocs(prev => !prev);

  return (
    <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
      <h2 className="text-2xl font-semibold mb-6">Admin Panel</h2>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ href, label, Icon, children }) => {
          if (!children) {
            return (
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
            );
          }

          return (
            <div key={label}>
              <button
                onClick={toggleDocs}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors',
                  openDocs
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" /> {label}
                </div>
                <span className={clsx('transform transition-transform', openDocs && 'rotate-90')}>&gt;</span>
              </button>
              {openDocs && (
                <div className="ml-6 mt-1 space-y-1">
                  {children.map(({ href: childHref, label: childLabel }) => (
                    <Link
                      key={childHref}
                      href={childHref}
                      className={clsx(
                        'block px-3 py-1 rounded-md transition-colors',
                        pathname === childHref
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      )}
                    >
                      {childLabel}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Settings Button */}
        <Link
          href="/admin/settings"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-md mt-2 transition-colors',
            pathname.startsWith('/admin/settings')
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          )}
        >
          <Settings className="w-5 h-5" /> Settings
        </Link>
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
