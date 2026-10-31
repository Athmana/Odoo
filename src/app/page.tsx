"use client";

import React, { useEffect, useState, useCallback } from "react";
import AuthView from "@/components/AuthView";
import InvoicePrintModal, { PrintableInvoiceData } from "@/components/InvoicePrintModal";
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  Repeat,
  FileText,
  Percent,
  Tag,
  CreditCard,
  Users,
  LogOut,
  Plus,
  Play,
  Printer,
  Send,
  CheckCircle2,
  PauseCircle,
  XCircle,
  RefreshCw,
  Zap,
  AlertTriangle,
  TrendingUp,
  Search,
  Shield,
  UserCheck,
  Building2,
  Layers,
  ArrowUpRight,
  Clock,
  Sparkles,
} from "lucide-react";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  company?: string;
}

type TabKey =
  | "DASHBOARD"
  | "SUBSCRIPTIONS"
  | "INVOICES"
  | "PAYMENTS"
  | "PRODUCTS"
  | "PLANS"
  | "TAXES"
  | "DISCOUNTS"
  | "USERS";

export default function BrightloopPlatform() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("DASHBOARD");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Data states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subTotalCount, setSubTotalCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoices, setInvoices] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payments, setPayments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [taxes, setTaxes] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [discounts, setDiscounts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [usersList, setUsersList] = useState<any[]>([]);

  // Filters
  const [subStatusFilter, setSubStatusFilter] = useState("ALL");
  const [subSearch, setSubSearch] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState("ALL");

  // Modals
  const [printInvoice, setPrintInvoice] = useState<PrintableInvoiceData | null>(null);
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<{
    id: string;
    invoiceNumber: string;
    balance: number;
  } | null>(null);

  // Forms
  const [newSubForm, setNewSubForm] = useState({
    customerId: "",
    planId: "",
    productId: "",
    variantId: "",
    quantity: 2,
    status: "QUOTATION",
    notes: "",
  });

  const [payForm, setPayForm] = useState({
    amount: "",
    method: "CARD",
    reference: "",
    notes: "",
  });

  const [newProductForm, setNewProductForm] = useState({
    name: "",
    sku: "",
    type: "SAAS",
    basePrice: "59",
    costPrice: "15",
    description: "",
    variantName: "Enterprise Seat Tier",
    variantSku: "",
    variantPriceDelta: "30",
  });

  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    code: "",
    interval: "MONTHLY",
    intervalCount: "1",
    priceMultiplier: "1.0",
    description: "",
  });

  const [newTaxForm, setNewTaxForm] = useState({
    name: "",
    code: "",
    rate: "18",
    region: "India / Global",
    isDefault: false,
  });

  const [newDiscountForm, setNewDiscountForm] = useState({
    code: "",
    name: "",
    type: "PERCENTAGE",
    value: "15",
    minPurchaseAmount: "100",
    minQuantity: "1",
    maxUsageLimit: "100",
    endDate: "2027-03-31",
  });

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "Brightloop@123",
    role: "STAFF",
    company: "Brightloop Operations",
    phone: "",
  });

  const [loadingAction, setLoadingAction] = useState(false);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const checkSession = useCallback(async () => {
    setAuthChecking(true);
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [repRes, subRes, invRes, payRes, prodRes, planRes, taxRes, discRes] =
        await Promise.all([
          fetch("/api/reports"),
          fetch(`/api/subscriptions?status=${subStatusFilter}&search=${encodeURIComponent(subSearch)}`),
          fetch(`/api/invoices?status=${invStatusFilter}`),
          fetch("/api/payments"),
          fetch("/api/products"),
          fetch("/api/plans"),
          fetch("/api/taxes"),
          fetch("/api/discounts"),
        ]);

      if (repRes.ok) setReportData(await repRes.json());
      if (subRes.ok) {
        const sd = await subRes.json();
        setSubscriptions(sd.subscriptions || []);
        setSubTotalCount(sd.totalCount || 0);
      }
      if (invRes.ok) {
        const id = await invRes.json();
        setInvoices(id.invoices || []);
      }
      if (payRes.ok) {
        const pd = await payRes.json();
        setPayments(pd.payments || []);
      }
      if (prodRes.ok) {
        const prd = await prodRes.json();
        setProducts(prd.products || []);
      }
      if (planRes.ok) {
        const pld = await planRes.json();
        setPlans(pld.plans || []);
      }
      if (taxRes.ok) {
        const td = await taxRes.json();
        setTaxes(td.taxes || []);
      }
      if (discRes.ok) {
        const dd = await discRes.json();
        setDiscounts(dd.discounts || []);
      }

      if (user.role === "ADMIN" || user.role === "STAFF") {
        const uRes = await fetch("/api/users");
        if (uRes.ok) {
          const ud = await uRes.json();
          setUsersList(ud.users || []);
        }
      }
    } catch (e) {
      console.error("Failed loading data:", e);
    }
  }, [user, subStatusFilter, subSearch, invStatusFilter]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  useEffect(() => {
    if (products.length > 0 && !newSubForm.productId) {
      setNewSubForm((prev) => ({
        ...prev,
        productId: products[0].id,
        variantId: products[0].variants?.[0]?.id || "",
      }));
    }
    if (plans.length > 0 && !newSubForm.planId) {
      setNewSubForm((prev) => ({ ...prev, planId: plans[0].id }));
    }
    const firstCust = usersList.find((u) => u.role === "CUSTOMER");
    if (firstCust && !newSubForm.customerId) {
      setNewSubForm((prev) => ({ ...prev, customerId: firstCust.id }));
    }
  }, [products, plans, usersList, newSubForm.productId, newSubForm.planId, newSubForm.customerId]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setActiveTab("DASHBOARD");
  };

  const handleRunAutomatedBilling = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_BILLING" }),
      });
      const data = await res.json();
      if (res.ok) {
        const s = data.summary;
        notify(
          `Billing cycle complete: ${s.generatedInvoices} due invoice(s) generated, ${s.skippedDuplicates} duplicate(s) prevented.`,
          "success"
        );
        await loadAllData();
      } else {
        notify(data.error || "Failed to run billing", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSeedBenchmark = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/seed-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1000 }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(
          `Generated ${data.inserted.toLocaleString()} enterprise subscriptions in ${data.elapsedMs}ms (Total: ${data.totalSubscriptions.toLocaleString()}).`,
          "success"
        );
        await loadAllData();
      } else {
        notify(data.error || "Load simulation failed", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSubscriptionAction = async (id: string, action: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Subscription updated (${action.replace("_", " ")})`, "success");
        await loadAllData();
      } else {
        notify(data.error || "Failed to update subscription", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.role === "CUSTOMER" ? user.id : newSubForm.customerId,
          planId: newSubForm.planId,
          status: user?.role === "CUSTOMER" ? "CONFIRMED" : newSubForm.status,
          notes: newSubForm.notes,
          items: [
            {
              productId: newSubForm.productId,
              variantId: newSubForm.variantId || null,
              quantity: Number(newSubForm.quantity || 1),
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(
          `Subscription ${data.subscription.code} created with automatic tax and discount calculation.`,
          "success"
        );
        setShowNewSubModal(false);
        await loadAllData();
      } else {
        notify(data.error || "Failed to create subscription", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleInvoiceAction = async (id: string, action: "CONFIRM" | "SEND") => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        notify(
          action === "SEND"
            ? "Invoice confirmed & dispatched to customer email."
            : "Invoice status updated to CONFIRMED.",
          "success"
        );
        await loadAllData();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    setLoadingAction(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: showPayModal.id,
          amount: Number(payForm.amount),
          method: payForm.method,
          reference: payForm.reference,
          notes: payForm.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(
          `Payment ${data.payment.paymentNumber} recorded and reconciled with ${showPayModal.invoiceNumber}.`,
          "success"
        );
        setShowPayModal(null);
        await loadAllData();
      } else {
        notify(data.error || "Payment failed", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const variants = newProductForm.variantName
        ? [
            {
              name: newProductForm.variantName,
              sku: newProductForm.variantSku || `${newProductForm.sku}-VAR1`,
              priceDelta: Number(newProductForm.variantPriceDelta || 0),
              costDelta: 5,
            },
          ]
        : [];

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductForm.name,
          sku: newProductForm.sku,
          type: newProductForm.type,
          basePrice: Number(newProductForm.basePrice),
          costPrice: Number(newProductForm.costPrice),
          description: newProductForm.description,
          variants,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Product "${data.product.name}" added to catalog.`, "success");
        setNewProductForm({
          name: "",
          sku: "",
          type: "SAAS",
          basePrice: "59",
          costPrice: "15",
          description: "",
          variantName: "Enterprise Seat Tier",
          variantSku: "",
          variantPriceDelta: "30",
        });
        await loadAllData();
      } else {
        notify(data.error || "Failed to create product", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlanForm),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Plan "${data.plan.name}" (${data.plan.interval}) created.`, "success");
        setNewPlanForm({
          name: "",
          code: "",
          interval: "MONTHLY",
          intervalCount: "1",
          priceMultiplier: "1.0",
          description: "",
        });
        await loadAllData();
      } else {
        notify(data.error || "Failed to create plan", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch("/api/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaxForm),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Tax rule "${data.tax.name}" (${data.tax.rate}%) saved.`, "success");
        setNewTaxForm({
          name: "",
          code: "",
          rate: "18",
          region: "Global",
          isDefault: false,
        });
        await loadAllData();
      } else {
        notify(data.error || "Failed to create tax rule", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDiscountForm),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Discount rule "${data.discount.code}" created and active.`, "success");
        setNewDiscountForm({
          code: "",
          name: "",
          type: "PERCENTAGE",
          value: "15",
          minPurchaseAmount: "100",
          minQuantity: "1",
          maxUsageLimit: "100",
          endDate: "2027-03-31",
        });
        await loadAllData();
      } else {
        notify(data.error || "Failed to create discount", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (res.ok) {
        notify(
          `Created ${data.user.role} account for ${data.user.name} (${data.user.email}).`,
          "success"
        );
        setNewUserForm({
          name: "",
          email: "",
          password: "Brightloop@123",
          role: user?.role === "ADMIN" ? "STAFF" : "CUSTOMER",
          company: "",
          phone: "",
        });
        await loadAllData();
      } else {
        notify(data.error || "Failed to create user", "error");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070B19] flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/30">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-medium tracking-wider uppercase text-slate-400">
          Initializing Brightloop Cloud...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthView onSuccess={checkSession} />;
  }

  const navItems: Array<{
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    roles: Array<"ADMIN" | "STAFF" | "CUSTOMER">;
  }> = [
    {
      key: "DASHBOARD",
      label:
        user.role === "ADMIN"
          ? "Executive Overview"
          : user.role === "STAFF"
          ? "Operations Overview"
          : "Portal Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ["ADMIN", "STAFF", "CUSTOMER"],
    },
    {
      key: "SUBSCRIPTIONS",
      label: user.role === "CUSTOMER" ? "My Subscriptions" : "Subscriptions & Quotes",
      icon: <Repeat className="w-4 h-4" />,
      roles: ["ADMIN", "STAFF", "CUSTOMER"],
    },
    {
      key: "INVOICES",
      label: user.role === "CUSTOMER" ? "My Invoices" : "Invoices & Billing",
      icon: <FileText className="w-4 h-4" />,
      roles: ["ADMIN", "STAFF", "CUSTOMER"],
    },
    {
      key: "PAYMENTS",
      label: user.role === "CUSTOMER" ? "Payment History" : "Payment Reconciliation",
      icon: <CreditCard className="w-4 h-4" />,
      roles: ["ADMIN", "STAFF", "CUSTOMER"],
    },
    {
      key: "PRODUCTS",
      label: "Product Catalog",
      icon: <Package className="w-4 h-4" />,
      roles: ["ADMIN"],
    },
    {
      key: "PLANS",
      label: "Recurring Plans",
      icon: <CalendarClock className="w-4 h-4" />,
      roles: ["ADMIN"],
    },
    {
      key: "TAXES",
      label: "Tax Configuration",
      icon: <Percent className="w-4 h-4" />,
      roles: ["ADMIN"],
    },
    {
      key: "DISCOUNTS",
      label: "Discount Rules",
      icon: <Tag className="w-4 h-4" />,
      roles: ["ADMIN"],
    },
    {
      key: "USERS",
      label: user.role === "ADMIN" ? "Team & Customers" : "Customer Directory",
      icon: <Users className="w-4 h-4" />,
      roles: ["ADMIN", "STAFF"],
    },
  ];

  const allowedNav = navItems.filter((n) => n.roles.includes(user.role));
  const selectedProductObj = products.find((p) => p.id === newSubForm.productId);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
      QUOTATION: "bg-amber-50 text-amber-700 border-amber-200/80",
      CONFIRMED: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      PAUSED: "bg-orange-50 text-orange-700 border-orange-200/80",
      CLOSED: "bg-rose-50 text-rose-700 border-rose-200/80",
      PAID: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    };
    const dotMap: Record<string, string> = {
      DRAFT: "bg-slate-400",
      QUOTATION: "bg-amber-500",
      CONFIRMED: "bg-indigo-500",
      ACTIVE: "bg-emerald-500",
      PAUSED: "bg-orange-500",
      CLOSED: "bg-rose-500",
      PAID: "bg-emerald-500",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
          map[status] || "bg-slate-100 text-slate-700"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status] || "bg-slate-400"}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F6FB] text-slate-900">
      {/* Modern Dark Sidebar */}
      <aside className="no-print w-full lg:w-68 bg-[#090D1A] text-slate-100 flex flex-col justify-between shrink-0 border-r border-slate-800/80">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-tight text-white leading-none">
                  Brightloop
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-1">
                  Billing Platform
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                user.role === "ADMIN"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : user.role === "STAFF"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {user.role}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="px-4 pt-5 pb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-2">
              Workspace Menu
            </div>
            <nav className="space-y-1">
              {allowedNav.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Footer Card */}
        <div className="p-4 border-t border-white/[0.07] space-y-3">
          <div className="bg-white/[0.04] rounded-2xl p-3.5 border border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            {reportData?.metrics?.queryTimeMs !== undefined && (
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Query Speed
                </span>
                <span className="font-mono font-bold">{reportData.metrics.queryTimeMs}ms</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 border border-transparent text-slate-300 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Top Hero Banner */}
        <div className="no-print relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 mb-8 shadow-xl border border-slate-800">
          <div className="pointer-events-none absolute -right-20 -top-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-[11px] font-semibold mb-3">
                {user.role === "ADMIN" && <Shield className="w-3.5 h-3.5 text-indigo-300" />}
                {user.role === "STAFF" && <UserCheck className="w-3.5 h-3.5 text-emerald-300" />}
                {user.role === "CUSTOMER" && <Building2 className="w-3.5 h-3.5 text-amber-300" />}
                <span>
                  {user.role === "ADMIN"
                    ? "Administrator Control Center"
                    : user.role === "STAFF"
                    ? "Operations & Billing Workspace"
                    : "Customer Self-Service Portal"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {user.role === "ADMIN"
                  ? "Subscription & Revenue Intelligence"
                  : user.role === "STAFF"
                  ? "Customer Subscriptions & Billing Operations"
                  : `Welcome back, ${user.name.split(" ")[0]}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-1.5 max-w-2xl">
                {user.role === "ADMIN"
                  ? "Monitor recurring revenue, configure products & multi-interval billing plans, automate tax & discount rules, and oversee all customer accounts."
                  : user.role === "STAFF"
                  ? "Create quotations, transition active subscriptions, generate recurring invoices, and reconcile incoming customer payments."
                  : "Manage your active plans, review upcoming billing dates, settle invoices online, and download official tax receipts."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {(user.role === "ADMIN" || user.role === "STAFF") && (
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleRunAutomatedBilling}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Billing Cycle
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNewSubModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 text-slate-900 text-xs font-extrabold shadow-lg transition"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                {user.role === "CUSTOMER" ? "New Subscription" : "New Quotation / Subscription"}
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2
                className={`w-4 h-4 ${
                  toast.type === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
              />
              <span>{toast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-700 font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD & REPORTS */}
        {activeTab === "DASHBOARD" && reportData && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {user.role === "CUSTOMER" ? "Total Paid" : "Collected Revenue"}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                  ${reportData.metrics.collectedRevenue.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-2">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{reportData.metrics.paidInvoiceCount} settled invoice(s)</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active Subscriptions
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Repeat className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                  {reportData.metrics.activeSubscriptions.toLocaleString()}
                </div>
                <div className="text-xs text-indigo-600 font-semibold mt-2">
                  {reportData.metrics.totalSubscriptions.toLocaleString()} total lifecycle records
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Outstanding Balance
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                  ${reportData.metrics.outstandingAmount.toLocaleString()}
                </div>
                <div className="text-xs text-amber-600 font-semibold mt-2">
                  Across {reportData.metrics.outstandingInvoicesCount} open invoice(s)
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-rose-200/90 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Overdue Receivables
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-rose-600 mt-3 tracking-tight">
                  ${reportData.metrics.overdueAmount.toLocaleString()}
                </div>
                <div className="text-xs text-rose-500 font-semibold mt-2">
                  {reportData.metrics.overdueInvoicesCount} invoice(s) past due date
                </div>
              </div>
            </div>

            {/* Subscription Lifecycle Pipeline */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Subscription Lifecycle Pipeline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any stage to filter subscriptions from Draft and Quotation through Confirmed, Active, Paused, and Closed.
                  </p>
                </div>
                {user.role === "ADMIN" && (
                  <button
                    type="button"
                    disabled={loadingAction}
                    onClick={handleSeedBenchmark}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Simulate High-Volume Load (+1,000 Subscriptions)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {(["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"] as const).map(
                  (stage) => {
                    const info = reportData.statusBreakdown?.[stage] || { count: 0, value: 0 };
                    return (
                      <div
                        key={stage}
                        onClick={() => {
                          setSubStatusFilter(stage);
                          setActiveTab("SUBSCRIPTIONS");
                        }}
                        className="group cursor-pointer p-4 rounded-2xl border border-slate-200/90 hover:border-indigo-500 hover:shadow-md bg-slate-50/60 hover:bg-white transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          {statusBadge(stage)}
                        </div>
                        <div className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                          {info.count.toLocaleString()}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          ${info.value.toLocaleString()} volume
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Recent Activity Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Recent Invoices</h3>
                    <p className="text-[11px] text-slate-500">
                      Automated tax & discount breakdowns
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("INVOICES")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {reportData.recentInvoices?.map(
                    (inv: {
                      id: string;
                      invoiceNumber: string;
                      status: string;
                      totalAmount: number;
                      dueDate: string;
                      customer?: { name: string };
                    }) => (
                      <div
                        key={inv.id}
                        className="py-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900 font-mono">
                            {inv.invoiceNumber}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            {inv.customer?.name} • Due{" "}
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900">
                            ${inv.totalAmount.toFixed(2)}
                          </span>
                          {statusBadge(inv.status)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Recent Subscriptions
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Latest customer plans & recurring schedules
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("SUBSCRIPTIONS")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    Manage All →
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {reportData.recentSubscriptions?.map(
                    (sub: {
                      id: string;
                      code: string;
                      status: string;
                      totalAmount: number;
                      customer?: { name: string };
                      plan?: { name: string };
                    }) => (
                      <div
                        key={sub.id}
                        className="py-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900 font-mono">
                            {sub.code}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            {sub.customer?.name} • {sub.plan?.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900">
                            ${sub.totalAmount.toFixed(2)}
                          </span>
                          {statusBadge(sub.status)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTIONS & QUOTATIONS */}
        {activeTab === "SUBSCRIPTIONS" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {["ALL", "DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSubStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        subStatusFilter === st
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Search subscription code or customer..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
              <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing <strong>{subscriptions.length}</strong> of{" "}
                  <strong>{subTotalCount.toLocaleString()}</strong> subscriptions
                </span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/70">
                    <th className="py-3.5 px-5">Code</th>
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-5">Billing Plan</th>
                    <th className="py-3.5 px-5">Lifecycle Status</th>
                    <th className="py-3.5 px-5">Next Billing</th>
                    <th className="py-3.5 px-5 text-right">Recurring Total</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-mono font-bold text-slate-900">
                        {sub.code}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{sub.customer?.name}</div>
                        <div className="text-slate-500 text-[11px]">{sub.customer?.email}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">{sub.plan?.name}</div>
                        <div className="text-[11px] text-indigo-600 font-medium">
                          {sub.plan?.interval}
                        </div>
                      </td>
                      <td className="py-4 px-5">{statusBadge(sub.status)}</td>
                      <td className="py-4 px-5 text-slate-600 font-medium">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="font-extrabold text-slate-900 text-sm">
                          ${sub.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Sub: ${sub.subtotal.toFixed(2)} • Disc: -${sub.discountAmount.toFixed(2)} • Tax: +${sub.taxAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {sub.status === "DRAFT" && (
                            <button
                              type="button"
                              onClick={() => handleSubscriptionAction(sub.id, "SEND_QUOTATION")}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition"
                            >
                              Send Quote
                            </button>
                          )}
                          {(sub.status === "DRAFT" || sub.status === "QUOTATION") && (
                            <button
                              type="button"
                              onClick={() => handleSubscriptionAction(sub.id, "CONFIRM")}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
                            >
                              Confirm Order
                            </button>
                          )}
                          {sub.status === "CONFIRMED" && (
                            <button
                              type="button"
                              onClick={() => handleSubscriptionAction(sub.id, "ACTIVATE")}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
                            >
                              Activate
                            </button>
                          )}
                          {sub.status === "ACTIVE" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSubscriptionAction(sub.id, "RENEW_NOW")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
                                title="Trigger immediate renewal & invoice"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Renew
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubscriptionAction(sub.id, "PAUSE")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition"
                              >
                                <PauseCircle className="w-3 h-3" />
                                Pause
                              </button>
                            </>
                          )}
                          {sub.status === "PAUSED" && (
                            <button
                              type="button"
                              onClick={() => handleSubscriptionAction(sub.id, "ACTIVATE")}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
                            >
                              Resume
                            </button>
                          )}
                          {sub.status !== "CLOSED" && (
                            <button
                              type="button"
                              onClick={() => handleSubscriptionAction(sub.id, "CLOSE")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVOICES */}
        {activeTab === "INVOICES" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {["ALL", "DRAFT", "CONFIRMED", "PAID"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setInvStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      invStatusFilter === st
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              {(user.role === "ADMIN" || user.role === "STAFF") && (
                <button
                  type="button"
                  onClick={handleRunAutomatedBilling}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Generate Due Subscription Invoices
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/70">
                    <th className="py-3.5 px-5">Invoice #</th>
                    <th className="py-3.5 px-5">Customer & Subscription</th>
                    <th className="py-3.5 px-5">Dates</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Breakdown</th>
                    <th className="py-3.5 px-5 text-right">Total / Paid</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoices.map((inv) => {
                    const balance = Math.max(
                      0,
                      Number((inv.totalAmount - inv.paidAmount).toFixed(2))
                    );
                    const isOverdue =
                      inv.status !== "PAID" && new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                          {isOverdue && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-sans font-bold">
                              OVERDUE
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-900">
                            {inv.customer?.name}
                          </div>
                          <div className="text-[11px] text-indigo-600 font-mono font-semibold">
                            {inv.subscription?.code}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-slate-600">
                          <div>Issued: {new Date(inv.issueDate).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-400">
                            Due: {new Date(inv.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {statusBadge(inv.status)}
                          {inv.sentAt && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Dispatched ✓
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right text-[11px] text-slate-500">
                          <div>Sub: ${inv.subtotal.toFixed(2)}</div>
                          {inv.discountAmount > 0 && (
                            <div className="text-emerald-600 font-medium">
                              Disc: -${inv.discountAmount.toFixed(2)}
                            </div>
                          )}
                          <div>Tax: +${inv.taxAmount.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="font-extrabold text-slate-900 text-sm">
                            ${inv.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-semibold">
                            Paid: ${inv.paidAmount.toFixed(2)}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {inv.status === "DRAFT" &&
                              (user.role === "ADMIN" || user.role === "STAFF") && (
                                <button
                                  type="button"
                                  onClick={() => handleInvoiceAction(inv.id, "CONFIRM")}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold"
                                >
                                  Confirm
                                </button>
                              )}
                            {(user.role === "ADMIN" || user.role === "STAFF") && (
                              <button
                                type="button"
                                onClick={() => handleInvoiceAction(inv.id, "SEND")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                              >
                                <Send className="w-3 h-3" />
                                Send
                              </button>
                            )}
                            {inv.status !== "PAID" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPayModal({
                                    id: inv.id,
                                    invoiceNumber: inv.invoiceNumber,
                                    balance,
                                  });
                                  setPayForm({
                                    amount: String(balance),
                                    method: "CARD",
                                    reference: "",
                                    notes: "",
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
                              >
                                <CreditCard className="w-3 h-3" />
                                Pay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPrintInvoice(inv)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition"
                            >
                              <Printer className="w-3 h-3" />
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS */}
        {activeTab === "PAYMENTS" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                Payment Ledger & Invoice Reconciliation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All recorded payments are automatically linked to their corresponding invoices.
              </p>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/70">
                  <th className="py-3.5 px-5">Payment #</th>
                  <th className="py-3.5 px-5">Matched Invoice</th>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Method & Reference</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>
                    <td className="py-4 px-5 font-mono text-indigo-600 font-bold">
                      {p.invoice?.invoiceNumber}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">
                        {p.invoice?.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.invoice?.customer?.email}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-bold text-slate-700 text-[11px]">
                        {p.method}
                      </span>
                      <span className="ml-2 text-slate-500 font-mono text-[11px]">
                        {p.reference}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-right font-extrabold text-emerald-600 text-sm">
                      +${p.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: PRODUCTS & VARIANTS (ADMIN) */}
        {activeTab === "PRODUCTS" && user.role === "ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateProduct}
              className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit"
            >
              <h3 className="text-sm font-extrabold text-slate-900">
                Add Product & Tier Variant
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProductForm.name}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, name: e.target.value })
                  }
                  placeholder="Brightloop Cloud Security"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductForm.sku}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, sku: e.target.value })
                    }
                    placeholder="BL-SEC-01"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Type
                  </label>
                  <select
                    value={newProductForm.type}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, type: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="SAAS">SAAS</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="LICENSE">LICENSE</option>
                    <option value="DIGITAL">DIGITAL</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.basePrice}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, basePrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.costPrice}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, costPrice: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Initial Product Variant
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={newProductForm.variantName}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, variantName: e.target.value })
                    }
                    placeholder="Variant Name"
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    value={newProductForm.variantPriceDelta}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        variantPriceDelta: e.target.value,
                      })
                    }
                    placeholder="+Price Delta ($)"
                    className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Save Product & Variant
              </button>
            </form>

            <div className="lg:col-span-8 space-y-3.5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        {prod.type}
                      </span>
                      <span className="ml-2 font-mono text-xs text-slate-400">
                        {prod.sku}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1.5">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {prod.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900">
                        ${prod.basePrice.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cost: ${prod.costPrice.toFixed(2)} • Margin:{" "}
                        {Math.round(
                          ((prod.basePrice - prod.costPrice) / prod.basePrice) * 100
                        )}
                        %
                      </div>
                    </div>
                  </div>
                  {prod.variants?.length > 0 && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-2">
                      {prod.variants.map(
                        (v: { id: string; name: string; priceDelta: number }) => (
                          <span
                            key={v.id}
                            className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                          >
                            {v.name} (+${v.priceDelta.toFixed(2)})
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PLANS (DAILY, WEEKLY, MONTHLY, YEARLY) */}
        {activeTab === "PLANS" && user.role === "ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreatePlan}
              className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit"
            >
              <h3 className="text-sm font-extrabold text-slate-900">
                Create Recurring Plan
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPlanForm.name}
                  onChange={(e) =>
                    setNewPlanForm({ ...newPlanForm, name: e.target.value })
                  }
                  placeholder="Quarterly Growth Plan"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlanForm.code}
                    onChange={(e) =>
                      setNewPlanForm({ ...newPlanForm, code: e.target.value })
                    }
                    placeholder="PLAN-CUSTOM"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Interval *
                  </label>
                  <select
                    value={newPlanForm.interval}
                    onChange={(e) =>
                      setNewPlanForm({ ...newPlanForm, interval: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price Multiplier (relative to monthly base)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newPlanForm.priceMultiplier}
                  onChange={(e) =>
                    setNewPlanForm({ ...newPlanForm, priceMultiplier: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Create Billing Plan
              </button>
            </form>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                        {p.interval}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{p.code}</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-3">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Multiplier: {p.priceMultiplier}x
                    </span>
                    <span className="text-slate-500">
                      {p._count?.subscriptions || 0} linked subscriptions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: TAX MANAGEMENT */}
        {activeTab === "TAXES" && user.role === "ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateTax}
              className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit"
            >
              <h3 className="text-sm font-extrabold text-slate-900">
                Add Automatic Tax Rule
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tax Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTaxForm.name}
                  onChange={(e) =>
                    setNewTaxForm({ ...newTaxForm, name: e.target.value })
                  }
                  placeholder="US Digital Sales Tax (8.5%)"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaxForm.code}
                    onChange={(e) =>
                      setNewTaxForm({ ...newTaxForm, code: e.target.value })
                    }
                    placeholder="TAX-US-85"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newTaxForm.rate}
                    onChange={(e) =>
                      setNewTaxForm({ ...newTaxForm, rate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={newTaxForm.isDefault}
                  onChange={(e) =>
                    setNewTaxForm({ ...newTaxForm, isDefault: e.target.checked })
                  }
                />
                Set as Default Automatic Tax Rule
              </label>
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Save Tax Rule
              </button>
            </form>

            <div className="lg:col-span-8 space-y-3.5">
              {taxes.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-slate-900">
                        {t.name}
                      </span>
                      {t.isDefault && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          DEFAULT RULE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Code: {t.code} • Region: {t.region}
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-600">{t.rate}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: DISCOUNTS & ELIGIBILITY CONDITIONS */}
        {activeTab === "DISCOUNTS" && user.role === "ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateDiscount}
              className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5 h-fit"
            >
              <h3 className="text-sm font-extrabold text-slate-900">
                Create Conditional Discount
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDiscountForm.code}
                    onChange={(e) =>
                      setNewDiscountForm({ ...newDiscountForm, code: e.target.value })
                    }
                    placeholder="SCALE25"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={newDiscountForm.type}
                    onChange={(e) =>
                      setNewDiscountForm({ ...newDiscountForm, type: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED AMOUNT ($)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rule Description *
                </label>
                <input
                  type="text"
                  required
                  value={newDiscountForm.name}
                  onChange={(e) =>
                    setNewDiscountForm({ ...newDiscountForm, name: e.target.value })
                  }
                  placeholder="Enterprise Volume 25% Discount"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    required
                    value={newDiscountForm.value}
                    onChange={(e) =>
                      setNewDiscountForm({ ...newDiscountForm, value: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Spend ($)
                  </label>
                  <input
                    type="number"
                    value={newDiscountForm.minPurchaseAmount}
                    onChange={(e) =>
                      setNewDiscountForm({
                        ...newDiscountForm,
                        minPurchaseAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Qty
                  </label>
                  <input
                    type="number"
                    value={newDiscountForm.minQuantity}
                    onChange={(e) =>
                      setNewDiscountForm({
                        ...newDiscountForm,
                        minQuantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Usage Limit
                  </label>
                  <input
                    type="number"
                    value={newDiscountForm.maxUsageLimit}
                    onChange={(e) =>
                      setNewDiscountForm({
                        ...newDiscountForm,
                        maxUsageLimit: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newDiscountForm.endDate}
                    onChange={(e) =>
                      setNewDiscountForm({ ...newDiscountForm, endDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Save Auto-Eligible Discount
              </button>
            </form>

            <div className="lg:col-span-8 space-y-3.5">
              {discounts.map((d) => (
                <div
                  key={d.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                        {d.code}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {d.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5">
                      Min Purchase: ${d.minPurchaseAmount} • Min Qty: {d.minQuantity} • Valid{" "}
                      {new Date(d.startDate).toLocaleDateString()} –{" "}
                      {new Date(d.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Redemptions: {d.currentUsageCount} / {d.maxUsageLimit} max uses
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-emerald-600">
                      {d.type === "PERCENTAGE" ? `${d.value}% OFF` : `$${d.value} OFF`}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-indigo-600">
                      Auto-Applied ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: USER & STAFF MANAGEMENT */}
        {activeTab === "USERS" && (user.role === "ADMIN" || user.role === "STAFF") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateUser}
              className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 h-fit"
            >
              <h3 className="text-sm font-extrabold text-slate-900">
                {user.role === "ADMIN"
                  ? "Add Staff Member or Customer"
                  : "Onboard New Customer"}
              </h3>
              <p className="text-xs text-slate-500">
                {user.role === "ADMIN"
                  ? "Provision new Staff or Customer accounts with role-based permissions."
                  : "Register a new Customer organization account."}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, name: e.target.value })
                  }
                  placeholder="Vikram Nair"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unique Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, email: e.target.value })
                  }
                  placeholder="vikram@brightloop.io"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, password: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              {user.role === "ADMIN" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Role *
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="STAFF">STAFF (Operations & Billing)</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Department
                </label>
                <input
                  type="text"
                  value={newUserForm.company}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, company: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                Create Account
              </button>
            </form>

            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/70">
                    <th className="py-3.5 px-5">Name & Organization</th>
                    <th className="py-3.5 px-5">Registered Email</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5 text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        {u.company && (
                          <div className="text-[11px] text-slate-500">{u.company}</div>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-600">{u.email}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "ADMIN"
                              ? "bg-indigo-100 text-indigo-800"
                              : u.role === "STAFF"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-slate-500 font-medium">
                        {u._count?.subscriptions || 0} subs • {u._count?.invoices || 0} invoices
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Create Subscription / Quotation */}
      {showNewSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {user.role === "CUSTOMER"
                  ? "Start New Subscription"
                  : "Create Subscription / Quotation"}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSubModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              {user.role !== "CUSTOMER" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Account *
                  </label>
                  <select
                    required
                    value={newSubForm.customerId}
                    onChange={(e) =>
                      setNewSubForm({ ...newSubForm, customerId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  >
                    {usersList
                      .filter((u) => u.role === "CUSTOMER")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Billing Plan *
                  </label>
                  <select
                    required
                    value={newSubForm.planId}
                    onChange={(e) =>
                      setNewSubForm({ ...newSubForm, planId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.interval})
                      </option>
                    ))}
                  </select>
                </div>

                {user.role !== "CUSTOMER" && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Initial Lifecycle Stage
                    </label>
                    <select
                      value={newSubForm.status}
                      onChange={(e) =>
                        setNewSubForm({ ...newSubForm, status: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="QUOTATION">QUOTATION</option>
                      <option value="CONFIRMED">CONFIRMED (Auto-Invoice)</option>
                      <option value="ACTIVE">ACTIVE (Auto-Invoice)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product *
                </label>
                <select
                  required
                  value={newSubForm.productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setNewSubForm({
                      ...newSubForm,
                      productId: e.target.value,
                      variantId: p?.variants?.[0]?.id || "",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} (Base: ${prod.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Variant
                  </label>
                  <select
                    value={newSubForm.variantId}
                    onChange={(e) =>
                      setNewSubForm({ ...newSubForm, variantId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="">Base Configuration (+$0)</option>
                    {selectedProductObj?.variants?.map(
                      (v: { id: string; name: string; priceDelta: number }) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (+${v.priceDelta})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantity / Seats *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newSubForm.quantity}
                    onChange={(e) =>
                      setNewSubForm({
                        ...newSubForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 text-[11px] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Eligible discounts and regional tax rules are calculated and applied automatically.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSubModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  {loadingAction ? "Saving..." : "Create Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Payment */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Record Payment — {showPayModal.invoiceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowPayModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                >
                  <option value="CARD">Corporate Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">ACH / Wire Bank Transfer</option>
                  <option value="UPI">Instant UPI / QR</option>
                  <option value="CASH">Cash / Check</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={(e) =>
                    setPayForm({ ...payForm, reference: e.target.value })
                  }
                  placeholder="e.g. TXN-984120"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  {loadingAction ? "Processing..." : "Confirm & Match Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <InvoicePrintModal
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />
    </div>
  );
}
