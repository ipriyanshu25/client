'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

type JwtPayload = {
    adminId: string;
    email: string;
    exp: number;
};

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const adminId = localStorage.getItem('adminId');

        if (adminId) {
            router.replace('/admin/services'); // ✅ default landing for admins
        } else {
            router.replace('/admin/login');    // 🔒 bounce to auth if missing
        }

    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            Swal.fire('Error', 'Please enter both email and password.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}admin/login`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',               // ← allow cookie use if you switch to http-only cookies later
                    body: JSON.stringify({ email, password }),
                },
            );

            if (!res.ok) {
                const { message } = await res.json();
                throw new Error(message || 'Login failed');
            }

            const { token, adminId } = await res.json(); // see backend change below
            /* ---------- Persist session ---------- */
            localStorage.setItem('adminToken', token);   // or use cookies / react-query
            localStorage.setItem('adminId', adminId);
            /* ---------- Optional: decode for quick client checks ---------- */
            const decoded = jwtDecode<JwtPayload>(token);
            console.log('token expires at', new Date(decoded.exp * 1000));

            Swal.fire('Success', 'Logged in', 'success');
            router.replace('/admin');
        } catch (err: any) {
            Swal.fire('Error', err.message || 'Login failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------------------------------- UI ---------------------------------- */
    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex-col justify-center px-16 h-screen sticky top-0">
                <h1 className="text-4xl font-extrabold text-emerald-600 mb-2">
                    ShareMitra Admin
                </h1>
                <p className="text-lg text-gray-700">Secure administration portal</p>
            </div>

            {/* Login Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-6 py-12">
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 bg-green-50 p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 text-center">
                        Admin Login
                    </h2>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                    >
                        {submitting ? 'Logging in…' : 'Login'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
