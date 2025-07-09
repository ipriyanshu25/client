"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import Swal, { SweetAlertOptions } from "sweetalert2";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  LogOut,
  Plus,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*                            API INSTANCE                            */
/* ------------------------------------------------------------------ */
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

/* ------------------------------------------------------------------ */
/*                              TYPES                                 */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*                              HELPERS                               */
/* ------------------------------------------------------------------ */
const toast = (opts: SweetAlertOptions) =>
  Swal.fire({
    ...opts,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

// human‐readable status text
function getStatusText(status: number) {
  return status === 1 ? "Completed" : "Pending";
}
// color class for badge
function getStatusClass(status: number) {
  return status === 1 ? "text-green-600" : "text-yellow-600";
}

/* ------------------------------------------------------------------ */
/*                               MAIN                                 */
/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const router = useRouter();

  /* ------------------------------ STATE ----------------------------- */
  const [client, setClient] = useState<ClientProfile>({
    name: { firstName: "", lastName: "" },
    email: "",
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  /* Password-update flow */
  const [showPassForm, setShowPassForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPass, setUpdatingPass] = useState(false);

  /* Campaigns + UI */
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  /* ----------------------------- EFFECTS ---------------------------- */
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
            "/campaign/getByClient",
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

  /* ---------------------------- HANDLERS ---------------------------- */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("clientId");
    router.push("/login");
  };

  const fullName = client.name.firstName
    ? `${client.name.firstName} ${client.name.lastName}`
    : "";
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN");

  /* -------------------------- PASSWORD FLOW ------------------------- */
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

  /* ----------------------------- SEARCH ----------------------------- */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.trim();
    setSearchQuery(q);
    if (q === "") {
      setFilteredCampaigns(campaigns);
      return;
    }
    if (/^\d+$/.test(q)) {
      const idx = parseInt(q, 10);
      const campaign = campaigns[idx - 1];
      setFilteredCampaigns(campaign ? [campaign] : []);
      return;
    }
    const filtered = campaigns.filter((c) =>
      c.serviceHeading.toLowerCase().includes(q.toLowerCase())
    );
    setFilteredCampaigns(filtered);
  };

  const toggleExpand = (id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const MAX_VISIBLE = 3;
  const totalCount = filteredCampaigns.length;

  /* ------------------------------------------------------------------ */
  /*                                JSX                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50">
      {/* --------------------------- HEADER --------------------------- */}
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
              ShareMitra
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {/* Profile Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white hover:bg-gray-100"
                >
                  <User className="w-5 h-5" /> {fullName || "Profile"}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white flex flex-col">
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

                  {/* ------------------ PASSWORD UPDATE FLOW ------------------ */}
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
            {/* Direct Logout button (mobile fallback) */}
            <Button
              variant="destructive"
              onClick={logout}
              className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------------------- MAIN ----------------------------- */}
      <main className="container mx-auto p-8 flex-1 w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900">
            Welcome Back, {fullName || "User"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your social media campaigns and track your growth.
          </p>
        </div>

        {/* ------------------ Campaign header (search, new) -------------- */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold">Your Campaigns</h2>

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
            <Button
              size="sm"
              className="cursor-default bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
            >
              Total: {totalCount}
            </Button>
            <Link href="/dashboard/addCampaign">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700">
                <Plus className="w-5 h-5" /> New Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* ------------------------- Campaign Cards --------------------- */}
        {loading ? (
          /* Loading skeleton... */
          <div>Loading...</div>
        ) : filteredCampaigns.length === 0 ? (
          <p className="text-center text-gray-500">No campaigns found.</p>
        ) : (
          <motion.div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
            {filteredCampaigns.map((c, idx) => {
              const isExpanded = expandedCampaigns.has(c.campaignId);
              const actionsToShow = isExpanded
                ? c.actions
                : c.actions.slice(0, MAX_VISIBLE);

              return (
                <motion.div key={c.campaignId} whileHover={{ scale: 1.02 }}>
                  <Card className="bg-white shadow hover:shadow-lg transition h-full flex flex-col">
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title */}
                        <h3 className="text-lg font-medium mb-1">
                          {idx + 1}. {c.serviceHeading}
                        </h3>

                       

                        {/* Link */}
                        <p className="truncate mb-4">
                          <span className="font-semibold">Link:</span>{" "}
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {c.link}
                          </a>
                        </p>

                        {/* Actions table */}
                        <table className="w-full mb-2 text-sm">
                          <thead>
                            <tr className="text-left text-gray-500">
                              <th className="px-2 py-1">Service</th>
                              <th className="px-2 py-1">Qty</th>
                              <th className="px-2 py-1">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {actionsToShow.map((a) => (
                              <tr key={a.contentId} className="border-t">
                                <td className="px-2 py-1">{a.contentKey}</td>
                                <td className="px-2 py-1">{a.quantity}</td>
                                <td className="px-2 py-1 font-semibold">
                                  ${a.totalCost}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Expand / collapse */}
                        {c.actions.length > MAX_VISIBLE && (
                          <Button
                            variant="link"
                            className="flex items-center gap-1 mb-4"
                            onClick={() => toggleExpand(c.campaignId)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" /> Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />{" "}
                                Show {c.actions.length - MAX_VISIBLE} More
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Footer: total & created date */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold">
                            Total: ${c.totalAmount}
                          </span>
                          <p className="text-sm mb-2">
                            Status:{" "}
                            <span className={getStatusClass(c.status)}>
                              {getStatusText(c.status)}
                            </span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          Created on {formatDate(c.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* --------------------------- FOOTER ----------------------------- */}
      <footer className="bg-gray-900 text-white pb-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} ShareMitra. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
