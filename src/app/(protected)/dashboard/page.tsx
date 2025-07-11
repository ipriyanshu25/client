"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Swal, { SweetAlertOptions } from "sweetalert2";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  LogOut,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Menu,
} from "lucide-react";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

interface ClientProfile {
  name: { firstName: string; lastName: string };
  email: string;
}

interface CampaignAction {
  contentId: string;
  contentKey: string;
  quantity: number;
  totalCost: number;
}

interface Campaign {
  campaignId: string;
  serviceHeading: string;
  link: string;
  actions: CampaignAction[];
  totalAmount: number;
  createdAt: string;
  status: number; // 0 = pending, 1 = completed
}

const toast = (opts: SweetAlertOptions) =>
  Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

function getStatusText(status: number) {
  return status === 1 ? "Completed" : "Pending";
}

export default function Dashboard() {
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile>({
    name: { firstName: "", lastName: "" },
    email: "",
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);           // Profile sheet
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile nav sheet
  const [showPassForm, setShowPassForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  useEffect(() => {
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("clientId");
    if (!token || !clientId) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const [profileRes, campaignRes] = await Promise.all([
          api.post<ClientProfile>(
            "/client/getById",
            { clientId },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          api.post<{ campaigns: Campaign[] }>(
            "/campaign/active",
            { clientId },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);
        setClient(profileRes.data);
        setCampaigns(campaignRes.data.campaigns || []);
        setFilteredCampaigns(campaignRes.data.campaigns || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("clientId");
    router.push("/login");
  };

  const fullName = client.name.firstName
    ? `${client.name.firstName} ${client.name.lastName}`
    : "";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPass(true);
    try {
      const token = localStorage.getItem("token");
      const clientId = localStorage.getItem("clientId");
      await api.post(
        "/client/update",
        { clientId, oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: "Success", text: "Password updated.", icon: "success" });
      setShowPassForm(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        text: err.response?.data?.message || "Password update failed.",
        icon: "error",
      });
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.trim();
    setSearchQuery(q);
    if (!q) {
      setFilteredCampaigns(campaigns);
      return;
    }
    if (/^\d+$/.test(q)) {
      const idx = parseInt(q, 10);
      const campaign = campaigns[idx - 1];
      setFilteredCampaigns(campaign ? [campaign] : []);
      return;
    }
    setFilteredCampaigns(
      campaigns.filter((c) =>
        c.serviceHeading.toLowerCase().includes(q.toLowerCase())
      )
    );
  };

  const downloadInvoice = async (
    campaignId: string,
    serviceHeading?: string
  ) => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.post(
        "/invoice/download",
        { campaignId },
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const raw = serviceHeading || "invoice";
      link.setAttribute("download", `invoice_${raw}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", text: "Failed to download invoice", icon: "error" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto px-4 sm:px-8 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 rounded-full"
            />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
              ShareMitra
            </span>
          </Link>

          {/* Desktop: Profile + Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white hover:bg-gray-100"
                  onClick={() => router.push('/dashboard')}
                >
                  <User className="w-5 h-5" /> {fullName || "Profile"}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 bg-white flex flex-col">
                <SheetHeader className="p-4">
                  <SheetTitle>Profile</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div>
                    <Label className="mb-1">Name</Label>
                    <Input disabled value={fullName} className="bg-gray-50" />
                  </div>
                  <div>
                    <Label className="mb-1">Email</Label>
                    <Input disabled value={client.email} className="bg-gray-50" />
                  </div>
                  {!showPassForm ? (
                    <Button
                      onClick={() => setShowPassForm(true)}
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
                          disabled={updatingPass}
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {updatingPass ? "Updating…" : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-red-600 text-white hover:bg-red-700"
                          onClick={() => {
                            setShowPassForm(false);
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
                    className="w-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" /> Logout
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Button
              variant="destructive"
              onClick={logout}
              className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Logout
            </Button>
          </div>

          {/* Mobile: Hamburger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white flex flex-col">
                <SheetHeader className="p-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex-1 p-4 space-y-4">
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-green-500"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSheetOpen(true);
                    }}
                  >
                    <User className="w-5 h-5 mr-2 " /> Profile
                  </Button>
                  <Button
                    variant="destructive"
                    className=" w-full bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Welcome Back, {fullName || "User"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your social media campaigns and track your growth.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold">Active Campaigns</h2>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            {showSearch && (
              <Input
                type="text"
                placeholder="Search by name or index…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="max-w-xs"
              />
            )}
            <Button
              size="sm"
              onClick={() => setShowSearch((prev) => !prev)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button size="sm" className="cursor-default bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700">
              Total: {filteredCampaigns.length}
            </Button>
            <Link href="/dashboard/previouscampaign">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700">
                Previous Campaigns
              </Button>
            </Link>
            <Link href="/dashboard/addCampaign">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700">
                <Plus className="w-5 h-5" /> New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : filteredCampaigns.length === 0 ? (
          <p className="text-center text-gray-500">No campaigns found.</p>
        ) : (
          <>  {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead className="bg-emerald-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-center">S.No</th>
                    <th className="py-3 px-6 text-center">Service</th>
                    <th className="py-3 px-6 text-center">Link</th>
                    <th className="py-3 px-6 text-center">Services</th>
                    <th className="py-3 px-6 text-center">Total ($)</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-center">Created On</th>
                    <th className="py-3 px-6 text-center">Invoice</th>
                    <th className="py-3 px-6 text-center">Expand</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c, idx) => (
                    <React.Fragment key={c.campaignId}>
                      <tr className="border-b hover:bg-gray-50 text-center">
                        <td className="py-4 px-6">{idx + 1}</td>
                        <td className="py-4 px-6">{c.serviceHeading}</td>
                        <td className="py-4 px-6 truncate max-w-xs">
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {c.link}
                          </a>
                        </td>
                        <td className="py-4 px-6">{c.actions.length}</td>
                        <td className="py-4 px-6 text-center">
                          ${c.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={
                              c.status === 1
                                ? "text-green-600 font-medium"
                                : "text-yellow-600 font-medium"
                            }
                          >
                            {getStatusText(c.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6">{formatDate(c.createdAt)}</td>
                        <td className="py-4 px-6 text-center flex justify-center">
                          <Button
                            size="sm"
                            onClick={() => downloadInvoice(c.campaignId, c.serviceHeading)}
                            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                          >
                            <Download className="w-4 h-4" /> Invoice
                          </Button>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => toggleExpand(c.campaignId)}
                            className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 text-blue-600"
                          >
                            {expandedId === c.campaignId ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>

                      {expandedId === c.campaignId && (
                        <tr>
                          <td colSpan={9} className="bg-gray-50 px-6 py-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500">
                                    <th className="py-2">Action</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Total ($)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.actions.map((a) => (
                                    <tr
                                      key={`${c.campaignId}-${a.contentId}`} 
                                      className="border-t"
                                    >
                                      <td className="py-2">{a.contentKey}</td>
                                      <td className="py-2 text-center">{a.quantity}</td>
                                      <td className="py-2 text-right">${a.totalCost}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden grid gap-4">
              {filteredCampaigns.map((c, idx) => (
                <div key={c.campaignId} className="bg-white shadow rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{idx + 1}. {c.serviceHeading}</h3>
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {c.link}
                      </a>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => toggleExpand(c.campaignId)}
                      className="h-8 w-8 p-0 text-blue-600"
                    >
                      {expandedId === c.campaignId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Items: {c.actions.length}</p>
                    <p>Total: ${c.totalAmount.toFixed(2)}</p>
                    <p>Status: <span className={c.status===1?"text-green-600":"text-yellow-600"}>{getStatusText(c.status)}</span></p>
                    <p>Created: {formatDate(c.createdAt)}</p>
                  </div>
                  {expandedId === c.campaignId && (
                    <div className="mt-2 border-t pt-2 text-sm">
                      {c.actions.map(a => (
                        <div key={`${c.campaignId}-${a.contentId}`} className="flex justify-between">
                          <span>{a.contentKey} x{a.quantity}</span>
                          <span>${a.totalCost}</span>
                        </div>
                      ))}
                      <div className="mt-2">
                        <Button
                          size="sm"
                          onClick={() => downloadInvoice(c.campaignId, c.serviceHeading)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 mt-2"
                        >
                          <Download className="w-4 h-4" /> Invoice
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-900 text-white pb-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
