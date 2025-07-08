'use client';

import { useState } from 'react';
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

enum Step {
    Login = 'login',
    Register = 'register',
    Verify = 'verify',
    Forgot = 'forgot',
    Reset = 'reset',
}

export default function AdminAuthPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(Step.Login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL + 'admin/';

    const handleAction = async () => {
        setSubmitting(true);
        try {
            let endpoint = '';
            let body: Record<string, string> = { email: email.trim() };

            switch (step) {
                case Step.Login:
                    endpoint = 'login';
                    body.password = password;
                    break;
                case Step.Register:
                    endpoint = 'register';
                    break;
                case Step.Verify:
                    endpoint = 'verify-email-otp';
                    body.otp = otp;
                    body.password = password;
                    break;
                case Step.Forgot:
                    endpoint = 'forgot-password';
                    break;
                case Step.Reset:
                    endpoint = 'reset-password';
                    body.otp = otp;
                    body.newPassword = password;
                    break;
            }

            const res = await fetch(apiBase + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error');

            // helper to fire a toast and optionally navigate
            const toast = (opts: { icon: 'success' | 'error'; title: string; text?: string; onClose?: () => void }) =>
                Swal.fire({
                    icon: opts.icon,
                    title: opts.title,
                    text: opts.text,
                    timer: 1500,
                    showConfirmButton: false,
                }).then(() => {
                    if (opts.onClose) opts.onClose();
                });

            switch (step) {
                case Step.Login:
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminId', data.adminId);
                    const decoded = jwtDecode<JwtPayload>(data.token);
                    console.log('Expires at', new Date(decoded.exp * 1000));
                    await toast({ icon: 'success', title: 'Logged in', onClose: () => router.replace('/admin') });
                    break;

                case Step.Register:
                    await toast({
                        icon: 'success',
                        title: 'OTP Sent',
                        text: 'Check email for verification code.',
                        onClose: () => setStep(Step.Verify),
                    });
                    break;

                case Step.Verify:
                    await toast({
                        icon: 'success',
                        title: 'Registration complete!',
                        onClose: () => router.replace('/admin'),
                    });
                    break;

                case Step.Forgot:
                    await toast({
                        icon: 'success',
                        title: 'OTP Sent',
                        text: 'Check email for reset code.',
                        onClose: () => setStep(Step.Reset),
                    });
                    break;

                case Step.Reset:
                    await toast({
                        icon: 'success',
                        title: 'Password reset successful.',
                        onClose: () => setStep(Step.Login),
                    });
                    break;
            }
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'Operation failed',
                timer: 1500,
                showConfirmButton: false,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const renderForm = () => {
        switch (step) {
            case Step.Login:
                return (
                    <>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <Button type="button" onClick={handleAction} disabled={submitting} className="w-full cursor-pointer bg-emerald-600 text-white">
                            {submitting ? 'Logging in…' : 'Login'}
                        </Button>
                    </>
                );
            case Step.Register:
                return (
                    <>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <Button type="button" onClick={handleAction} disabled={submitting} className="w-full cursor-pointer bg-emerald-600 text-white">
                            {submitting ? 'Sending OTP…' : 'Send OTP'}
                        </Button>
                    </>
                );
            case Step.Verify:
                return (
                    <>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={email} readOnly className="mt-2 bg-gray-100" />
                        </div>
                        <div>
                            <Label htmlFor="otp">OTP Code</Label>
                            <Input id="otp" type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2" />
                        </div>
                        <Button type="button" onClick={handleAction} disabled={submitting} className="w-full cursor-pointer bg-emerald-600 text-white">
                            {submitting ? 'Verifying…' : 'Verify & Register'}
                        </Button>
                    </>
                );
            case Step.Forgot:
                return (
                    <>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2" />
                        </div>
                        <Button type="button" onClick={handleAction} disabled={submitting} className="w-full cursor-pointer bg-emerald-600 text-white">
                            {submitting ? 'Sending OTP…' : 'Send Reset OTP'}
                        </Button>
                    </>
                );
            case Step.Reset:    
                return (
                    <>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={email} readOnly className="mt-2 bg-gray-100" />
                        </div>
                        <div>
                            <Label htmlFor="otp">OTP Code</Label>
                            <Input id="otp" type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="mt-2" />
                        </div>
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2" />
                        </div>
                        <Button type="button" onClick={handleAction} disabled={submitting} className="w-full cursor-pointer bg-emerald-600 text-white">
                            {submitting ? 'Resetting…' : 'Reset Password'}
                        </Button>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex-col justify-center px-16 h-screen sticky top-0">
                <h1 className="text-4xl font-extrabold text-emerald-600 mb-2">ShareMitra Admin</h1>
                <p className="text-lg text-gray-700">Secure administration portal</p>
            </div>
            <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-6 py-12">
                <form className="w-full max-w-sm space-y-6 bg-green-50 p-8 rounded-lg shadow">
                    {/* Tab Buttons */}
                    <div className="flex justify-center space-x-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setStep(Step.Login)}
                            className={`py-2 px-4 ${step === Step.Login ? 'border-b-2 border-emerald-600 font-semibold' : 'text-emerald-600 hover:underline cursor-pointer'}`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(Step.Register)}
                            className={`py-2 px-4 ${step === Step.Register ? 'border-b-2 border-emerald-600 font-semibold' : 'text-emerald-600 hover:underline cursor-pointer'}`}
                        >
                            Register
                        </button>
                    </div>

                    <h2 className="text-2xl font-semibold text-gray-800 text-center capitalize">{step.replace('-', ' ')}</h2>

                    {renderForm()}

                    <div className="flex justify-end text-sm">
                        {step !== Step.Forgot && step !== Step.Verify && step !== Step.Reset && (
                            <button
                                type="button"
                                className="text-emerald-600 hover:underline cursor-pointer"
                                onClick={() => setStep(Step.Forgot)}
                            >
                                Forgot Password
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
