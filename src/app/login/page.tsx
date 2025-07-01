'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setRegisterData((prev) => ({ ...prev, agreeToTerms: checked }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data: any;
      if (mode === 'login') {
        data = await post('/client/login', {
          email: loginData.email,
          password: loginData.password,
        });
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (data.clientId) {
            localStorage.setItem('clientId', data.clientId);
          }
        }
      } else {
        if (registerData.password !== registerData.confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
        data = await post('/client/register', {
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          password: registerData.password,
          confirmPassword: registerData.confirmPassword,
        });
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (data.clientId) {
            localStorage.setItem('clientId', data.clientId);
          }
        }
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Toggle */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img src="/logo.png" alt="ShareMitra Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              ShareMitra
            </span>
          </Link>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => setMode('login')}
              className={`px-4 py-2 font-medium ${
                mode === 'login'
                  ? 'text-emerald-700 underline'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`px-4 py-2 font-medium ${
                mode === 'register'
                  ? 'text-emerald-700 underline'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {mode === 'login'
                ? 'Sign in to your ShareMitra account'
                : 'Join ShareMitra and start boosting your social media'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'login' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="Enter your email"
                      className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={handleLoginChange}
                        placeholder="Enter your password"
                        className="h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">
                      Forgot password?
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={registerData.firstName}
                          onChange={handleRegisterChange}
                          placeholder="John"
                          className="h-12 pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={registerData.lastName}
                          onChange={handleRegisterChange}
                          placeholder="Doe"
                          className="h-12 pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        placeholder="john@example.com"
                        className="h-12 pl-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        placeholder="Create a strong password"
                        className="h-12 pl-10 pr-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="Confirm your password"
                        className="h-12 pl-10 pr-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500" required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="agreeToTerms"
                      checked={registerData.agreeToTerms}
                      onCheckedChange={handleCheckboxChange}
                      className="mt-1"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-600 leading-relaxed">
                      I agree to the{' '}<Link href="/terms" className="text-emerald-600 hover:text-emerald-500">Terms of Service</Link>{' '}and{' '}<Link href="/privacy" className="text-emerald-600 hover:text-emerald-500">Privacy Policy</Link>
                    </label>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  loading ||
                  (mode === 'register' && !registerData.agreeToTerms)
                }
              >
                {loading
                  ? mode === 'login'
                    ? 'Signing In...'
                    : 'Creating...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </Button>
            </form>

            {mode === 'login' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                    onClick={() => setMode('register')}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            )}
            {mode === 'register' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                    onClick={() => setMode('login')}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
