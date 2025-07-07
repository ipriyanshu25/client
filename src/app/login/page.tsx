// ClientAuthPage.tsx
'use client';

import React, { useEffect, useRef, useState, FormEvent, JSX } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import { post } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
interface LoginData {
  email: string;
  password: string;
}
interface OtpData {
  email: string;
  otp: string;
}
interface ResetCollectData {
  email: string;
}
interface ResetVerifyData {
  email: string;
  otp: string;
  newPassword: string;
}

type AuthType = 'register' | 'login' | 'reset';
type Mode     = 'collect'  | 'verify';

export default function ClientAuthPage(): JSX.Element {
  const router       = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [authType, setAuthType]       = useState<AuthType>('register');
  const [mode, setMode]               = useState<Mode>('collect');
  const [submitting, setSubmitting]   = useState<boolean>(false);

  const [registerData, setRegisterData] = useState<RegisterData>({
    firstName: '', lastName: '', email: '', password: '',
  });
  const [loginData, setLoginData]     = useState<LoginData>({ email: '', password: '' });
  const [otpData, setOtpData]         = useState<OtpData>({ email: '', otp: '' });
  const [resetCollect, setResetCollect] = useState<ResetCollectData>({ email: '' });
  const [resetVerify, setResetVerify]   = useState<ResetVerifyData>({
    email: '', otp: '', newPassword: '',
  });

  useEffect(() => {
    if (localStorage.getItem('clientId')) {
      router.replace('/dashboard');
    }
  }, [router]);

  // ─── REGISTER ────────────────────────────────────────────────────────────

  const handleRegisterCollect = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const captchaToken = await recaptchaRef.current?.executeAsync();
      recaptchaRef.current?.reset();
      await post('/client/generateOtp', { ...registerData, captchaToken });
      Swal.fire({ icon:'success', title:'OTP Sent', text:'Check your email for the code.', timer:2000, showConfirmButton:false });
      setOtpData({ email: registerData.email, otp: '' });
      setMode('verify');
    } catch (err: any) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || err.message, timer:2000, showConfirmButton:false });
    } finally { setSubmitting(false); }
  };

  const handleRegisterVerify = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const { email, otp } = otpData;
      const { password }   = registerData;
      const data = await post<{ token:string; clientId:string; message:string }>(
        '/client/register', { email, otp, password }
      );
      localStorage.setItem('token', data.token);
      localStorage.setItem('clientId', data.clientId);
      Swal.fire({ icon:'success', title:'Registered', text:data.message, timer:2000, showConfirmButton:false })
        .then(() => router.replace('/dashboard'));
    } catch (err: any) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || err.message, timer:2000, showConfirmButton:false });
    } finally { setSubmitting(false); }
  };

  // ─── LOGIN ───────────────────────────────────────────────────────────────

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const data = await post<{ token:string; clientId:string; message:string }>(
        '/client/login', loginData
      );
      localStorage.setItem('token', data.token);
      localStorage.setItem('clientId', data.clientId);
      Swal.fire({ icon:'success', title:'Logged In', text:data.message, timer:2000, showConfirmButton:false })
        .then(() => router.replace('/dashboard'));
    } catch (err: any) {
      Swal.fire({ icon:'error', title:'Login Failed', text: err.response?.data?.message || err.message, timer:2000, showConfirmButton:false });
    } finally { setSubmitting(false); }
  };

  // ─── RESET PASSWORD ─────────────────────────────────────────────────────

  const handleResetCollect = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await post('/client/generateResetOtp', resetCollect);
      Swal.fire({ icon:'success', title:'OTP Sent', text:'Check your email for the reset code.', timer:2000, showConfirmButton:false });
      setResetVerify({ email: resetCollect.email, otp:'', newPassword:'' });
      setMode('verify');
    } catch (err: any) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || err.message, timer:2000, showConfirmButton:false });
    } finally { setSubmitting(false); }
  };

  const handleResetVerify = async (e: FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await post('/client/verifyResetOtp', {
        email: resetVerify.email,
        otp: resetVerify.otp,
        newPassword: resetVerify.newPassword,
      });
      Swal.fire({ icon:'success', title:'Password Updated', text:'You can now log in.', timer:2000, showConfirmButton:false })
        .then(() => { setAuthType('login'); setMode('collect'); });
    } catch (err: any) {
      Swal.fire({ icon:'error', title:'Error', text: err.response?.data?.message || err.message, timer:2000, showConfirmButton:false });
    } finally { setSubmitting(false); }
  };

  // ─── HANDLERS ───────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (authType === 'register') {
      setRegisterData(prev => ({ ...prev, [name]: value }));
    } else {
      setLoginData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (mode === 'collect') {
      setResetCollect(prev => ({ ...prev, [name]: value }));
    } else {
      setResetVerify(prev => ({ ...prev, [name]: value }));
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex relative">
      {/* logo/top-right */}
      <div className="absolute top-4 right-4">
        <Link href="/" className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src="/logo.png" alt="ShareMitra" className="w-full h-full object-cover" />
          </div>
          <span className="ml-2 text-lg font-bold text-emerald-600">ShareMitra</span>
        </Link>
      </div>

      {/* left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex-col justify-center px-16">
        <h1 className="text-4xl font-extrabold text-emerald-600 mb-2">ShareMitra</h1>
        <p className="text-lg text-gray-700">
          {mode === 'collect' && authType === 'register' && (
            <><strong>Join us!</strong><br/>Enter details to register.</>
          )}
          {mode === 'collect' && authType === 'login' && (
            <><strong>Welcome Back!</strong><br/>Enter credentials to login.</>
          )}
          {mode === 'collect' && authType === 'reset' && (
            <><strong>Reset Password</strong><br/>Enter your email for an OTP.</>
          )}
          {mode === 'verify' && authType === 'register' && (
            <><strong>Verify Email</strong><br/>Enter the OTP and set a password.</>
          )}
          {mode === 'verify' && authType === 'reset' && (
            <><strong>Update Password</strong><br/>Enter the OTP and your new password.</>
          )}
        </p>
      </div>

      {/* right form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gradient px-6 py-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-md">
          {/* tabs */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => { setAuthType('login'); setMode('collect'); }}
              className={`${authType==='login'?'border-b-2 border-emerald-600 text-emerald-600':'text-gray-500'} pb-2`}
            >Login</button>
            <button
              onClick={() => { setAuthType('register'); setMode('collect'); }}
              className={`${authType==='register'?'border-b-2 border-emerald-600 text-emerald-600':'text-gray-500'} pb-2`}
            >Register</button>
          </div>

          {/* ─── LOGIN ───────────────────────── */}
          {authType === 'login' && mode === 'collect' && (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email"
                         value={loginData.email} onChange={handleInputChange}
                         required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password"
                         value={loginData.password} onChange={handleInputChange}
                         required className="mt-2" />
                </div>
                <Button type="submit" disabled={submitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                  {submitting ? 'Logging in...' : 'Login'}
                </Button>
              </form>
              <p className="text-sm text-center mt-2">
                <button
                  type="button"
                  onClick={() => { setAuthType('reset'); setMode('collect'); }}
                  className="text-emerald-600 hover:underline"
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}

          {/* ─── REGISTER: COLLECT ────────────── */}
          {authType === 'register' && mode === 'collect' && (
            <form onSubmit={handleRegisterCollect} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" type="text"
                         value={registerData.firstName} onChange={handleInputChange}
                         required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" type="text"
                         value={registerData.lastName} onChange={handleInputChange}
                         required className="mt-2" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email"
                       value={registerData.email} onChange={handleInputChange}
                       required className="mt-2" />
              </div>
              <ReCAPTCHA sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                         size="invisible" ref={recaptchaRef} />
              <Button type="submit" disabled={submitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                {submitting ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* ─── REGISTER: VERIFY ─────────────── */}
          {authType === 'register' && mode === 'verify' && (
            <form onSubmit={handleRegisterVerify} className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP Code</Label>
                <Input id="otp" name="otp" type="text"
                       value={otpData.otp} onChange={e => setOtpData(p => ({ ...p, otp: e.target.value }))}
                       required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="password">Set Password</Label>
                <Input id="password" name="password" type="password"
                       value={registerData.password} onChange={handleInputChange}
                       required className="mt-2" />
              </div>
              <Button type="submit" disabled={submitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                {submitting ? 'Registering...' : 'Verify & Register'}
              </Button>
            </form>
          )}

          {/* ─── RESET: COLLECT ───────────────── */}
          {authType === 'reset' && mode === 'collect' && (
            <form onSubmit={handleResetCollect} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email"
                       value={resetCollect.email} onChange={handleResetChange}
                       required className="mt-2" />
              </div>
              <Button type="submit" disabled={submitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                {submitting ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {/* ─── RESET: VERIFY ────────────────── */}
          {authType === 'reset' && mode === 'verify' && (
            <form onSubmit={handleResetVerify} className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP Code</Label>
                <Input id="otp" name="otp" type="text"
                       value={resetVerify.otp} onChange={e => setResetVerify(p => ({ ...p, otp: e.target.value }))}
                       required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password"
                       value={resetVerify.newPassword} onChange={e => setResetVerify(p => ({ ...p, newPassword: e.target.value }))}
                       required className="mt-2" />
              </div>
              <Button type="submit" disabled={submitting}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                {submitting ? 'Updating...' : 'Reset Password'}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
