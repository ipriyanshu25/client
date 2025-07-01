'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import {
  Play,
  Instagram,
  Heart,
  MessageCircle,
  Reply,
  CheckCircle,
  Shield,
  Users,
  ArrowRight,
  TrendingUp,
  Globe,
  User,
  LogOut,
  LogIn,
  Plus,
  Trash,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export default function Home() {
  const router = useRouter();
  const [client, setClient] = useState<{ name: { firstName: string; lastName: string }; email: string }>({ name: { firstName: '', lastName: '' }, email: '' });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) return;
    api
      .post<{ name: { firstName: string; lastName: string }; email: string }>(
        '/client/getById',
        { clientId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setClient(res.data))
      .catch(console.error);
  }, []);

  const isLoggedIn = Boolean(client.name.firstName);
  const fullName = isLoggedIn ? `${client.name.firstName} ${client.name.lastName}`.trim() : '';

  const goToCampaign = () => {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    router.push(token && clientId ? '/dashboard' : '/login');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('clientId');
    setClient({ name: { firstName: '', lastName: '' }, email: '' });
    router.refresh();
  };

  const submitPasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('clientId');
    if (!token || !clientId) return;
    try {
      await api.post(
        '/client/update',
        { clientId, ...passwords },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Password updated successfully.');
      setShowPwdForm(false);
      setPasswords({ oldPassword: '', newPassword: '' });
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update password.');
    }
  };

  const packages = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$29',
      features: ['1000 Likes', '50 Comments', '24h Delivery', 'Basic Support'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$79',
      features: ['5000 Likes', '200 Comments', '100 Replies', '12h Delivery', 'Priority Support'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$199',
      features: ['Unlimited Likes', '1000 Comments', '500 Replies', '6h Delivery', '24/7 Support', 'Custom Strategy'],
    },
  ];

  function handleStartCampaign(event: React.MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    goToCampaign();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      {/* HEADER */}
      <header className="relative z-50 border-b border-white/20 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src="/logo.png" alt="ShareMitra Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent animate-pulse">
              ShareMitra
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-white text-gray-800">
                    <User className="h-4 w-4" /> {fullName}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px] sm:w-[380px] flex flex-col bg-white">
                  <SheetHeader className="p-4">
                    <SheetTitle className="text-lg font-semibold">Profile</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-auto p-4 space-y-6">
                    <div>
                      <Label>Name</Label>
                      <Input disabled value={fullName} className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input disabled value={client.email} className="bg-gray-50" />
                    </div>
                    {!showPwdForm ? (
                      <Button onClick={() => setShowPwdForm(true)} className="w-full bg-emerald-600 text-white cursor-pointer">
                        Update Password
                      </Button>
                    ) : (
                      <form onSubmit={submitPasswordUpdate} className="space-y-4">
                        <div>
                          <Label>Old Password</Label>
                          <Input type="password" required value={passwords.oldPassword} onChange={e => setPasswords(prev => ({ ...prev, oldPassword: e.target.value }))} />
                        </div>
                        <div>
                          <Label>New Password</Label>
                          <Input type="password" required value={passwords.newPassword} onChange={e => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1 bg-emerald-600 text-white">Save</Button>
                          <Button variant="outline" className="flex-1" onClick={() => setShowPwdForm(false)}>Cancel</Button>
                        </div>
                      </form>
                    )}
                  </div>
                  <SheetFooter className="p-4">
                    <Button variant="destructive" onClick={logout} className="w-full bg-red-600 text-white cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white gap-2 cursor-pointer">
                  <LogIn className="h-4 w-4" /> Login
                </Button>
              </Link>
            )}

            <Link href="/services">
              <Button variant="outline" size="sm" className="bg-gradient-to-r from-emerald-600 to-pink-600 text-white gap-2 cursor-pointer">
                Services
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-green-600/10" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 lg:text-7xl">
              Boost Your Social Media
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {' '}Engagement
              </span>
            </h1>
            <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
              Get 100% real human likes, comments, and replies on YouTube and Instagram.
              Grow your audience with our premium engagement services.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={handleStartCampaign}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 text-lg"
              >
                Start Your Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive engagement solutions for your Social Media Handle
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Play className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl">YouTube Services</CardTitle>
                <CardDescription>Boost your YouTube videos with real engagement</CardDescription>
              </CardHeader>
              {/* Make this a flex‐column and center everything */}
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="flex justify-center items-center space-x-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>YouTube Likes</span>
                </div>
                <div className="flex justify-center items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-emerald-500" />
                  <span>YouTube Comments</span>
                </div>
                <div className="flex justify-center items-center space-x-3">
                  <Reply className="h-5 w-5 text-green-500" />
                  <span>Comment Replies</span>
                </div>
                <div className="flex justify-center items-center space-x-3">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span>Subscriber Growth</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Instagram className="h-8 w-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl">Instagram Services</CardTitle>
                <CardDescription>Increase your Instagram post engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Instagram Likes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                    <span>Instagram Comments</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Reply className="h-5 w-5 text-green-500" />
                    <span>Comment Replies</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <span>Follower Growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We pay to real peple to engage with your content.
              <br />
              Simple steps to boost your social media presence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Create Account</h3>
              <p className="text-gray-600">Sign up for your ShareMitra account and access your dashboard.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Choose Services</h3>
              <p className="text-gray-600">Select from our flexible services that suit your budget and engagement goals.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">24-Hr Watch It Grow</h3>
              <p className="text-gray-600">Sit back and watch your content receive real engagement from our network within 1–24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Service
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Flexible pricing options for every budget and goal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg, index) => (
              <Card key={pkg.id} className={`relative ${index === 1 ? 'ring-2 ring-emerald-500 scale-105' : ''} hover:shadow-xl transition-all`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</div>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-4xl font-bold text-emerald-600">{pkg.price}</div>
                  <CardDescription>per campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose ShareMitra?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">100% Safe & Secure</h3>
              <p className="text-gray-600">All our services are completely safe and comply with platform guidelines.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real Engagement</h3>
              <p className="text-gray-600">Get genuine likes, comments, and replies from real users worldwide.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <Globe className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Fast Delivery</h3>
              <p className="text-gray-600">Quick turnaround times with results starting within hours of your order.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Boost Your Social Media?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have grown their social
            media presence with our services.
          </p>

          <Button
            onClick={goToCampaign}
            size="lg"
            variant="secondary"
            className="px-8 py-4 text-lg"
          >
            Start Your Campaign
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="ShareMitra Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xl font-bold">ShareMitra</span>
              </div>
              <p className="text-gray-400">
                The #1 platform for social media engagement services.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>YouTube Promotion</li>
                <li>Instagram Growth</li>
                <li>Likes & Comments</li>
                <li>Custom Packages</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>FAQ</li>
                <li>Live Chat</li>
                <li>Email Support</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ShareMitra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}