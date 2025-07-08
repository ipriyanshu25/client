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
  const token = localStorage.getItem('adminToken') || '';
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

  // Request OTP for email change
  const handleEmailRequest = async () => {
    if (!newEmail) {
      await Swal.fire('Error', 'Please enter a new email.', 'warning');
      return;
    }
    if (!adminId) {
      await Swal.fire('Error', 'Not authenticated. Please log in again.', 'error');
      return;
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

  // Verify OTP and update email
  const handleEmailVerify = async () => {
    if (!emailOtp) {
      await Swal.fire('Error', 'Please enter the OTP.', 'warning');
      return;
    }
    if (!adminId) {
      await Swal.fire('Error', 'Not authenticated. Please log in again.', 'error');
      return;
    }
    setLoadingEmail(true);
    try {
      const res = await api.post('/admin/update-email/verify', { adminId, otp: emailOtp });
      if (res.data.token) {
        localStorage.setItem('adminToken', res.data.token);
      }
      Swal.fire('Success', 'Email updated successfully.', 'success');
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

  // Update password flow
  const handlePasswordUpdate = async () => {
    if (!oldPassword || !newPassword) {
      await Swal.fire('Error', 'Please fill in both passwords.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      await Swal.fire('Error', 'New passwords do not match.', 'error');
      return;
    }
    if (!adminId) {
      await Swal.fire('Error', 'Not authenticated. Please log in again.', 'error');
      return;
    }
    setLoadingPassword(true);
    try {
      await api.post('/admin/update-password', { adminId, oldPassword, newPassword });
      Swal.fire('Success', 'Password updated successfully.', 'success');
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
    <div className="min-h-screen flex items-center justify-center bg-green-100 p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* Email Update Card */}
        <Card className="shadow-xl rounded-2xl">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 text-center">
              Update Email
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Change your login email
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
                  className="w-full py-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                >
                  {loadingEmail ? 'Sending OTP…' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email-otp">OTP</Label>
                  <Input
                    id="email-otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleEmailVerify}
                  disabled={loadingEmail}
                  className="w-full py-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                >
                  {loadingEmail ? 'Verifying…' : 'Verify & Update'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Password Update Card */}
        <Card className="shadow-xl rounded-2xl">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 text-center">
              Update Password
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Change your account password
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
              className="w-full py-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
            >
              {loadingPassword ? 'Updating…' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
