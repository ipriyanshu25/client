/* app/admin/campaign/page.tsx */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash } from 'lucide-react';

interface CampaignAction {
  contentId: string;
  contentKey: string;
  quantity: number;
  totalCost: number;
}

interface Campaign {
  campaignId: string;
  clientName: { firstName: string; lastName: string };
  serviceHeading: string;
  link: string;
  actions: CampaignAction[];
  totalAmount: number;
  createdAt: string;
}

export default function AdminCampaignPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  /* ───────────────── Redirect if not admin ───────────────── */
  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) router.push('/admin/login');
  }, [router]);

  /* ───────────────── Fetch campaigns ───────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<{ campaigns: Campaign[] }>(
          `${process.env.NEXT_PUBLIC_API_URL}campaign/getAll`
        );
        setCampaigns(data.campaigns);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to load campaigns', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────────────── Delete ───────────────── */
  const handleDelete = async (campaignId: string) => {
    const res = await Swal.fire({
      title: 'Delete this campaign?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}campaign/delete`,
        { campaignId }
      );
try {
        const { data } = await axios.get<{ campaigns: Campaign[] }>(
          `${process.env.NEXT_PUBLIC_API_URL}campaign/getAll`
        );
        setCampaigns(data.campaigns);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to load campaigns', 'error');
      } finally {
        setLoading(false);
      }
      Swal.fire('Deleted!', 'Campaign removed.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  /* ───────────────── Helpers ───────────────── */
  const statusColor: Record<string, string> = {
    pending: 'bg-amber-400 text-amber-900',
    completed: 'bg-emerald-500 text-emerald-900',
    processing: 'bg-blue-400 text-blue-900',
    failed: 'bg-rose-500 text-rose-900',
  };
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  /* ───────────────── UI ───────────────── */
  if (loading) {
    return (
      <div className="p-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 p-8">
      <h1 className="text-3xl font-bold mb-8">All Campaigns</h1>

      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500">No campaigns found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Card key={c.campaignId} className="bg-white shadow hover:shadow-lg transition">
              <CardContent className="p-5 space-y-4">
                {/* Heading + delete */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{c.serviceHeading}</h3>
                    <p className="text-sm text-gray-600">
                      {c.clientName.firstName} {c.clientName.lastName}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDelete(c.campaignId)}
                    className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                {/* Link */}
                <p className="truncate text-sm">
                  <span className="font-semibold">Post&nbsp;: </span>
                  <a
                    href={c.link}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {c.link}
                  </a>
                </p>

                {/* Actions table */}
                <table className="w-full text-sm border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th>Action</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Total&nbsp;($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.actions.map((a) => (
                      <tr key={a.contentId} className="bg-gray-50">
                        <td>{a.contentKey}</td>
                        <td className="text-center">{a.quantity}</td>
                        <td className="text-right">{a.totalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Grand Total: ${c.totalAmount}</span>
                  {/* <Badge className={statusColor[c.status.toLowerCase()] || ''}>
                    {c.status}
                  </Badge> */}
                </div>
                <p className="text-xs text-gray-500">
                  Created&nbsp;on&nbsp;{formatDate(c.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
