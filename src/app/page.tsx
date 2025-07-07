"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Swal, { SweetAlertOptions } from "sweetalert2";
import {
  Play,
  Instagram,
  CheckCircle,
  Globe,
  User,
  LogOut,
  LogIn,
  ArrowRight,
  Shield,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Ensure we never end up with `baseURL: undefined`
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  : "";
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface ServiceContent {
  contentId?: string;
  key: string;
  value: string;
}

interface Service {
  serviceId: string;
  serviceHeading: string;
  serviceDescription: string;
  serviceContent: ServiceContent[];
  logo?: string; // Base64 without data prefix
}

export default function Home() {
  const router = useRouter();

  const [client, setClient] = useState<{
    name: { firstName: string; lastName: string };
    email: string;
  }>({
    name: { firstName: "", lastName: "" },
    email: "",
  });
  const [services, setServices] = useState<Service[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Password update states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // helper for auto-close toasts
  const toast = (opts: SweetAlertOptions) =>
    Swal.fire({
      ...opts,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });

  // fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("clientId");
    if (!token || !clientId) return;

    api
      .post<{
        name: { firstName: string; lastName: string };
        email: string;
      }>("/client/getById", { clientId }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setClient(res.data))
      .catch(console.error);
  }, []);

  // fetch first page of services
  useEffect(() => {
    api
      .get<{ data: Service[] }>("/service/getAll?page=1&limit=4")
      .then((res) => setServices(res.data.data))
      .catch(console.error);
  }, []);

  const isLoggedIn = Boolean(client.name.firstName);
  const fullName = isLoggedIn
    ? `${client.name.firstName} ${client.name.lastName}`.trim()
    : "";

  const goToCampaign = () => {
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("clientId");
    router.push(token && clientId ? "/dashboard" : "/login");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("clientId");
    setClient({ name: { firstName: "", lastName: "" }, email: "" });
    router.refresh();
  };

  // Handle Password update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setIsUpdatingPassword(true);

    try {
      const token = localStorage.getItem("token");
      const clientId = localStorage.getItem("clientId");
      await api.post(
        "/client/update",
        { clientId, oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Success",
        text: "Password updated successfully.",
        icon: "success",
      });
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        text: err.response?.data?.message || "Password update failed.",
        icon: "error",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Render logo or icon
  const renderIconOrLogo = (svc: Service) => {
    if (svc.logo) {
      const src = svc.logo.startsWith("data:")
        ? svc.logo
        : `data:image/png;base64,${svc.logo}`;
      return (
        <img
          src={src}
          alt={svc.serviceHeading}
          className="w-16 h-16 rounded-full object-cover"
        />
      );
    }
    const h = svc.serviceHeading.toLowerCase();
    if (h.includes("youtube")) return <Play className="h-8 w-8 text-red-600" />;
    if (h.includes("instagram"))
      return <Instagram className="h-8 w-8 text-pink-600" />;
    return <Globe className="h-8 w-8 text-emerald-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 ">
      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          {/* Logo + brand */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <img
                src="/logo.png"
                alt="ShareMitra Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-2xl font-bold text-transparent">
              ShareMitra
            </span>
          </Link>

          {/* Right-hand group */}
          <div className="flex items-center space-x-3">
            {/* Desktop nav */}
            <nav className="flex items-center space-x-4">
              <Link href="/services">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Services
                </Button>
              </Link>
              {!isLoggedIn && (
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 cursor-pointer"
                  >
                    <LogIn className="h-4 w-4" /> Login
                  </Button>
                </Link>
              )}
              <Link href="/about" className="text-gray-700 hover:text-emerald-600">
                About Us
              </Link>
              <Link
                href="/contactus"
                className="text-gray-700 hover:text-emerald-600"
              >
                Contact Us
              </Link>
            </nav>

            {/* Profile / Login */}
            {isLoggedIn ? (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-white text-gray-800 hover:bg-gray-100"
                    aria-label="User Menu"
                  >
                    <User className="h-4 w-4" /> {fullName}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex w-[320px] flex-col bg-white sm:w-[380px]"
                >
                  <SheetHeader className="p-4">
                    <SheetTitle className="text-lg font-semibold">Profile</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 space-y-4 overflow-auto p-4">
                    <div>
                      <Label className="mb-1">Name</Label>
                      <Input disabled value={fullName} className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="mb-1">Email</Label>
                      <Input disabled value={client.email} className="bg-gray-50" />
                    </div>

                    {!showPasswordForm ? (
                      <Button
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Update Password
                      </Button>
                    ) : (
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                          <Label className="mb-1">Old Password</Label>
                          <Input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="mb-1">New Password</Label>
                          <Input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isUpdatingPassword ? "Updating…" : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-red-600 text-white hover:bg-red-700"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setOldPassword("");
                              setNewPassword("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                  <SheetFooter className="p-4">
                    <Button
                      variant="destructive"
                      onClick={logout}
                      className="w-full bg-red-600 text-white hover:bg-red-700 cursor-pointer "
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ) : null}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-green-600/10" />
        <div className="container relative mx-auto px-4">
          <h1 className="mb-6 text-5xl font-bold text-gray-900 lg:text-7xl">
            Boost Your Social Media{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Engagement
            </span>
          </h1>
          <p className="mb-8 text-xl text-gray-600 lg:text-2xl">
            Get 100% real human likes, comments, and replies on YouTube and
            Instagram. Grow your audience with our premium engagement services.
          </p>
          <Button
            size="lg"
            onClick={goToCampaign}
            className="bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-4 text-lg text-white hover:from-emerald-700 hover:to-green-700 cursor-pointer"
          >
            Start Your Campaign
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive engagement solutions for your Social Media Handle
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map((service) => (
              <Card
                key={service.serviceId}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl"
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 flex items-center justify-center rounded-full group-hover:bg-emerald-200 transition-colors">
                    {renderIconOrLogo(service)}
                  </div>
                  <CardTitle className="text-2xl font-semibold text-gray-900">
                    {service.serviceHeading}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.serviceDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-3">
                  {service.serviceContent.map((item) => (
                    <div
                      key={item.contentId || item.key}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>
                        {item.key}: ${item.value}
                      </span>
                    </div>
                  ))}
                  <div className="mt-4">
                    <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                      <Button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 cursor-pointer">
                        Create Campaign
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-md px-6 py-3 text-white hover:from-emerald-700 hover:to-green-700 cursor-pointer"
              >
                View More Services
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* How It Works */}
      < section className="py-20 bg-gradient-to-r from-emerald-50 to-green-50" >
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
      </section >

      {/* Features */}
      < section className="py-20 bg-gray-50" >
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
      </section >

      {/* CTA Section */}
      < section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600" >
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
            className="px-8 py-4 text-lg cursor-pointer bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white"
          >
            Start Your Campaign
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section >


      {/* Footer */}
      < footer className="bg-gray-900 text-white py-12" >
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
                <li className='cursor-pointer' onClick={() => router.push('/dashboard')}>YouTube Promotion</li>
                <li className='cursor-pointer' onClick={() => router.push('/dashboard')}>Instagram Growth</li>
                <li className='cursor-pointer' onClick={() => router.push('/dashboard')}>Likes & Comments</li>
                <li className='cursor-pointer' onClick={() => router.push('/dashboard')}>Custom Packages</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 ">
                <li className='cursor-pointer' onClick={() => router.push('/about')}>About Us</li>
                <li className='cursor-pointer' onClick={() => router.push('/contactus')}>Contact</li>
                <li className='cursor-pointer' onClick={() => router.push('/faqs')}>FAQ</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Useful Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li className='cursor-pointer' onClick={() => router.push('/usefullLinks/termofuse')}>Terms of Use</li>
                <li className='cursor-pointer' onClick={() => router.push('/usefullLinks/shiping')}>Shipping & Delivery Policy</li>
                <li className='cursor-pointer' onClick={() => router.push('/usefullLinks/privacypolicy')}>Privacy Policy</li>
                <li className='cursor-pointer' onClick={() => router.push('/usefullLinks/returnpolicy')}>Returns Policy</li>
                <li className='cursor-pointer' onClick={() => router.push('/usefullLinks/cookiepolicy')}>Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ShareMitra. All rights reserved.</p>
          </div>
        </div>
      </footer >
    </div >
  );
}

