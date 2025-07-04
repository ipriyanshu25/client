'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Play, Search, X, Shield, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    setIsLoggedIn(!!token && !!clientId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 flex flex-col">
      {/* Site Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              ShareMitra
            </span>
          </Link>
          <div className="flex items-center space-x-4">
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

      {/* Page Header */}
      <header className="py-8 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-emerald-600">
            About ShareMitra
          </h1>
          <p className="mt-2 text-gray-700">
            We empower creators and businesses by amplifying real human engagement across social platforms.
          </p>
        </div>
      </header>

      {/* Mission & Vision */}
      <section className="flex-grow container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Mission */}
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              At ShareMitra, our mission is to foster authentic connections.
              We believe in genuine engagement—helping your content reach real
              people who care, comment, and share.
            </p>
          </div>
          {/* Vision */}
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Our Vision
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We envision a world where every creator and brand can
              meaningfully grow, powered by trust and transparency.
              ShareMitra aims to be the global leader in safe, reliable
              engagement services.
            </p>
          </div>
        </div>

        {/* Values Cards */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Our Core Values
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Trust & Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We adhere to platform guidelines and maintain the highest
                  standards for secure engagement.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Genuine Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We connect you with a real, diverse network of users
                  committed to engaging with your content.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Fast delivery and transparent reporting ensure you see real
                  results within hours.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link href={isLoggedIn ? '/dashboard' : '/login'}>
            <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 text-lg cursor-pointer hover:from-emerald-700 hover:to-green-700 transition">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white  pb-8">
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          © {new Date().getFullYear()} ShareMitra. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
