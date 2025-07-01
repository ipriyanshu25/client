'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
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
  campaignId: string; // use backend-generated campaignId
  serviceHeading: string;
  link: string;
  actions: CampaignAction[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
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
      window.location.href = '/login';
      return;
    }
    (async () => {
      try {
        const [profileRes, campaignRes] = await Promise.all([
          api.post<ClientProfile>('/client/getById', { clientId }, { headers: { Authorization: `Bearer ${token}` } }),
          api.post('/campaign/getByClient', { clientId }, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setClient(profileRes.data);
        // ensure campaignId is available
        setCampaigns((campaignRes.data as any).campaigns || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCampaigns(false);
      }
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('clientId');
    window.location.href = '/login';
  };

  const fullName = client.name.firstName ? `${client.name.firstName} ${client.name.lastName}` : '';
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN');

  // Delete campaign handler using campaignId and SweetAlert
  const handleDeleteCampaign = async (campaignId: string) => {
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
          { campaignId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCampaigns(prev => prev.filter(c => c.campaignId !== campaignId));
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
  async function submitPasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) {
      Swal.fire('Error', 'You are not logged in.', 'error');
      return;
    }
    if (!passwords.oldPassword || !passwords.newPassword) {
      Swal.fire('Error', 'Please fill in both password fields.', 'error');
      return;
    }
    try {
      await api.post(
        '/client/updatePassword',
        {
          clientId,
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire('Success', 'Password updated successfully.', 'success');
      setShowPwdForm(false);
      setPasswords({ oldPassword: '', newPassword: '' });
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.message || 'Failed to update password.', 'error');
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 z-20 bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link href="/" className="cursor-pointer flex items-center gap-3">
            <img src="/logo.png" alt="ShareMitra" className="w-12 h-12 rounded-full shadow" />
            <motion.span
              className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ShareMitra
            </motion.span>
          </Link>

          <div className="flex items-center gap-4">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="default" className="cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-green-600">
                  <User className="w-6 h-6" /> {fullName || 'Profile'}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input disabled value={fullName} className="bg-white cursor-pointer" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input disabled value={client.email} className="bg-white cursor-pointer" />
                  </div>
                  {!showPwdForm ? (
                    <Button onClick={() => setShowPwdForm(true)} className="w-full bg-green-600 text-white cursor-pointer">
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
                          onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })}
                          className="cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          required
                          value={passwords.newPassword}
                          onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 bg-green-600 text-white cursor-pointer">
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setShowPwdForm(false)} className="flex-1 cursor-pointer">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
                <Button variant="destructive" onClick={logout} className="mt-6 w-full bg-red-600 text-white cursor-pointer">
                  <LogOut className="w-5 h-5 mr-2" /> Logout
                </Button>
              </SheetContent>
            </Sheet>
            <Button variant="destructive" size="lg" onClick={logout} className="flex items-center gap-2 bg-red-600 text-white cursor-pointer">
              <LogOut className="w-6 h-6" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900">Welcome Back, {fullName || 'User'}!</h1>
          <p className="text-gray-600 mt-2">Manage your social media campaigns and track your growth.</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Your Campaigns</h2>
          <Link href="/dashboard/addCampaign">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
              <Plus className="w-6 h-6" /> New Campaign
            </Button>
          </Link>
        </div>

        {loadingCampaigns ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-lg shadow animate-pulse"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-center text-gray-500">No campaigns yet — create one!</p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {campaigns.map(c => (
              <motion.div key={c.campaignId} whileHover={{ scale: 1.02 }}>
                <Card className="bg-white shadow hover:shadow-lg transition">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium mb-2">{c.serviceHeading}</h3>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCampaign(c.campaignId)}
                        className="p-1 bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="truncate mb-2">
                      <span className="font-semibold">Link: </span>
                      <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {c.link}
                      </a>
                    </p>
                    <div className="mb-4">
                      <span className="font-semibold">Actions:</span>
                      <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                        {c.actions.map(a => (
                          <li key={a._id} className="text-sm text-gray-900">
                            {a.quantity} × {a.actionType} (@${a.unitCost} ea) = ${a.totalCost}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">Total: ${c.totalAmount}</p>
                      <Badge className={`${statusColor[c.status.toLowerCase()]}`}>{c.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">Created on {formatDate(c.createdAt)}</p>
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
