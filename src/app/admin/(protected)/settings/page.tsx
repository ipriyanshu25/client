'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Swal from 'sweetalert2';

import api from "@/lib/api";

interface JWTPayload {
  adminId: string;
  email: string;
  iat: number;
  exp: number;
}

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !password) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Changes',
        text: 'Please enter at least one field to update.',
      });
      return;
    }

    if (password && password !== confirmPassword) {
      await Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Passwords do not match.',
      });
      return;
    }

    // Pull adminId from saved JWT
    const token = localStorage.getItem('adminToken');
    if (!token) {
      await Swal.fire({
        icon: 'error',
        title: 'Not Authenticated',
        text: 'Please log in again.',
      });
      return;
    }

    let adminId: string;
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      adminId = decoded.adminId;
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Invalid Token',
        text: 'Please log in again.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/admin/update', {
        adminId,
        newEmail: email || undefined,
        newPassword: password || undefined,
      });

      // if they returned a fresh JWT, store it
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Credentials updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || err.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-lg shadow-xl rounded-2xl">
        <CardHeader className="bg-white border-b">
          <CardTitle className="text-2xl font-semibold text-gray-800 text-center">
            Account Settings
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Update your login credentials below
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="email">New Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {password && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPass">Confirm Password</Label>
                  <Input
                    id="confirmPass"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
            >
              {loading ? "Updating…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
