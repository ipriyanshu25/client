'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
} from '@/components/ui/card';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export default function ContactPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const clientId = localStorage.getItem('clientId');
        setIsLoggedIn(!!token && !!clientId);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/contact/send', form);
            Swal.fire({
                icon: 'success',
                title: 'Message Sent',
                text: res.data.message || 'Your message has been sent successfully.',
                confirmButtonColor: '#10B981',
            }).then(() => router.push('/'));
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.error || err.message || 'Failed to send message.',
                confirmButtonColor: '#EF4444',
            });
        } finally {
            setLoading(false);
        }
    };

    const infoItems = [
        { label: 'Email', value: 'support@sharemitra.com' },
        { label: 'Phone', value: '+1 (800) 123-4567' },
        { label: 'Address', value: '123 Green St, Suite 100, San Francisco, CA' },
        { label: 'Hours', value: 'Mon–Fri: 9am – 6pm; Sat–Sun: Closed' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-100 to-emerald-50">
            {/* Site Header */}
            <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-3">
                        <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            ShareMitra
                        </span>
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
            </header>

            {/* Contact Info Box */}


            {/* Page Header */}
            <header className="py-12 bg-white/80 backdrop-blur-md border-b border-white/20">
                <motion.div
                    className="container mx-auto px-4 text-center"
                >
                    <h1 className="text-5xl font-extrabold text-emerald-700 mb-2">
                        Contact Us
                    </h1>
                    <p className="mt-2 text-gray-600 text-lg">
                        Have questions or feedback? Fill out the form below and we'll get back to you soon.
                    </p>
                </motion.div>
            </header>

            {/* Contact Form */}
            <section className="flex-grow bg-white py-16">
                <div className="container mx-auto px-4">
                    <Card className="max-w-2xl mx-auto shadow-lg p-6 rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-gray-900">
                                Send Us a Message
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <motion.form
                                onSubmit={handleSubmit}
                                className="space-y-6"
                                initial="hidden"
                                animate="visible"
                                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.2 } } }}
                            >
                                {['name', 'email', 'subject', 'message'].map((field, idx) => (
                                    <motion.div key={field} custom={idx} variants={{ hidden: { opacity: 0, y: 20 }, visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } }) }}>
                                        <Label htmlFor={field} className="text-gray-700">
                                            {field.charAt(0).toUpperCase() + field.slice(1)}
                                        </Label>
                                        {field !== 'message' ? (
                                            <Input
                                                id={field}
                                                name={field}
                                                type={field === 'email' ? 'email' : 'text'}
                                                value={(form as any)[field]}
                                                onChange={handleChange}
                                                placeholder={`Enter your ${field}`}
                                                required
                                                className="mt-2 shadow-sm focus:ring-2 focus:ring-emerald-400"
                                            />
                                        ) : (
                                            <textarea
                                                id="message"
                                                name="message"
                                                rows={6}
                                                value={form.message}
                                                onChange={handleChange}
                                                placeholder="How can we help?"
                                                required
                                                className="w-full mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm resize-none"
                                            />
                                        )}
                                    </motion.div>
                                ))}

                                <motion.div custom={4} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.4 } } }} className="flex justify-end space-x-4">
                                    <Link href="/">
                                        <Button variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-600 transition"
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </motion.div>
                            </motion.form>
                        </CardContent>
                    </Card>
                </div>
            </section>
            <section className="container mx-auto px-4 py-8">
                <Card className="max-w-3xl mx-auto shadow-lg p-6 rounded-2xl bg-white/90">
                    <CardHeader>
                        <CardTitle className="text-4xl font-extrabold text-emerald-700 mb-2">Get in Touch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-gray-700">
                            {infoItems.map(({ label, value }) => (
                                <p key={label}>
                                    <strong>{label}:</strong> {value}
                                </p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="container mx-auto px-4 text-center text-gray-400">
                    &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
