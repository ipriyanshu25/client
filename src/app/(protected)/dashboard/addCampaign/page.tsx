'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ServiceContentItem {
  contentId: string;
  key: string;
  value: string;
}
interface ServiceOption {
  serviceId: string;
  serviceHeading: string;
  serviceDescription: string;
  serviceContent: ServiceContentItem[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const RAZORPAY_KEY = 'rzp_live_GngmINuJmpWywN';

export default function CreateCampaign() {
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [postLink, setPostLink] = useState('');
  const [services, setServices] = useState<{ [id: string]: number }>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}service/getAll?page=1&limit=100`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load services');
        setServiceOptions(json.data);
      } catch (e: any) {
        console.error(e);
        setError('Could not load platform options.');
      }
    })();
  }, []);

  function handleServiceSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setServiceId(id);
    const svc = serviceOptions.find(s => s.serviceId === id) || null;
    setSelectedService(svc);
    setServices({});
  }

  useEffect(() => {
    if (!selectedService) {
      setTotalAmount(0);
      return;
    }
    const sum = Object.entries(services).reduce((acc, [id, qty]) => {
      const item = selectedService.serviceContent.find(c => c.contentId === id);
      return acc + (item ? qty * Number(item.value) : 0);
    }, 0);
    setTotalAmount(sum);
  }, [services, selectedService]);

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handlePayment = async () => {
    if (!serviceId || !postLink || totalAmount === 0) return;
    setLoading(true);
    setError(null);

    const sdkOk = await loadRazorpay();
    if (!sdkOk) {
      setError('Payment gateway failed to load.');
      setLoading(false);
      return;
    }

    try {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) throw new Error('Not authenticated');
      const orderRes = await fetch(`${API_BASE}payment/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, clientId, serviceId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message || 'Order failed');

      const options: any = {
        key: RAZORPAY_KEY,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'ShareMitra',
        description: 'Campaign Payment',
        order_id: orderData.order.id,
        handler: async (resp: any) => {
          try {
            const verifyRes = await fetch(`${API_BASE}payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resp),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyJson.message || 'Verification failed');

            const actions = Object.entries(services)
              .filter(([, qty]) => qty > 0)
              .map(([contentId, qty]) => ({ contentId, quantity: qty }));

            const campRes = await fetch(`${API_BASE}campaign/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId, serviceId, link: postLink, actions }),
            });
            const campJson = await campRes.json();
            if (!campRes.ok) throw new Error(campJson.message || 'Campaign creation failed');

            router.push('/dashboard');
          } catch (e: any) {
            setError(e.message);
          } finally {
            setLoading(false);
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#3399cc' },
      };
      new (window as any).Razorpay(options).open();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const qty = Math.max(0, Number(value));
    setServices(prev => ({ ...prev, [name]: qty }));
  }

  /* -------------------------------- UI -------------------------------- */
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>  
            <img src="/logo.png" className="w-9 h-9 rounded-full" alt="Logo" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              ShareMitra
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-700 font-medium border-2 rounded-md px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition duration-200">
              Dashboard
            </button>
            <button onClick={() => router.push('/services')} className="text-gray-700 font-medium border-2 rounded-md px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition duration-200">
              Services
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">   
        <Card className="mx-auto max-w-3xl bg-white p-8 rounded-2xl ring-1 ring-emerald-200/60 shadow-xl md:p-12">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Create New Campaign
          </h1>

          {error && <p className="text-center text-red-600 font-medium mb-6">{error}</p>}

          {/* Platform */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-800 mb-2">Platform</label>
            <select
              value={serviceId}
              onChange={handleServiceSelect}
              disabled={loading || serviceOptions.length === 0}
              className="w-full h-12 rounded-md border border-gray-300 px-3 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Select Platform --</option>
              {serviceOptions.map(opt => (
                <option key={opt.serviceId} value={opt.serviceId}>{opt.serviceHeading}</option>
              ))}
            </select>
          </div>

          {/* Post Link */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-800 mb-2">Post Link</label>
            <input
              type="url"
              placeholder="https://example.com/post"
              value={postLink}
              onChange={e => setPostLink(e.target.value)}
              disabled={loading}
              className="w-full h-12 rounded-md border border-gray-300 px-3 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Services & Qty Header */}
          {selectedService && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-lg font-semibold text-gray-800">Services</span>
                <span className="text-lg font-semibold text-gray-800">Quantity</span>
              </div>
              <div className="space-y-4">
                {selectedService.serviceContent.map(item => (
                  <div key={item.contentId} className="flex items-center justify-between p-4 border border-emerald-200 rounded-md">
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-lg">{item.key}</span>
                      <span className="text-gray-500 text-sm">{item.value}$ per {item.key}</span>
                    </div>
                    <input
                      type="number"
                      name={item.contentId}
                      min={0}
                      value={services[item.contentId] || 0}
                      onChange={handleQuantityChange}
                      disabled={loading}
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield', margin: 0 }}
                      className="w-20 h-10 rounded-md border border-gray-300 text-center focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total & Submit */}
          <div className="flex flex-col items-center">
            <div className="w-full text-right text-xl font-semibold text-gray-800 mb-6">Total: ${totalAmount}</div>
            <Button
              onClick={handlePayment}
              disabled={loading || !serviceId || !postLink || totalAmount === 0}
              className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg disabled:opacity-50 transition duration-200 rounded-md"
            >
              {loading ? 'Processing…' : 'Pay & Create Campaign'}
            </Button>
          </div>
        </Card>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white pb-8 mt-auto">
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
