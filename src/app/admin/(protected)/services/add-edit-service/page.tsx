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
  logo?: string; // Data URL or Base64 string stored by API
}

export default function AddEditServicePage() {
  const router = useRouter();
  const params = useSearchParams();
  const serviceId = params.get('serviceId');
  const isEdit = Boolean(serviceId);

  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([{ key: '', value: '' }]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')

  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.post<Service>(
          `${API_BASE}service/getById`,
          { serviceId }
        );
        setHeading(data.serviceHeading);
        setDescription(data.serviceDescription);
        setContents(
          data.serviceContent.length
            ? data.serviceContent.map(c => ({ contentId: c.contentId, key: c.key, value: c.value }))
            : [{ key: '', value: '' }]
        );
        if (data.logo) {
          setLogoPreview(data.logo);
        }
      } catch (err: any) {
        Swal.fire('Error', err.response?.data?.error || err.message, 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, serviceId, router, API_BASE]);

  const handleAddRow = () =>
    setContents(prev => [...prev, { key: '', value: '' }]);

  const handleRemoveRow = async (index: number) => {
    const item = contents[index];
    if (!isEdit || !item.contentId) {
      setContents(prev => prev.filter((_, i) => i !== index));
      return;
    }

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
      await axios.post(
        `${API_BASE}service/deleteContent`,
        { serviceId, contentId: item.contentId }
      );
      Swal.fire('Deleted!', 'Service content removed.', 'success');
      setContents(prev => prev.filter((_, i) => i !== index));
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heading.trim() || !description.trim()) {
      return Swal.fire('Error', 'Heading and description are required.', 'error');
    }

    const validContents = contents.filter(c => c.key.trim() && c.value.trim());
    if (!validContents.length) {
      return Swal.fire('Error', 'At least one service content item is required.', 'error');
    }

    const formData = new FormData();
    formData.append('serviceHeading', heading.trim());
    formData.append('serviceDescription', description.trim());
    formData.append('serviceContent', JSON.stringify(validContents));
    if (logoFile) formData.append('logo', logoFile);
    if (isEdit && serviceId) formData.append('serviceId', serviceId);

    setLoading(true);
    try {
      if (isEdit) {
        await axios.post(
          `${API_BASE}service/update`,
          formData
        );
        Swal.fire('Success', 'Service updated.', 'success');
      } else {
        await axios.post(
          `${API_BASE}service/create`,
          formData
        );
        Swal.fire('Success', 'Service created.', 'success');
      }
      router.push('/admin/services');
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.error || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-8">{isEdit ? 'Edit Service' : 'Add New Service'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Heading */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="heading">Service Heading</Label>
          <Input
            id="heading"
            value={heading}
            onChange={e => setHeading(e.target.value)}
            required
          />
        </div>
        {/* Description */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        {/* Logo Upload */}
        <div className="flex flex-col space-y-2 ">
          <Label htmlFor="logo">Service Logo</Label>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="mb-2 h-24 w-24 object-contain"
            />
          )}
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files?.[0] || null;
              setLogoFile(file);
              if (file) setLogoPreview(URL.createObjectURL(file));
            }}
          />
        </div>
        {/* Dynamic content list */}
        <div className="flex flex-col space-y-2">
          <Label>Service Content</Label>
          {contents.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Key"
                value={item.key}
                onChange={e => {
                  const v = e.target.value;
                  setContents(prev =>
                    prev.map((it, i) => (i === idx ? { ...it, key: v } : it))
                  );
                }}
                required
              />
              <Input
                placeholder="USD Rate per Unit"
                value={item.value}
                onChange={e => {
                  const v = e.target.value;
                  setContents(prev =>
                    prev.map((it, i) => (i === idx ? { ...it, value: v } : it))
                  );
                }}
                required
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="bg-red-500 text-white"
                onClick={() => handleRemoveRow(idx)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            className="mt-2"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>
        {/* Actions */}
        <div className="flex space-x-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isEdit ? 'Update Service' : 'Create Service'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/services')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
