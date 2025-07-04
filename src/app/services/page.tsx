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
import { Play, Instagram, Search, X, CheckCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

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
  logo?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    setIsLoggedIn(!!token && !!clientId);
  }, []);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_BASE}/service/getAll?page=1&limit=100&search=${encodeURIComponent(search)}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load services');
        // json.data is array of Service including logo (base64)
        setServices(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [search]);

  const renderIconOrLogo = (svc: Service) => {
    if (svc.logo) {
      // API returns full data URL or base64 string
      const src = svc.logo.startsWith('data:')
        ? svc.logo
        : `data:image/png;base64,${svc.logo}`;
      return (
        <img
          src={src}
          alt={svc.serviceHeading}
          className="w-16 h-16 rounded-full object-cover group-hover:blur-0" 
        />
      );
    }
    const h = svc.serviceHeading.toLowerCase();
    if (h.includes('instagram')) return <Instagram className="h-8 w-8 text-pink-600" />;
    if (h.includes('youtube')) return <Play className="h-8 w-8 text-red-600" />;
    return <Play className="h-8 w-8 text-emerald-600" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
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
                <button onClick={() => setShowSearch(false)} className="absolute right-2 p-1 rounded-full hover:bg-gray-200">
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowSearch(true)} className="p-2 rounded-full hover:bg-gray-200">
                <Search className="h-6 w-6 text-gray-600" />
              </button>
            )}
            {!isLoggedIn && (
              <Link href="/login">
                <Button size="sm" variant="outline" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="relative py-20 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 md:text-6xl">
          Discover Our{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Services
          </span>
        </h1>
        <p className="text-gray-600 mb-10 max-w-2xl mx-auto text-lg">
          Boost your social media presence with our tailored engagement solutions.
        </p>
      </section>

      <main className="flex-grow pb-20">
        <div className="container mx-auto px-4">
          {error && <p className="text-red-500 text-center mb-6">{error}</p>}
          {loading ? (
            <p className="text-center text-gray-600">Loading services…</p>
          ) : (
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 justify-center">
              {services.map(svc => (
                <Card key={svc.serviceId} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 flex items-center justify-center rounded-full group-hover:bg-emerald-200 transition-colors">
                      {renderIconOrLogo(svc)}
                    </div>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                      {svc.serviceHeading}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {svc.serviceDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-3 px-4 pb-6">
                    {svc.serviceContent.map(item => (
                      <div key={item.contentId} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{item.key}: {item.value}$</span>
                      </div>
                    ))}
                    <div className="mt-4">
                      <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                        <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700">
                          Create Campaign
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white pb-8 text-center">
        <div className="border-t border-gray-800 pt-8 text-gray-400">
          &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
