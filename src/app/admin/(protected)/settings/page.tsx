'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import api from '@/lib/api';

interface JWTPayload {
  adminId: string;
  email: string;
  iat: number;
  exp: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : '';
  let adminId = '';

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    adminId = decoded.adminId;
  } catch {
    // invalid token
  }

  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Password update state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleEmailRequest = async () => {
    if (!newEmail) {
      return Swal.fire('Warning', 'Please enter a valid email address.', 'warning');
    }
    if (!adminId) {
      return Swal.fire('Error', 'Authentication expired. Please log in again.', 'error');
    }
    setLoadingEmail(true);
    try {
      await api.post('/admin/update-email/request', { adminId, newEmail });
      Swal.fire('OTP Sent', 'Check your current email for the OTP.', 'info');
      setEmailStep('verify');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleEmailVerify = async () => {
    if (!emailOtp) {
      return Swal.fire('Warning', 'Please enter the OTP.', 'warning');
    }
    if (!adminId) {
      return Swal.fire('Error', 'Authentication expired. Please log in again.', 'error');
    }
    setLoadingEmail(true);
    try {
      const res = await api.post('/admin/update-email/verify', { adminId, otp: emailOtp });
      if (res.data.token) localStorage.setItem('adminToken', res.data.token);
      Swal.fire('Success', 'Your email has been updated.', 'success');
      setNewEmail('');
      setEmailOtp('');
      setEmailStep('input');
      router.refresh();
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword) {
      return Swal.fire('Warning', 'Both current and new passwords are required.', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return Swal.fire('Error', 'New passwords do not match.', 'error');
    }
    if (!adminId) {
      return Swal.fire('Error', 'Authentication expired. Please log in again.', 'error');
    }
    setLoadingPassword(true);
    try {
      await api.post('/admin/update-password', { adminId, oldPassword, newPassword });
      Swal.fire('Success', 'Your password has been updated.', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your account and security preferences</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Email Update Card */}
          <Card className="shadow-lg border border-gray-200 rounded-2xl">
            <CardHeader className="bg-white border-b px-6 py-4">
              <CardTitle className="text-2xl font-semibold text-gray-800 text-center">
                Update Email
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Change your login email address
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {emailStep === 'input' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="you@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleEmailRequest}
                    disabled={loadingEmail}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    {loadingEmail ? 'Sending OTP…' : 'Send OTP'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email-otp">Enter OTP</Label>
                    <Input
                      id="email-otp"
                      type="text"
                      placeholder="One-time code"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleEmailVerify}
                    disabled={loadingEmail}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    {loadingEmail ? 'Verifying…' : 'Verify & Update'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Password Update Card */}
          <Card className="shadow-lg border border-gray-200 rounded-2xl">
            <CardHeader className="bg-white border-b px-6 py-4">
              <CardTitle className="text-2xl font-semibold text-gray-800 text-center">
                Update Password
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Secure your account by changing your password
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">Current Password</Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              {newPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handlePasswordUpdate}
                disabled={loadingPassword}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                {loadingPassword ? 'Updating…' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
