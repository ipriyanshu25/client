'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '../components/AdminSidebar';   // adjust if needed

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);     // guarding flag
  const [isAuth,  setIsAuth]  = useState(false);      // after the check

  useEffect(() => {
    // SSR safeguard
    const adminId =
      typeof window !== 'undefined' ? localStorage.getItem('adminId') : null;

    const onLoginPage = pathname === '/admin/login';

    /* ---------- Route rules ---------- */
    if (!adminId && !onLoginPage) {
      // unauth → protected page → bounce to login
      router.replace('/admin/login');
      return;
    }

    if (adminId && onLoginPage) {
      // already auth → login page → skip to dashboard
      router.replace('/admin/services');
      return;
    }

    // allowed to stay
    setIsAuth(!!adminId);
    setChecking(false);
  }, [pathname, router]);

  /* While deciding, paint a minimal placeholder */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Redirecting…
      </div>
    );
  }

  /* ---------------- Layout ---------------- */
  const isLoginPage = pathname === '/admin/login';

  // Show sidebar everywhere except the login screen
  if (isLoginPage) {
    return <main className="flex min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      {isAuth && <AdminSidebar />}
      <main className="flex-1 bg-gray-100">{children}</main>
    </div>
  );
}
