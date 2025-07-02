'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, LogOut, Plus, Trash } from 'lucide-react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

interface ClientProfile {
  name: { firstName: string; lastName: string };
  email: string;
}

interface CampaignAction {
  _id: string;
  actionType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface Campaign {
  _id: string;
  campaignId: string;
  serviceHeading: string;
  link: string;
  actions: CampaignAction[];
  totalAmount: number;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile>({ name: { firstName: '', lastName: '' }, email: '' });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

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
          api.post('/campaign/getByClient', { clientId }, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setClient(profileRes.data);
        setCampaigns((campaignRes.data as any).campaigns || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCampaigns(false);
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

  const handleDeleteCampaign = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Campaign?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        await api.post(
          '/campaign/delete',
          { campaignId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCampaigns(prev => prev.filter(c => c._id !== id));
        Swal.fire('Deleted!', 'Your campaign has been deleted.', 'success');
      } catch (err: any) {
        Swal.fire('Error', err?.response?.data?.message || 'Failed to delete campaign.', 'error');
      }
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-400 text-amber-800',
    completed: 'bg-emerald-500 text-emerald-900',
    failed: 'bg-rose-400 text-rose-900',
    processing: 'bg-blue-400 text-blue-900',
  };

  const submitPasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) {
      Swal.fire('Error', 'Not authenticated.', 'error');
      return;
    }
    if (!passwords.oldPassword || !passwords.newPassword) {
      Swal.fire('Error', 'Enter both passwords.', 'error');
      return;
    }
    try {
      await api.post(
        '/client/updatePassword',
        { clientId, oldPassword: passwords.oldPassword, newPassword: passwords.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('Success', 'Password updated.', 'success');
      setShowPwdForm(false);
      setPasswords({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.message || 'Failed to update.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="ShareMitra" className="w-10 h-10 rounded-full" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
              ShareMitra
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-5 h-5" /> {fullName || 'Profile'}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white flex flex-col">
                <SheetHeader className="p-4">
                  <SheetTitle className="text-lg font-semibold">Profile</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input disabled value={fullName} className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input disabled value={client.email} className="bg-gray-50" />
                  </div>
                  {!showPwdForm ? (
                    <Button onClick={() => setShowPwdForm(true)} className="w-full bg-emerald-600 text-white cursor-pointer">
                      Update Password
                    </Button>
                  ) : (
                    <form onSubmit={submitPasswordUpdate} className="space-y-4">
                      <div>
                        <Label>Old Password</Label>
                        <Input
                          type="password"
                          required
                          value={passwords.oldPassword}
                          onChange={e => setPasswords(prev => ({ ...prev, oldPassword: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          required
                          value={passwords.newPassword}
                          onChange={e => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-emerald-600 text-white cursor-pointer">
                          Save
                        </Button>
                        <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setShowPwdForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
                <SheetFooter className="p-4">
                  <Button variant="destructive" onClick={logout} className="w-full bg-red-600 text-white flex items-center justify-center cursor-pointer">
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Button variant="destructive" onClick={logout} className="flex items-center gap-2 bg-red-600 text-white cursor-pointer">
              <LogOut className="w-5 h-5" />
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
            <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white cursor-pointer hover:from-emerald-700 hover:to-green-700 transition">
              <Plus className="w-5 h-5" /> New Campaign
            </Button>
          </Link>
        </div>

        {loadingCampaigns ? (
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
              <motion.div key={c._id} whileHover={{ scale: 1.02 }}>
                <Card className="bg-white shadow hover:shadow-lg transition">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium">{c.serviceHeading}</h3>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCampaign(c.campaignId)}
                        className="p-1 bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="truncate mt-2 mb-4">
                      <span className="font-semibold">Link:</span>{' '}
                      <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {c.link}
                      </a>
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-800 mb-4">
                      {c.actions.map((a, index) => (
                        <li key={index}>
                          {a.quantity} × {a.actionType} (@${a.unitCost} ea) = ${a.totalCost}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Created on {formatDate(c.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
