/* app/admin/services/page.tsx */
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash } from 'lucide-react';

interface ServiceContentItem {
  key: string;
  value: string;
}
interface Service {
  serviceId: string;
  serviceHeading: string;
  serviceDescription: string;
  serviceContent: ServiceContentItem[];
}

export default function AdminServicesPage() {
  const [services, setServices]   = useState<Service[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState<string | null>(null);

  /* ───────────────── Fetch services ───────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<{ data: Service[] }>(
          `${process.env.NEXT_PUBLIC_API_URL}service/getAll?page=1&limit=100`
        );
        setServices(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load services');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────────────── Delete ───────────────── */
  const handleDelete = async (serviceId: string) => {
    const res = await Swal.fire({
      title: 'Delete this service?',
      text: 'All related plans will also be removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!res.isConfirmed) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}service/delete`,
        { serviceId }
      );
      setServices(prev => prev.filter(s => s.serviceId !== serviceId));
      Swal.fire('Deleted!', 'Service removed.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  /* ───────────────── UI ───────────────── */
  if (loading)   return <p className="p-8 text-center">Loading services…</p>;
  if (error)     return <p className="p-8 text-center text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Services</h1>

        <Link href="/admin/services/add-edit-service">
          <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4" /> Add Service
          </Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="text-center text-gray-500">No services added yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((svc) => (
            <Card
              key={svc.serviceId}
              className="hover:shadow-xl transition-shadow group"
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{svc.serviceHeading}</span>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {svc.serviceContent.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {svc.serviceDescription}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-6">
                  {svc.serviceContent.map((itm) => (
                    <li
                      key={itm.key}
                      className="flex justify-between text-sm bg-gray-50 rounded px-3 py-1"
                    >
                      <span>{itm.key}</span>
                      <span className="font-medium text-emerald-600">
                        ${itm.value}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-end gap-2">
                  <Link
                    href={{
                      pathname: '/admin/services/add-edit-service',
                      query: { serviceId: svc.serviceId },
                    }}
                  >
                    <Button variant="outline" size="sm" className="gap-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    onClick={() => handleDelete(svc.serviceId)}
                  >
                    <Trash className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
