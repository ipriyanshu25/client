'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';

interface Client {
  clientId: string;
  name: { firstName: string; lastName: string };
  email: string;
  createdAt: string;
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('adminId')) {
      router.push('/admin/login');
    }
  }, [router]);

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

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">All Clients</h1>

      {clients.length === 0 ? (
        <p className="text-center text-gray-500">No clients found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-emerald-600 text-white rounded-t-lg">
              <tr>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Joined</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Campaigns</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.clientId} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                                         {client.name.firstName} {client.name.lastName}

                  </td>
                  <td className="py-4 px-6">{client.email}</td>
                  <td className="py-4 px-6">{formatDate(client.createdAt)}</td>
                  <td className="py-4 px-6">
                    <Badge className="bg-emerald-100 text-emerald-800">
                      Active
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <Link
                      href={`/admin/client/campaign?id=${client.clientId}`}
                      className="inline-block px-4 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
