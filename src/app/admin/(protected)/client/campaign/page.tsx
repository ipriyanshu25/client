'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Action {
  contentId: string;
  contentKey: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
}

interface Campaign {
  _id: string;
  campaignId: string;
  clientId: string;
  clientName: { firstName: string; lastName: string };
  serviceId: string;
  serviceHeading: string;
  link: string;
  actions: Action[];
  status: 'pending' | 'completed' | 'failed' | string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ClientCampaignsPage() {
  const searchparams = useSearchParams();
  const router = useRouter();
  const clientId = searchparams.get('id');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!localStorage.getItem('adminId')) {
      router.push('/admin/login');
    }
  }, [router]);

  // Fetch campaigns for this client
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.post<{
          success: boolean;
          count: number;
          campaigns: Campaign[];
        }>(
          `${process.env.NEXT_PUBLIC_API_URL}campaign/getByClient`,
          { clientId }
        );

        if (!data.success) {
          throw new Error('Failed to load campaigns');
        }

        setCampaigns(data.campaigns);
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', err.message || 'Failed to load campaigns', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  // Extract client name from first campaign
  const clientName =
    campaigns.length > 0
      ? `${campaigns[0].clientName.firstName} ${campaigns[0].clientName.lastName}`
      : '';

  if (loading) {
    return (
      <div className="p-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-56 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-emerald-700">
        {`Campaigns ${clientName}`}
      </h1>

      {campaigns.length === 0 ? (
        <p className="text-center text-gray-500">No campaigns found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const statusClasses = {
              pending: 'bg-yellow-100 text-yellow-800',
              completed: 'bg-green-100 text-green-800',
              failed: 'bg-red-100 text-red-800',
            }[c.status] || 'bg-gray-100 text-gray-800';

            return (
              <Card
                key={c.campaignId}
                className="bg-white shadow-md hover:shadow-xl transform hover:scale-[1.02] transition rounded-lg"
              >
                <CardContent className="p-6 space-y-4">

                  {/* Client & Link */}
                  <div className="text-sm text-gray-600">
                    <p>
                      Client Name:{' '}
                      <strong>
                        {c.clientName.firstName} {c.clientName.lastName}
                      </strong>
                    </p>
                    <p className="break-all mt-2">
                      URL:{' '}
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-emerald-600 blue-600 hover:text-emerald-800 transition"
                      >
                        {c.link}
                      </a>
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created {formatDate(c.createdAt)}</span>
                  </div>

                  {/* Actions Table */}
                  <div>
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead>
                        <tr>
                          <th className="pb-2">Services</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.actions.map((a) => (
                          <tr key={a.contentId} >
                            <td className="py-1">{a.contentKey}</td>
                            <td className="py-1">{a.quantity}</td>
                            <td className="py-1">{a.totalCost.toFixed(2)}$</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total & Controls */}
                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Total Amount: ${c.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}