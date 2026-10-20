"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";
import { RecentOrdersTable } from "./recent-orders-table";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { getOrders, getOrderStats } from "@/lib/services";
import type { Order } from "@/types";
import { Zap } from "lucide-react";

export function DashboardContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [orderData, statsData] = await Promise.all([
          getOrders(),
          getOrderStats(),
        ]);
        setOrders(orderData);
        setStats(statsData);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">

      <section
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}
      >
        <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div aria-hidden="true" className="absolute bottom-0 left-1/2 w-48 h-48 opacity-5 rounded-full"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", transform: "translate(-50%, 50%)" }} />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Selamat datang kembali!
            </h2>
            <p className="text-sm text-blue-200/75 mt-1 max-w-md">
              Pilih layanan di bawah untuk memulai sesuai dengan kebutuhan anda.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-semibold text-white">Semua Layanan Online</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-blue-500" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Ringkasan Pesanan</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon="FileText"
            iconColor="#3B82F6"
            iconBg="#3B82F615"
            value={stats.total}
            label="Total Pesanan"
          />
          <StatCard
            icon="Clock"
            iconColor="#F59E0B"
            iconBg="#F59E0B15"
            value={stats.pending}
            label="Pesanan Pending"
          />
          <StatCard
            icon="XCircle"
            iconColor="#EF4444"
            iconBg="#EF444415"
            value={stats.failed}
            label="Pesanan Gagal"
          />
        </div>
      </section>

      <section>
        <RecentOrdersTable orders={orders} />
      </section>

    </div>
  );
}
