'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface LoginData {
  firstName: string;
  lastName: string;
  email: string;
}

interface OtpData {
  email: string;
  otp: string;
}

type Mode = 'login' | 'verify' | 'loggedIn';

export default function ClientAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loginData, setLoginData] = useState<LoginData>({ firstName: '', lastName: '', email: '' });
  const [otpData, setOtpData] = useState<OtpData>({ email: '', otp: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const clientId = localStorage.getItem('clientId');
    if (clientId) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Step 1: request OTP
      await post('/client/generateOtp', loginData);
      Swal.fire('OTP Sent', 'Check your email for the verification code.', 'success');
      setOtpData(prev => ({ ...prev, email: loginData.email }));
      setMode('verify');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'Error sending OTP';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Step 2: verify OTP and login
      const data = await post('/client/login', { email: otpData.email, otp: otpData.otp });
      const { token, clientId, message } = data;
      if (token && clientId) {
        localStorage.setItem('token', token);
        localStorage.setItem('clientId', clientId);
        Swal.fire('Success', message, 'success').then(() => router.replace('/dashboard'));
      } else {
        Swal.fire('Error', data.message || 'Unexpected response', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'Invalid or expired OTP';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex-col justify-center items-start px-16">
        <h1 className="text-4xl font-extrabold text-emerald-600 mb-2">ShareMitra</h1>
        <p className="text-lg text-gray-700">
          {mode === 'login' && <><strong>Join us!</strong><br />Enter your details to get started.</>}
          {mode === 'verify' && <><strong>Verify Email</strong><br />Enter the OTP sent to your email.</>}
        </p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gradient px-6 py-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            {mode === 'login' ? 'Login' : 'Verify OTP'}
          </h2>

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" type="text" value={loginData.firstName} onChange={handleLoginChange} placeholder="John" required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" type="text" value={loginData.lastName} onChange={handleLoginChange} placeholder="Doe" required className="mt-2" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={loginData.email} onChange={handleLoginChange} placeholder="you@example.com" required className="mt-2" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-pointer hover:from-emerald-700 hover:to-green-700">
                {submitting ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP Code</Label>
                <Input id="otp" name="otp" type="text" value={otpData.otp} onChange={handleOtpChange} placeholder="Enter OTP" required className="mt-2" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-pointer hover:from-emerald-700 hover:to-green-700">
                {submitting ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-500">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
