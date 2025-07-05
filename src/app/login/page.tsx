'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
}

interface LoginData {
  email: string;
}

interface OtpData {
  email: string;
  otp: string;
}

type AuthType = 'register' | 'login';
type Mode = 'collect' | 'verify';

export default function ClientAuthPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [authType, setAuthType] = useState<AuthType>('register');
  const [mode, setMode] = useState<Mode>('collect');
  const [submitting, setSubmitting] = useState(false);

  const [registerData, setRegisterData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loginData, setLoginData] = useState<LoginData>({ email: '' });
  const [otpData, setOtpData] = useState<OtpData>({ email: '', otp: '' });

  // Redirect if already logged in
  useEffect(() => {
    const clientId = localStorage.getItem('clientId');
    if (clientId) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ email: e.target.value });
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpData(prev => ({ ...prev, otp: e.target.value }));
  };

  // 1️⃣ Collect step: send OTP
  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const captchaToken = await recaptchaRef.current?.executeAsync();
      recaptchaRef.current?.reset();

      const payload =
        authType === 'register'
          ? { ...registerData, captchaToken }
          : { email: loginData.email, captchaToken };

      const url =
        authType === 'register'
          ? '/client/generateOtp'
          : '/client/generateLoginOtp';

      await post(url, payload);

      Swal.fire({
        title: 'OTP Sent',
        text:
          authType === 'register'
            ? 'Check your email for the verification code to complete registration.'
            : 'Check your email for the verification code to login.',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
      });

      setOtpData({ email: payload.email, otp: '' });
      setMode('verify');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'Error sending OTP';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 2️⃣ Verify step: check OTP and finish auth
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint =
        authType === 'register' ? '/client/register' : '/client/verifyLoginOtp';
      const data = await post(endpoint, {
        email: otpData.email,
        otp: otpData.otp,
      });

      const { token, clientId, message } = data;
      if (token && clientId) {
        localStorage.setItem('token', token);
        localStorage.setItem('clientId', clientId);
        Swal.fire({
          title: 'Success',
          text: message,
          icon: 'success',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          router.replace('/dashboard');
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: data.message || 'Unexpected response',
          icon: 'error',
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ?? err.message ?? 'Invalid or expired OTP';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Logo + Home link in top-right */}
      <div className="absolute top-4 right-4">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="ShareMitra Logo" width={32} height={32} />
          <span className="ml-2 text-lg font-bold text-emerald-600">
            ShareMitra
          </span>
        </Link>
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex-col justify-center items-start px-16">
        <h1 className="text-4xl font-extrabold text-emerald-600 mb-2">
          ShareMitra
        </h1>
        <p className="text-lg text-gray-700">
          {mode === 'collect' && authType === 'register' && (
            <>
              <strong>Join us!</strong>
              <br />
              Enter your details to register.
            </>
          )}
          {mode === 'collect' && authType === 'login' && (
            <>
              <strong>Welcome Back!</strong>
              <br />
              Enter your email to login.
            </>
          )}
          {mode === 'verify' && (
            <>
              <strong>Verify Email</strong>
              <br />
              Enter the OTP sent to your email.
            </>
          )}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gradient px-6 py-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            {mode === 'collect'
              ? authType === 'register'
                ? 'Register'
                : 'Login'
              : 'Verify OTP'}
          </h2>

          {mode === 'collect' && (
            <form onSubmit={handleCollectSubmit} className="space-y-4">
              {authType === 'register' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={registerData.firstName}
                        onChange={handleRegisterChange}
                        placeholder="John"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={registerData.lastName}
                        onChange={handleRegisterChange}
                        placeholder="Doe"
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="you@example.com"
                      required
                      className="mt-2"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="you@example.com"
                    required
                    className="mt-2"
                  />
                </div>
              )}

              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                size="invisible"
                ref={recaptchaRef}
              />

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
              >
                {submitting ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  placeholder="Enter OTP"
                  required
                  className="mt-2"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
              >
                {submitting ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </form>
          )}

          {/* Removed the Back to home link */}
          <div className="mt-4 text-center space-y-2">
            {mode === 'collect' &&
              (authType === 'register' ? (
                <p className="text-sm">
                  Already have an account?
                  <button
                    onClick={() => {
                      setAuthType('login');
                      setRegisterData({ firstName: '', lastName: '', email: '' });
                    }}
                    className="ml-1 text-emerald-600 hover:text-emerald-500"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p className="text-sm">
                  Don’t have an account?
                  <button
                    onClick={() => {
                      setAuthType('register');
                      setLoginData({ email: '' });
                    }}
                    className="ml-1 text-emerald-600 hover:text-emerald-500"
                  >
                    Register
                  </button>
                </p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
