'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface ContentItem {
  contentId?: string;
  key: string;
  value: string;
}

interface Service {
  serviceId: string;
  serviceHeading: string;
  serviceDescription: string;
  serviceContent: ContentItem[];
}

export default function AddEditServicePage() {
  const router = useRouter();
  const params = useSearchParams();
  const serviceId = params.get('serviceId'); // ?serviceId=...
  const isEdit = Boolean(serviceId);

  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  /* -------------------------------------------------------------------------- */
  /*                              Prefill on edit                               */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.post<Service>(`${API_BASE}/service/getById`, { serviceId });
        setHeading(data.serviceHeading);
        setDescription(data.serviceDescription);
        setContents(
          data.serviceContent.length
            ? data.serviceContent.map(c => ({ contentId: c.contentId, key: c.key, value: c.value }))
            : [{ key: '', value: '' }]
        );
      } catch (err: any) {
        Swal.fire('Error', err.response?.data?.error || err.message, 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, serviceId, router, API_BASE]);

  /* -------------------------------------------------------------------------- */
  /*                          Handlers: add / remove row                        */
  /* -------------------------------------------------------------------------- */
  const handleAddRow = () => setContents(prev => [...prev, { key: '', value: '' }]);

  const handleRemoveRow = async (index: number) => {
    const item = contents[index];

    // If it's a new row or we're creating a new service, just drop it locally
    if (!isEdit || !item.contentId) {
      setContents(prev => prev.filter((_, i) => i !== index));
      return;
    }

    // Existing content — confirm and call backend
    const confirm = await Swal.fire({
      title: 'Delete this content item?',
      text: 'This change is permanent.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/service/deleteContent`, {
        serviceId,
        contentId: item.contentId,
      });
      Swal.fire('Deleted!', 'Service content removed.', 'success');
      setContents(prev => prev.filter((_, i) => i !== index));
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 Submit form                                */
  /* -------------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heading.trim() || !description.trim()) {
      return Swal.fire('Error', 'Heading and description are required.', 'error');
    }

    const validContents = contents.filter(c => c.key.trim() && c.value.trim());
    if (!validContents.length) {
      return Swal.fire('Error', 'At least one service content item is required.', 'error');
    }

    setLoading(true);
    try {
      if (isEdit) {
        await axios.post(`${API_BASE}/service/update`, {
          serviceId,
          serviceHeading: heading,
          serviceDescription: description,
          serviceContent: validContents,
        });
        Swal.fire('Success', 'Service updated.', 'success');
      } else {
        await axios.post(`${API_BASE}/service/create`, {
          serviceHeading: heading,
          serviceDescription: description,
          serviceContent: validContents,
        });
        Swal.fire('Success', 'Service created.', 'success');
      }
      router.push('/admin/services');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                    JSX                                     */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Service' : 'Add New Service'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Heading */}
        <div>
          <Label htmlFor="heading">Service Heading</Label>
          <Input id="heading" value={heading} onChange={e => setHeading(e.target.value)} required />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Dynamic content list */}
        <div>
          <Label>Service Content</Label>
          {contents.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Key"
                value={item.key}
                onChange={e => {
                  const v = e.target.value;
                  setContents(prev => prev.map((it, i) => (i === idx ? { ...it, key: v } : it)));
                }}
                required
              />
              <Input
                placeholder="Value"
                value={item.value}
                onChange={e => {
                  const v = e.target.value;
                  setContents(prev => prev.map((it, i) => (i === idx ? { ...it, value: v } : it)));
                }}
                required
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="bg-red-500 text-white cursor-pointer"
                onClick={() => handleRemoveRow(idx)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={handleAddRow} className="mt-2" disabled={loading}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isEdit ? 'Update Service' : 'Create Service'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/services')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}