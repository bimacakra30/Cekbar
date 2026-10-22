"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StatCard } from "./stat-card";
import { RecentOrdersTable } from "./recent-orders-table";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { getOrders, getOrderStats } from "@/lib/services";
import type { Order } from "@/types";
import { Zap, X, Send, Music } from "lucide-react";

export function DashboardContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  // Show modal once per session
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("dashboard_info_modal_shown");
    if (!alreadyShown) {
      setShowModal(true);
      sessionStorage.setItem("dashboard_info_modal_shown", "true");
    }
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Info Modal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              animation: "scaleIn 0.3s ease-out",
            }}
          >
            {/* Decorative glow */}
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
                >
                  <Send size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Informasi Penting</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="relative p-5 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Jika Anda mengalami kendala saat menggunakan layanan kami, silakan hubungi admin melalui:
              </p>

              {/* Telegram */}
              <a
                href="https://t.me/cekbar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, rgba(0,136,204,0.15), rgba(0,136,204,0.05))",
                  border: "1px solid rgba(0,136,204,0.25)",
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #0088cc, #00a8e8)" }}
                >
                  <Send size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Telegram</p>
                  <p className="text-xs text-blue-300/80">t.me/cekbar</p>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@cekbar30"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, rgba(254,44,85,0.15), rgba(37,244,238,0.05))",
                  border: "1px solid rgba(254,44,85,0.25)",
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: "linear-gradient(135deg, #fe2c55, #25f4ee)" }}
                >
                  <Music size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">TikTok</p>
                  <p className="text-xs text-pink-300/80">@cekbar30</p>
                </div>
              </a>
            </div>

            {/* Footer */}
            <div className="relative px-5 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* CSS animations for modal */}
      {showModal && createPortal(
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}} />,
      document.body)}

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
