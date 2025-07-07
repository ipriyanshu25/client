'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { LogIn } from 'lucide-react';
import { DM_Sans } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';

const dmSans = DM_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

type FAQ = {
  faqId: string;
  question: string;
  answer: string;
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const resp = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/faqs/get`
        );
        setFaqs(resp.data);
        setFilteredFaqs(resp.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load FAQs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredFaqs(faqs);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredFaqs(
        faqs.filter(
          ({ question, answer }) =>
            question.toLowerCase().includes(term) || answer.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, faqs]);

  return (
    <>
      <Head>
        <title>Frequently Asked Questions | ShareMitra</title>
        <meta name="description" content="FAQs about ShareMitra engagement services." />
      </Head>

      <div className={`${dmSans.className} min-h-screen flex flex-col bg-gray-50 text-gray-900`}>
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="ShareMitra Logo" className="w-10 h-10 object-cover rounded-full" />
              <span className="text-2xl font-bold">ShareMitra</span>
            </Link>
            <Link href="/login">
              <Button size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12 flex-grow">
          <h1 className="text-4xl font-bold mb-6 text-center">Frequently Asked Questions</h1>

          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {loading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <AnimatePresence>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem
                      key={faq.faqId}
                      value={faq.faqId}
                      className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="flex justify-between items-center px-4 py-3">
                        <span className="text-lg font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-gray-700 whitespace-pre-line">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {faq.answer}
                        </motion.div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center text-gray-500">No FAQs found for "{searchTerm}".</div>
              )}
            </AnimatePresence>
          )}
        </main>

        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-6">
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
                  <li><Link href="/faqs" className="hover:underline">FAQ</Link></li>
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