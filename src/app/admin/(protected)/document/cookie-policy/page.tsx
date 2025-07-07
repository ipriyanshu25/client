'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { get, post } from '@/lib/api';

interface CookieRecord {
  cookieId: string;
  content: string;
  effectiveDate: string;
  updatedDate?: string;
}

export default function CookiePolicyPage() {
  const [records, setRecords] = useState<CookieRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await get<CookieRecord[]>('/cookie/get');
        setRecords(data);
        if (data.length) {
          const latest = data[0];
          setSelectedId(latest.cookieId);
          setContent(latest.content);
          setEffectiveDate(new Date(latest.effectiveDate).toISOString().slice(0, 10));
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Unable to load Cookie Policy.',
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
    const rec = records.find(r => r.cookieId === id);
    if (rec) {
      setContent(rec.content);
      setEffectiveDate(new Date(rec.effectiveDate).toISOString().slice(0, 10));
    }
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
      await post<void>('/cookie/updateById', {
        cookieId: selectedId,
        content,
        effectiveDate,
      });
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
        <p className="text-gray-500">Loading Cookie Policy...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-semibold mb-6">Manage Cookie Policy</h1>

      <div className="mb-6">
        <label htmlFor="version" className="block mb-2 font-medium">Select Version:</label>
        <select
          id="version"
          value={selectedId}
          onChange={handleSelect}
          disabled={saving}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {records.map(r => (
            <option key={r.cookieId} value={r.cookieId}>
              Version – {new Date(r.effectiveDate).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="effectiveDate" className="block mb-2 font-medium">Effective Date:</label>
        <input
          type="date"
          id="effectiveDate"
          value={effectiveDate}
          onChange={e => setEffectiveDate(e.target.value)}
          disabled={saving}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

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