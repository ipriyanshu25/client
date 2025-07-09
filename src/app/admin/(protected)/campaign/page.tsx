'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

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
  status: number; // 0 = pending, 1 = completed
}

export default function AdminCampaignPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status constants
  const STATUS = { PENDING: 0, COMPLETED: 1 };

  useEffect(() => {
    if (!localStorage.getItem('adminId')) {
      router.push('/admin/login');
    }
  }, [router]);

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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleStatusUpdate = async (campaignId: string, status: number) => {
    setUpdatingId(campaignId);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}admin/updatestauts`,
        { campaignId, status }
      );
      Swal.fire('Success', 'Campaign status updated', 'success');
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaignId === campaignId ? { ...c, status } : c
        )
      );
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter campaigns by index or text
  const filtered = campaigns.filter((c, idx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim();
    if (/^\d+$/.test(q)) {
      return idx + 1 === parseInt(q, 10);
    }
    const lower = q.toLowerCase();
    return (
      c.clientName.firstName.toLowerCase().includes(lower) ||
      c.clientName.lastName.toLowerCase().includes(lower) ||
      c.serviceHeading.toLowerCase().includes(lower)
    );
  });

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-emerald-700">All Campaigns</h1>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowSearch((prev) => !prev)}
          aria-label="Toggle search"
          className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-100"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {showSearch && (
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full max-w-sm p-2 border rounded-md"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">No campaigns found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="py-3 px-6 text-left">#</th>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Service</th>
                <th className="py-3 px-6 text-left">URL</th>
                <th className="py-3 px-6 text-right">Total ($)</th>
                <th className="py-3 px-6 text-left">Created On</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <React.Fragment key={c.campaignId}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">{i + 1}</td>
                    <td className="py-4 px-6">
                      {c.clientName.firstName} {c.clientName.lastName}
                    </td>
                    <td className="py-4 px-6">{c.serviceHeading}</td>
                    <td className="py-4 px-6 truncate max-w-xs">
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        {c.link}
                      </a>
                    </td>
                    <td className="py-4 px-6 text-right">${c.totalAmount}</td>
                    <td className="py-4 px-6">{formatDate(c.createdAt)}</td>
                    <td className="py-4 px-6 text-center cursor-pointer">
                      {c.status === STATUS.PENDING ? (
                        <Button
                        className='cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white'
                          size="sm"
                          disabled={updatingId === c.campaignId}
                          onClick={() => handleStatusUpdate(c.campaignId, STATUS.COMPLETED)}
                        >
                          Mark Completed
                        </Button>
                      ) : (
                        <span className="text-green-600 font-medium">Completed</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => toggleExpand(c.campaignId)}
                        className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600"
                      >
                        {expandedId === c.campaignId ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === c.campaignId && (
                    <tr>
                      <td colSpan={8} className="bg-gray-50 px-6 py-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2">Action</th>
                                <th className="py-2 text-center">Qty</th>
                                <th className="py-2 text-right">Total ($)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.actions.map((a) => (
                                <tr key={`${c.campaignId}-${a.contentId}`} className="border-t">
                                  <td className="py-2">{a.contentKey}</td>
                                  <td className="py-2 text-center">{a.quantity}</td>
                                  <td className="py-2 text-right">${a.totalCost}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
