"use client";

import { useState, useEffect, useCallback } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Loader2, RefreshCw, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight,
  ShoppingCart, XCircle, Users, Clock, BarChart3, Activity, CalendarDays,
  CheckCircle2, CreditCard,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Stats = {
  totalRevenue: number;
  totalSeller: number;
  netRevenue: number;
  totalOrders: number;
  totalSuccess: number;
  totalFailed: number;
  activeUsers: number;
  ordersToday: number;
  pendingOrders: number;
  ceirBalance: number | null;
};

type DailyRevenue = { day: string; revenue: number; count: number };
type StatusChart  = { status: string; total: number };
type TopService   = { name: string; orders: number; revenue: number };
type RecentOrder = {
  id: string; user: string; service: string;
  amount: number; status: string; paymentType: string | null; date: string;
};

const statusConfig: Record<string, { label: string; color: string; fill: string; bg: string }> = {
  SUCCESS:         { label: "Berhasil",    color: "text-emerald-600 dark:text-emerald-400", fill: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  PROCESSING:      { label: "Diproses",    color: "text-blue-600 dark:text-blue-400",       fill: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/30" },
  PENDING:         { label: "Pending",     color: "text-amber-600 dark:text-amber-400",     fill: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30" },
  PENDING_PAYMENT: { label: "Belum Bayar", color: "text-orange-600 dark:text-orange-400",   fill: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/30" },
  FAILED:          { label: "Gagal",       color: "text-red-600 dark:text-red-400",         fill: "#ef4444", bg: "bg-red-50 dark:bg-red-950/30" },
  EXPIRED:         { label: "Expired",     color: "text-gray-500",                          fill: "#6b7280", bg: "bg-gray-50 dark:bg-gray-950/30" },
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {value:number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatRupiah(payload[0]?.value ?? 0)}</p>
      {payload[1] && <p className="text-muted-foreground mt-0.5">{payload[1].value} transaksi</p>}
    </div>
  );
}

function RevenueCard({
  label, value, icon: Icon, gradient, trend,
}: {
  label: string; value: number;
  icon: React.ElementType; gradient: string; trend?: "up" | "down";
}) {
  return (
    <div className="relative group overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute inset-0 ${gradient}`} />
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-xl group-hover:bg-white/15 transition-colors duration-300" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
            <Icon size={18} className="text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              trend === "up" ? "bg-white/20 text-white" : "bg-white/15 text-white/80"
            }`}>
              {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            </div>
          )}
        </div>
        <p className="text-xs font-medium text-white/70 mb-1">{label}</p>
        <p className="text-xl font-bold text-white tracking-tight">{formatRupiah(value)}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, icon: Icon, iconColor, iconBg,
}: {
  label: string; value: string;
  icon: React.ElementType; iconColor: string; iconBg: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 transition-all duration-200 hover:border-border hover:shadow-sm group">
      <div className="flex items-center gap-3.5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} transition-transform duration-200 group-hover:scale-105`}>
          <Icon size={19} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalSeller: 0, netRevenue: 0,
    totalOrders: 0, totalSuccess: 0, totalFailed: 0, activeUsers: 0,
    ordersToday: 0, pendingOrders: 0, ceirBalance: null,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [statusChart, setStatusChart]   = useState<StatusChart[]>([]);
  const [topServices, setTopServices]   = useState<TopService[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [timeRange, setTimeRange]       = useState<"today"|"week"|"month">("today");

  const fetchStats = useCallback(async (range: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setDailyRevenue(data.charts?.dailyRevenue ?? []);
        setStatusChart(data.charts?.statusChart ?? []);
        setTopServices(data.charts?.topServices ?? []);
        setRecentOrders(data.recentOrders ?? []);
      }
    } catch { console.error("Gagal fetch stats"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchStats("today"); }, [fetchStats]);
  useEffect(() => { fetchStats(timeRange, true); }, [timeRange]); // eslint-disable-line

  const rangeLabel = timeRange === "today" ? "Hari Ini" : timeRange === "week" ? "7 Hari" : "30 Hari";

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center">
            <Activity size={17} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Overview</h2>
            <p className="text-[11px] text-muted-foreground">Ringkasan bisnis & aktivitas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(timeRange, true)}
            className="p-2 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center bg-muted/50 rounded-xl p-0.5 border border-border/40">
            {(["today","week","month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  timeRange === r
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "today" && <CalendarDays size={12} />}
                {r === "today" ? "Hari Ini" : r === "week" ? "7 Hari" : "30 Hari"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard
              label={`Pendapatan Kotor · ${rangeLabel}`}
              value={stats.totalRevenue}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              trend="up"
            />
            <RevenueCard
              label={`Setoran ke Seller · ${rangeLabel}`}
              value={stats.totalSeller}
              icon={Wallet}
              gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            />
            <RevenueCard
              label={`Pendapatan Bersih · ${rangeLabel}`}
              value={stats.netRevenue}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
              trend="up"
            />
            {stats.ceirBalance !== null && (
              <RevenueCard
                label="Saldo CEIR"
                value={stats.ceirBalance}
                icon={CreditCard}
                gradient="bg-gradient-to-br from-sky-500 to-cyan-600"
              />
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Total Pesanan"
              value={stats.totalOrders.toString()}
              icon={ShoppingCart} iconBg="bg-violet-500/10" iconColor="#8b5cf6"
            />
            <MetricCard
              label="Pesanan Berhasil"
              value={stats.totalSuccess.toString()}
              icon={CheckCircle2} iconBg="bg-emerald-500/10" iconColor="#10b981"
            />
            <MetricCard
              label="Pesanan Gagal"
              value={stats.totalFailed.toString()}
              icon={XCircle} iconBg="bg-red-500/10" iconColor="#ef4444"
            />
            <MetricCard
              label="Pengguna Aktif"
              value={stats.activeUsers.toString()}
              icon={Users} iconBg="bg-cyan-500/10" iconColor="#06b6d4"
            />
            <MetricCard
              label="Pending"
              value={stats.pendingOrders.toString()}
              icon={Clock} iconBg="bg-amber-500/10" iconColor="#f59e0b"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Pendapatan Harian</h3>
                    <p className="text-[11px] text-muted-foreground">7 hari terakhir</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyRevenue} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGrad2)" dot={{ r: 3, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-2xl border border-border/60 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Activity size={15} className="text-violet-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Status Pesanan</h3>
                  <p className="text-[11px] text-muted-foreground">Distribusi semua waktu</p>
                </div>
              </div>
              {statusChart.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">Belum ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusChart}
                      dataKey="total"
                      nameKey="status"
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {statusChart.map((entry) => (
                        <Cell key={entry.status} fill={statusConfig[entry.status]?.fill ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [v, statusConfig[name as string]?.label ?? name]}
                      contentStyle={{ borderRadius: 14, fontSize: 12, border: "1px solid var(--border)", background: "var(--card)", backdropFilter: "blur(8px)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-3 space-y-1.5">
                {statusChart.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: statusConfig[s.status]?.fill ?? "#6b7280" }} />
                      <span className="text-muted-foreground font-medium">{statusConfig[s.status]?.label ?? s.status}</span>
                    </div>
                    <span className="font-bold text-foreground">{s.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {topServices.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/60 p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp size={15} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Top Layanan</h3>
                  <p className="text-[11px] text-muted-foreground">5 layanan terbanyak dipesan</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={topServices} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} opacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category" dataKey="name" width={180}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 28) + "…" : v}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} pesanan`]}
                    contentStyle={{ borderRadius: 14, fontSize: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                  />
                  <Bar dataKey="orders" radius={[0, 8, 8, 0]} maxBarSize={20}>
                    {topServices.map((_, i) => (
                      <Cell key={i} fill={["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef"][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <ShoppingCart size={15} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pesanan Terbaru</h3>
                  <p className="text-[11px] text-muted-foreground">{rangeLabel}</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    {["Order ID","Pengguna","Layanan","Jumlah","Status","Waktu"].map((h) => (
                      <th key={h} className={`text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground px-5 py-3 ${h === "Jumlah" || h === "Waktu" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refreshing ? (
                    <tr><td colSpan={6} className="py-10 text-center"><Loader2 size={18} className="animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : recentOrders.length === 0 ? (
                    <tr><td colSpan={6} className="py-14 text-center text-sm text-muted-foreground">Tidak ada pesanan pada periode ini</td></tr>
                  ) : recentOrders.map((order) => {
                    const sc = statusConfig[order.status] ?? { label: order.status, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-950/30" };
                    return (
                      <tr key={order.id} className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5"><span className="text-[12px] font-mono font-medium text-foreground">{order.id}</span></td>
                        <td className="px-5 py-3.5"><span className="text-[13px] font-medium text-foreground">{order.user}</span></td>
                        <td className="px-5 py-3.5"><span className="text-[13px] text-muted-foreground">{order.service}</span></td>
                        <td className="px-5 py-3.5 text-right"><span className="text-[13px] font-semibold text-foreground">{formatRupiah(order.amount)}</span></td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${sc.color} ${sc.bg}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig[order.status]?.fill ?? "#6b7280" }} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right"><span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(order.date)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
