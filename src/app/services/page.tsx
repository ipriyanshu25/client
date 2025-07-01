'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Play, Instagram, Star, Search, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

interface ServiceContentItem {
  contentId: string;
  key: string;
  value: string;
}

interface Service {
  serviceId: string;
  serviceHeading: string;
  serviceDescription: string;
  serviceContent: ServiceContentItem[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // track which service IDs have their prices shown
  const [visiblePrices, setVisiblePrices] = useState<Record<string, boolean>>({});

  const togglePrices = (serviceId: string) => {
    setVisiblePrices(prev => ({ ...prev, [serviceId]: !prev[serviceId] }));
  };

  // auth detection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    setIsLoggedIn(!!token && !!clientId);
  }, []);

  // fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_BASE}/service/getAll?page=1&limit=100&search=${encodeURIComponent(search)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load services');
        setServices(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [search]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent animate-pulse">
              ShareMitra
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {showSearch ? (
              <div className="relative flex items-center">
                <Input
                  autoFocus
                  placeholder="Search services..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-48 md:w-72 h-10 rounded-full shadow-md focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="absolute right-2 p-1 rounded-full hover:bg-gray-200"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <Search className="h-6 w-6 text-gray-600" />
              </button>
            )}

            <Link href="/">
              <Button
                size="sm"
                variant="outline"
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
              >
                Home
              </Button>
            </Link>

            {!isLoggedIn && (
              <Link href="/login">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative py-20">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15)_0%,rgba(236,252,245,0)_70%)]" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight md:text-6xl">
            Discover Our&nbsp;
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Services
            </span>
          </h1>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto text-lg">
            Boost your social media presence with our tailored engagement solutions.
          </p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <main className="flex-grow pb-20">
        <div className="container mx-auto px-4">
          {error && <p className="text-red-500 text-center mb-6">{error}</p>}
          {loading ? (
            <p className="text-center text-gray-600">Loading services…</p>
          ) : (
            <div className="grid gap-10 justify-center sm:grid-cols-2 lg:grid-cols-3">
              {services.map(svc => {
                const lc = svc.serviceHeading.toLowerCase();
                const isYT = lc.includes('youtube');
                const isIG = lc.includes('instagram');
                const Icon = isYT ? Play : isIG ? Instagram : Star;
                const ringColor = isYT
                  ? 'ring-red-200'
                  : isIG
                  ? 'ring-pink-200'
                  : 'ring-emerald-200';
                const iconColor = isYT
                  ? 'text-red-600'
                  : isIG
                  ? 'text-pink-600'
                  : 'text-emerald-600';

                const showPrices = !!visiblePrices[svc.serviceId];

                return (
                  <Card
                    key={svc.serviceId}
                    className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-2xl ring-1 ${ringColor}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400/40 to-green-400/40" />

                    <CardHeader className="text-center pb-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white ring-4 ring-inset ring-white/40 flex items-center justify-center">
                        <Icon className={`h-8 w-8 ${iconColor}`} />
                      </div>
                      <CardTitle className="text-2xl font-semibold text-gray-900">
                        {svc.serviceHeading}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {svc.serviceDescription}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pb-6">
                      {svc.serviceContent.map(item => (
                        <div
                          key={item.contentId}
                          className="flex items-center justify-between px-4 py-2 bg-white rounded-md ring-1 ring-emerald-100"
                        >
                          <span className="text-gray-800">{item.key}</span>
                          {showPrices && (
                            <span className="text-gray-600">${item.value}</span>
                          )}
                        </div>
                      ))}

                      {/* single toggle button */}
                      <div className="text-center mt-4">
                        <Button
                          size="sm"
                          onClick={() => togglePrices(svc.serviceId)}
                        >
                          {showPrices ? 'Hide Prices' : 'View Prices'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white pt-12 pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full" />
                <span className="text-xl font-bold">ShareMitra</span>
              </div>
              <p className="text-gray-400">
                The #1 platform for social media engagement services.
              </p>
            </div>
            {['Services', 'Company', 'Support'].map(section => (
              <div key={section}>
                <h4 className="font-semibold mb-4">{section}</h4>
                <ul className="space-y-2 text-gray-400">
                  {(() => {
                    if (section === 'Services')
                      return ['YouTube Promotion', 'Instagram Growth', 'Likes & Comments', 'Custom Packages'];
                    if (section === 'Company')
                      return ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'];
                    return ['Help Center', 'FAQ', 'Live Chat', 'Email Support'];
                  })().map(item => (
                    <li key={item} className="hover:text-emerald-400 transition-colors">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
