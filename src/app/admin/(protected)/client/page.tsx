'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';

interface Client {
  clientId: string;
  name: { firstName: string; lastName: string };
  email: string;
  createdAt: string;
}

interface ApiResponse {
  data: Client[];
  meta: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!localStorage.getItem('adminId')) {
      router.push('/admin/login');
    }
  }, [router]);

  // Fetch clients
  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.get<ApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}client/getAll`
        );
        setClients(resp.data.data);
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

  // Filter clients by searchQuery
  const filteredClients = clients.filter((client) => {
    const fullName = `${client.name.firstName} ${client.name.lastName}`.toLowerCase();
    const email = client.email.toLowerCase();
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || email.includes(q);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">All Clients</h1>
        <button
          onClick={() => setSearchVisible((v) => !v)}
          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition focus:outline-none"
          aria-label={searchVisible ? 'Close search' : 'Open search'}
        >
          {searchVisible ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>

      {searchVisible && (
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      {filteredClients.length === 0 ? (
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
              {filteredClients.map((client) => (
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
