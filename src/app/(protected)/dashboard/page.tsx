'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, LogOut, Plus } from 'lucide-react';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

interface ClientProfile {
  name: { firstName: string; lastName: string };
  email: string;
}

interface CampaignAction {
  contentId: string;
  contentKey: string;
  quantity: number;
  totalCost: number;
}

interface Campaign {
  campaignId: string;
  serviceHeading: string;
  link: string;
  actions: CampaignAction[];
  totalAmount: number;
  createdAt: string;
}

// helper for auto-close toasts
const toast = (opts: SweetAlertOptions) =>
  Swal.fire({ ...opts, showConfirmButton: false, timer: 2000, timerProgressBar: true });

export default function Dashboard() {
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile>({ name: { firstName: '', lastName: '' }, email: '' });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showEmailOtpForm, setShowEmailOtpForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        const [profileRes, campaignRes] = await Promise.all([
          api.post<ClientProfile>('/client/getById', { clientId }, { headers: { Authorization: `Bearer ${token}` } }),
          api.post<{ campaigns: Campaign[] }>('/campaign/getByClient', { clientId }, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setClient(profileRes.data);
        setNewEmail(profileRes.data.email);
        setCampaigns(campaignRes.data.campaigns || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('clientId');
    router.push('/login');
  };

  const fullName = client.name.firstName ? `${client.name.firstName} ${client.name.lastName}` : '';
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN');

  const handleDelete = async (campaignId: string) => {
    const result = await Swal.fire({
      title: 'Delete Campaign?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      await api.post('/campaign/delete', { campaignId }, { headers: { Authorization: `Bearer ${token}` } });
      setCampaigns(prev => prev.filter(c => c.campaignId !== campaignId));
      toast({ title: 'Deleted!', text: 'Campaign removed.', icon: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', text: err.response?.data?.message || 'Delete failed.', icon: 'error' });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingOtp(true);
    try {
      const token = localStorage.getItem('token');
      const clientId = localStorage.getItem('clientId');
      await api.post('/client/generateEmailOtp', { clientId, newEmail }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'OTP Sent', text: 'Check your new email for the OTP.', icon: 'info' });
      setShowEmailOtpForm(true);
    } catch (err: any) {
      toast({ title: 'Error', text: err.response?.data?.message || 'Failed to send OTP.', icon: 'error' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const clientId = localStorage.getItem('clientId');
      const res = await api.post<{ email: string }>('/client/verifyEmailOtp', { clientId, otp: emailOtp }, { headers: { Authorization: `Bearer ${token}` } });
      setClient(prev => ({ ...prev, email: res.data.email }));
      toast({ title: 'Success', text: 'Email updated successfully.', icon: 'success' });
      setShowEmailForm(false);
      setShowEmailOtpForm(false);
    } catch (err: any) {
      toast({ title: 'Error', text: err.response?.data?.message || 'OTP verification failed.', icon: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
              ShareMitra
            </span>
          </Link>
          <div className="flex items-center space-x-4 ">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 cursor-pointer bg-white hover:bg-gray-100">
                  <User className="w-5 h-5" /> {fullName || 'Profile'}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white flex flex-col">
                <SheetHeader className="p-4">
                  <SheetTitle>Profile</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div>
                    <Label className="mb-2">Name</Label>
                    <Input disabled value={fullName} className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="mb-2">Email</Label>
                    <Input disabled value={client.email} className="bg-gray-50" />
                  </div>
                  {!showEmailForm ? (
                    <Button onClick={() => setShowEmailForm(true)} className="w-full bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700">
                      Update Email
                    </Button>
                  ) : !showEmailOtpForm ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div>
                        <Label className="mb-2">New Email</Label>
                        <Input
                          type="email"
                          required
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={isSendingOtp}
                          className="flex-1 bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isSendingOtp ? 'Sending…' : 'Send OTP'}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-red-600 text-white flex items-center cursor-pointer hover:bg-red-700"
                          onClick={() => {
                            setShowEmailForm(false);
                            setEmailOtp('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleEmailOtpSubmit} className="space-y-4">
                      <div>
                        <Label className="mb-2">Enter OTP</Label>
                        <Input type="text" required value={emailOtp} onChange={e => setEmailOtp(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700">
                          Verify OTP
                        </Button>
                        <Button variant="outline" className="flex-1 bg-red-600 text-white flex items-center cursor-pointer hover:bg-red-700" onClick={() => { setShowEmailForm(false); setEmailOtp(''); setShowEmailOtpForm(false); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
                <SheetFooter className="p-4">
                  <Button variant="destructive" onClick={logout} className="w-full bg-red-600 text-white flex items-center justify-center cursor-pointer hover:bg-red-700">
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Button variant="destructive" onClick={logout} className="flex items-center gap-2 bg-red-600 text-white cursor-pointer hover:bg-red-700">
              <LogOut className="w-5 h-5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900">Welcome Back, {fullName || 'User'}!</h1>
          <p className="text-gray-600 mt-2">Manage your social media campaigns and track your growth.</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Campaigns</h2>
          <Link href="/dashboard/addCampaign">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 transition cursor-pointer">
              <Plus className="w-5 h-5" /> New Campaign
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-center text-gray-500">No campaigns yet — create one!</p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map(c => (
              <motion.div key={c.campaignId} whileHover={{ scale: 1.02 }}>
                <Card className="bg-white shadow hover:shadow-lg transition">
                  <CardContent>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium">{c.serviceHeading}</h3>
                    </div>
                    <p className="truncate mb-4">
                      <span className="font-semibold">Link:</span>{' '}
                      <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {c.link}
                      </a>
                    </p>
                    <table className="w-full mb-4 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-2 py-1">Services</th>
                          <th className="px-2 py-1">Quantity</th>
                          <th className="px-2 py-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.actions.map(action => (
                          <tr key={action.contentId} className="border-t">
                            <td className="px-2 py-1">{action.contentKey}</td>
                            <td className="px-2 py-1">{action.quantity}</td>
                            <td className="px-2 py-1 font-semibold">${action.totalCost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end items-center mb-1">
                      <span className="text-sm font-semibold">Total: ${c.totalAmount}</span>
                    </div>
                    <p className="text-xs text-black-400">Created on {formatDate(c.createdAt)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
      <footer className="bg-gray-900 text-white pb-8 mt-auto fixed bottom-0 w-full">
        <div className="container mx-auto px-4">
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>

  );
}
