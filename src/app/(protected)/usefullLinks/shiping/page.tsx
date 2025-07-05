'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

type PolicySection = {
  id: string | number;
  title: string;
  body: string;
};

type Policy = {
  effectiveDate?: string;
  sections?: PolicySection[];
  [key: string]: any;
};

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const resp = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/shipping/get`
        );
        const first = Array.isArray(resp.data) ? resp.data[0] : resp.data;
        setPolicy(first);
      } catch (err) {
        console.error(err);
        setError('Failed to load shipping policy.');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Loading Shipping Policy...</p>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-500">{error || 'No privacy policy available.'}</p>
      </div>
    );
  }

  const formattedDate = policy.effectiveDate
    ? new Date(policy.effectiveDate).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <>
      <Head>
        <base href="/" />
      </Head>
      <div className={`${dmSans.className} min-h-screen bg-slate-50 flex flex-col`}>  
        {/* HEADER */}
        <header className="w-full bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="ShareMitra Logo" className="w-10 h-10 object-cover rounded-full" />
              <span className="text-2xl font-bold text-gray-900">ShareMitra</span>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white gap-2 hover:from-emerald-700 hover:to-green-700">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Shipping & Delivery Policy</h1>
          <div className="space-y-6 text-base leading-7 text-gray-700">
            <p>Effective Date: {formattedDate}</p>
            {policy.sections?.map(section => (
              <section key={section.id} className="pt-4">
                <h2 className="text-2xl font-semibold mt-6">{section.title}</h2>
                <p className="mt-2 whitespace-pre-line">{section.body}</p>
              </section>
            ))}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <img src="/logo.png" alt="ShareMitra Logo" className="w-8 h-8 object-cover rounded-full" />
                  <span className="text-xl font-bold">ShareMitra</span>
                </div>
                <p className="text-gray-400">The #1 platform for social media engagement services.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/dashboard" className="hover:underline">YouTube Promotion</Link></li>
                  <li><Link href="/dashboard" className="hover:underline">Instagram Growth</Link></li>
                  <li><Link href="/dashboard" className="hover:underline">Likes & Comments</Link></li>
                  <li><Link href="/dashboard" className="hover:underline">Custom Packages</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:underline">About Us</Link></li>
                  <li><Link href="/contactus" className="hover:underline">Contact</Link></li>
                  <li className="hover:underline">FAQ</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Useful Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/usefullLinks/termofuse" className="hover:underline">Terms of Use</Link></li>
                  <li><Link href="/usefullLinks/shiping" className="hover:underline">Shipping & Delivery Policy</Link></li>
                  <li><Link href="/usefullLinks/privacypolicy" className="hover:underline">Privacy Policy</Link></li>
                  <li><Link href="/usefullLinks/returnpolicy" className="hover:underline">Returns Policy</Link></li>
                  <li><Link href="/usefullLinks/cookiepolicy" className="hover:underline">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} ShareMitra. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
