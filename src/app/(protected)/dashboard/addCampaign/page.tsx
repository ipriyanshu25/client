'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '@/lib/api';

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

const RAZORPAY_KEY = 'rzp_live_GngmINuJmpWywN';

export default function CreateCampaign() {
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [postLink, setPostLink] = useState('');
  const [services, setServices] = useState<{ [id: string]: number }>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get<{ data: ServiceOption[] }>('/service/getAll', { params: { page: 1, limit: 100 } });
        setServiceOptions(resp.data.data);
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not load platforms.', timer: 2000, showConfirmButton: false });
      }
    })();
  }, []);

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

  function buildActions(services: Record<string, number>) {
    return Object.entries(services)
      .filter(([, qty]) => qty > 0)
      .map(([contentId, quantity]) => ({ contentId, quantity }));
  }

  async function createRazorpayOrder(amount: number, clientId: string, serviceId: string) {
    const resp = await api.post<{ order: { id: string; amount: number; currency: string } }>('/payment/order', { amount, clientId, serviceId });
    return resp.data.order;
  }

  async function verifyPaymentOnBackend(paymentResp: any) {
    await api.post('/payment/verify', paymentResp);
  }

  async function createCampaignRecord(clientId: string, serviceId: string, postLink: string, actions: any[]) {
    const resp = await api.post('/campaign/create', { clientId, serviceId, link: postLink, actions });
    return resp.data.data?.campaignId || (resp.data as any).campaignId;
  }

  async function generateInvoice(campaignId: string, paymentFields: any) {
    const resp = await api.post<{ success: boolean; message?: string }>('/invoice/generate', { campaignId, ...paymentFields });
    if (!resp.data.success) throw new Error(resp.data.message || 'Invoice generation failed');
  }

  const loadRazorpay = () =>
    new Promise<boolean>(resolve => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (!serviceId || !postLink || totalAmount <= 0) return;
    setLoading(true);

    try {
      if (!(await loadRazorpay())) throw new Error('Unable to load payment gateway.');

      const clientId = localStorage.getItem('clientId');
      if (!clientId) throw new Error('You must be logged in');

      const order = await createRazorpayOrder(totalAmount, clientId, serviceId);

      new (window as any).Razorpay({
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'ShareMitra',
        description: 'Campaign Payment',
        order_id: order.id,
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#0f766e' },
        handler: async (paymentResp: any) => {
          try {
            await verifyPaymentOnBackend(paymentResp);
            const actions = buildActions(services);
            const campaignId = await createCampaignRecord(clientId, serviceId, postLink, actions);
            if (!campaignId) throw new Error('Missing campaignId');
            await generateInvoice(campaignId, paymentResp);
            await Swal.fire({ icon: 'success', title: 'Campaign Created Successfully', timer: 1500, showConfirmButton: false });
            router.push('/dashboard');
          } catch (e: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: e.message || String(e), timer: 2000, showConfirmButton: false });
            setLoading(false);
          }
        },
      }).open();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || String(err), timer: 2000, showConfirmButton: false });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 border-b bg-white/70 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}
          >
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
              ShareMitra
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-3">
            <Button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md">
              Dashboard
            </Button>
            <Button onClick={() => router.push('/services')} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-md">
              Services
            </Button>
          </nav>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t shadow-sm">
            <nav className="flex flex-col p-4 space-y-2">
              <button onClick={() => { setMenuOpen(false); router.push('/dashboard'); }} className="text-left">
                Dashboard
              </button>
              <button onClick={() => { setMenuOpen(false); router.push('/services'); }} className="text-left">
                Services
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow container mx-auto p-6 md:p-12">
        <Card className="max-w-3xl mx-auto p-8 rounded-2xl shadow-xl ring-1 ring-emerald-200/60 bg-white">
          <h1 className="text-3xl font-bold text-center mb-6">Create New Campaign</h1>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Platform</label>
            <select value={serviceId} onChange={e => { setServiceId(e.target.value); setSelectedService(serviceOptions.find(s => s.serviceId === e.target.value) || null); setServices({}); }} disabled={loading || !serviceOptions.length} className="w-full h-12 border rounded-md px-3 focus:ring-emerald-500">
              <option value="">-- Select Platform --</option>
              {serviceOptions.map(opt => (
                <option key={opt.serviceId} value={opt.serviceId}>{opt.serviceHeading}</option>
              ))}
            </select>
          </div>

          {/* Post Link */}
          <div className="mb-8">
            <label className="block mb-2 font-semibold">Post Link</label>
            <input type="url" value={postLink} onChange={e => setPostLink(e.target.value)} disabled={loading} placeholder="https://example.com/post" className="w-full h-12 border rounded-md px-3 focus:ring-emerald-500" />
          </div>

          {/* Quantities */}
          {selectedService && (
            <div className="mb-8">
              <div className="flex justify-between mb-2 font-semibold">
                <span>Services</span><span>Quantity</span>
              </div>
              <div className="space-y-4">
                {selectedService.serviceContent.map(item => (
                  <div key={item.contentId} className="flex justify-between p-4 border rounded-md">
                    <div>
                      <div className="font-medium">{item.key}</div>
                      <div className="text-sm text-gray-500">${item.value} each</div>
                    </div>
                    <input type="number" name={item.contentId} min={0} value={services[item.contentId] || 0} onChange={e => setServices(prev => ({ ...prev, [e.target.name]: Math.max(0, Number(e.target.value)) }))} disabled={loading} className="w-20 h-10 border rounded-md text-center focus:ring-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total & Submit */}
          <div className="text-right mb-6 font-semibold">Total: ${totalAmount.toFixed(2)}</div>
          <div className="text-center">
            <Button onClick={handlePayment} className="bg-emerald-600 text-white" disabled={loading || !serviceId || !postLink || totalAmount === 0}>
              {loading ? 'Processing…' : 'Pay & Create Campaign'}
            </Button>
          </div>
        </Card>
      </main>

      <footer className="bg-gray-900 text-white text-center py-4">
        © {new Date().getFullYear()} ShareMitra. All rights reserved.
      </footer>
    </div>
  );
}
