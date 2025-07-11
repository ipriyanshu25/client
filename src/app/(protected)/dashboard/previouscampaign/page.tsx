"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Swal, { SweetAlertOptions } from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, ChevronDown, ChevronUp, Download } from "lucide-react";

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

export default function PreviousCampaigns() {
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile>({
    name: { firstName: "", lastName: "" },
    email: "",
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filtered, setFiltered] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  useEffect(() => {
    const token = localStorage.getItem("token");
    const clientId = localStorage.getItem("clientId");
    if (!token || !clientId) return router.push("/login");

    (async () => {
      try {
        const [profileRes, prevRes] = await Promise.all([
          api.post<ClientProfile>(
            "/client/getById",
            { clientId },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          api.post<{ campaigns: Campaign[] }>(
            "/campaign/previous",
            { clientId },
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);
        setClient(profileRes.data);
        const cams = prevRes.data.campaigns || [];
        setCampaigns(cams);
        setFiltered(cams);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const fullName = client.name.firstName
    ? `${client.name.firstName} ${client.name.lastName}`
    : "";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.trim();
    setSearchQuery(q);
    if (!q) return setFiltered(campaigns);

    if (/^\d+$/.test(q)) {
      const idx = parseInt(q, 10) - 1;
      return setFiltered(campaigns[idx] ? [campaigns[idx]] : []);
    }

    setFiltered(
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("clientId");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap sm:flex-nowrap justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 mb-2 sm:mb-0">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            />
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
              ShareMitra
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-base sm:text-lg font-medium">{fullName}</span>
            <Button
              variant="destructive"
              onClick={logout}
              className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> Logout
            </Button>
          </div>
          
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900">
            Welcome Back, {fullName || "User"}!
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Manage your social media campaigns and track your growth.
          </p>
        </div>

        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold">Previous Campaigns</h2>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {showSearch && (
              <Input
                type="text"
                placeholder="Search by name or index…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="max-w-xs text-sm sm:text-base"
              />
            )}
            <Button
              size="sm"
              onClick={() => setShowSearch((prev) => !prev)}
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 text-xs sm:text-sm"
            >
              Search
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs sm:text-sm"
            >
              Total: {filtered.length}
            </Button>
            <Link href="/dashboard">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs sm:text-sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">No completed campaigns.</p>
        ) : (
          <>            
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead className="bg-emerald-600 text-white">
                  <tr>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">S.No</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Service</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Link</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Actions</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Total ($)</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Status</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Completed On</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Invoice</th>
                    <th className="py-3 px-4 text-center text-xs sm:text-sm">Expand</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <React.Fragment key={c.campaignId}>
                      <tr className="border-b hover:bg-gray-50 text-center">
                        <td className="py-3 px-4 text-xs sm:text-sm">{i + 1}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm">{c.serviceHeading}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm truncate max-w-xs">
                          <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {c.link}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-xs sm:text-sm">{c.actions.length}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm">${c.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm">
                          <span className="text-green-600 font-medium">
                            {getStatusText(c.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs sm:text-sm">{formatDate(c.createdAt)}</td>
                        <td className="py-3 px-4 text-xs sm:text-sm flex justify-center">
                          <Button
                            size="sm"
                            onClick={() => downloadInvoice(c.campaignId, c.serviceHeading)}
                            className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm justify-items: center"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" /> Invoice
                          </Button>
                        </td>
                        <td className="py-3 px-4 text-xs sm:text-sm">
                          <Button size="icon" variant="outline" onClick={() => toggleExpand(c.campaignId)}>
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
                          <td colSpan={9} className="bg-gray-50 px-4 py-3">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500 text-xs sm:text-sm">
                                    <th className="py-2">Action</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Total ($)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.actions.map((a) => (
                                    <tr key={`${c.campaignId}-${a.contentId}`} className="border-t">
                                      <td className="py-2 text-xs sm:text-sm">{a.contentKey}</td>
                                      <td className="py-2 text-center text-xs sm:text-sm">{a.quantity}</td>
                                      <td className="py-2 text-right text-xs sm:text-sm">${a.totalCost}</td>
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
            <div className="sm:hidden space-y-4">
              {filtered.map((c, i) => {
                const isOpen = expandedId === c.campaignId;
                return (
                  <div key={c.campaignId} className="bg-white shadow-md rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-semibold truncate">{c.serviceHeading}</h3>
                      <span className="text-sm font-medium text-green-600">{getStatusText(c.status)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1"><strong>S.No:</strong> {i+1}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate"><strong>Link:</strong> <a href={c.link} target="_blank" rel="noreferrer" className="underline text-green-600 truncate block max-w-full">{c.link}</a></p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1"><strong>Services:</strong> {c.actions.length}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1"><strong>Total:</strong> ${c.totalAmount.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1"><strong>Date:</strong> {formatDate(c.createdAt)}</p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => downloadInvoice(c.campaignId, c.serviceHeading)}
                        className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-700 text-xs sm:text-sm"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" /> Invoice
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => toggleExpand(c.campaignId)}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                    {isOpen && (
                      <div className="mt-3 border-t pt-2">
                        {c.actions.map((a) => (
                          <div key={`${c.campaignId}-${a.contentId}`} className="flex justify-between text-xs sm:text-sm text-gray-700 py-1">
                            <span>{a.contentKey}</span>
                            <span className="font-medium">x{a.quantity}</span>
                            <span>${a.totalCost}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <footer className="bg-gray-900 text-white pb-6 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-800 pt-4 text-center text-gray-400 text-xs sm:text-sm">
            © {new Date().getFullYear()} ShareMitra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
