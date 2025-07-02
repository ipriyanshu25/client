/* app/admin/clients/page.tsx */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Client {
  clientId: string;
  name: { firstName: string; lastName: string };
  email: string;
  createdAt: string;
}

export default function AdminClientsPage() {
  const router   = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  /* ───────────────── Redirect if not admin ───────────────── */
  useEffect(() => {
    if (!localStorage.getItem('adminId')) router.push('/admin/login');
  }, [router]);

  /* ───────────────── Fetch all clients ───────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<Client[]>(
          `${process.env.NEXT_PUBLIC_API_URL}client/getAll`
        );
        setClients(data);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to load clients', 'error');
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

  /* ───────────────── UI ───────────────── */
  if (loading) {
    return (
      <div className="p-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 p-8">
      <h1 className="text-3xl font-bold mb-8">All Clients</h1>

      {clients.length === 0 ? (
        <p className="text-center text-gray-500">No clients found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map(client => (
            <Card key={client.clientId} className="bg-white shadow hover:shadow-lg transition">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">
                      {client.name.firstName} {client.name.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Joined&nbsp;{formatDate(client.createdAt)}
                  </span>
                  {/* label for future status/tiers if needed */}
                  <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
