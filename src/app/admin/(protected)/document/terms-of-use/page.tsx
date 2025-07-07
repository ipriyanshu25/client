'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { get, post } from '@/lib/api';

interface Term {
  termId?: number;
  _id?: string;
  content: string;
  createdAt?: string;
}

export default function TermsOfUsePage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedId, setSelectedId] = useState<string | number>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await get<Term[]>('/terms/get');
        setTerms(data);
        if (data.length) {
          const latest = data[0];
          const id = latest.termId ?? latest._id!;
          setSelectedId(id);
          setContent(latest.content);
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Unable to load Terms of Use.',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const term = terms.find((t) => String(t.termId ?? t._id) === id);
    if (term) setContent(term.content);
  };

  const handleSave = async () => {
    if (!selectedId) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Version',
        text: 'Please choose a version first.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }
    setSaving(true);
    try {
      await post<void>('/terms/updateById', { termId: selectedId, content });
      await Swal.fire({
        icon: 'success',
        title: 'Saved',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      router.refresh();
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || '',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold mb-6">Manage Terms of Use</h1>

      <textarea
        className="w-full h-80 p-4 border rounded mb-6 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={saving}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}