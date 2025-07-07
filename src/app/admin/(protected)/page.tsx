'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');

    if (adminId) {
      router.replace('/admin/services'); // ✅ default landing for admins
    } else {
      router.replace('/admin/login');    // 🔒 bounce to auth if missing
    }

    // show a tiny status until navigation happens
    setChecking(false);
  }, [router]);

  /* While the redirect is firing, show minimal UI */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Redirecting…
      </div>
    );
  }

  /* In the extremely unlikely case replace() fails, render nothing */
  return null;
}
