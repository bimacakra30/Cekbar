"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  Search, ChevronLeft, ChevronRight, Loader2, ExternalLink,
  ChevronDown, ChevronUp, Eye, Clock, CheckCircle2, XCircle,
  AlertCircle, Timer, CreditCard, Copy, Check,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

type OrderResult = {
  imei?: string;
  status?: string;
  detail?: string;
  [key: string]: unknown;
};

type HistoryOrder = {
  orderId: string;
  serviceId: string;
  serviceName: string;
  groupName: string;
  timeInfo: string;
  imeiList: string[];
  totalPrice: number;
  status: string;
  dhruOrderId: string | null;
  paymentId: string | null;
  paymentType: string | null;
  paymentStatus: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  results: OrderResult[] | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  SUCCESS: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2 },
  PROCESSING: { label: "Diproses", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20", dot: "bg-blue-500", icon: Timer },
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20", dot: "bg-amber-500", icon: Clock },
  PENDING_PAYMENT: { label: "Belum Bayar", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20", dot: "bg-orange-500", icon: CreditCard },
  FAILED: { label: "Gagal", color: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20", dot: "bg-red-500", icon: XCircle },
  EXPIRED: { label: "Kadaluarsa", color: "bg-gray-500/10 text-gray-500 border border-gray-500/20", dot: "bg-gray-400", icon: AlertCircle },
};

function calcDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return "—";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds} detik`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainMins = minutes % 60;
  if (hours < 24) return remainMins > 0 ? `${hours} jam ${remainMins} menit` : `${hours} jam`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days} hari ${remainHours} jam` : `${days} hari`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

function DetailModal({ order, onClose }: { order: HistoryOrder; onClose: () => void }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const isPolling = currentOrder.status === "PENDING" || currentOrder.status === "PROCESSING";
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPolling) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrder.orderId}/refresh-status`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrentOrder(prev => ({
          ...prev,
          status: data.status ?? prev.status,
        }));
        if (data.final && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { }
    };
    pollRef.current = setInterval(poll, 10_000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [isPolling, currentOrder.orderId]);

  const sc = statusConfig[currentOrder.status] ?? statusConfig.PENDING;
  const StatusIcon = sc.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Detail Pesanan</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{currentOrder.orderId}</p>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", sc.color)}>
              <StatusIcon size={13} />
              {sc.label}
              {isPolling && <Loader2 size={11} className="animate-spin ml-1" />}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoCell label="Order ID" value={currentOrder.orderId} mono />
            {currentOrder.dhruOrderId && (
              <InfoCell label="DHRU Order ID" value={currentOrder.dhruOrderId} mono />
            )}
            <InfoCell label="Layanan" value={currentOrder.serviceName} />
            <InfoCell
              label="Via (Pembayaran)"
              value={currentOrder.paymentType ? currentOrder.paymentType.replace(/_/g, " ").toUpperCase() : "—"}
            />
            <InfoCell label="Waktu Order" value={formatDate(currentOrder.createdAt)} />
            <InfoCell
              label="Waktu Selesai"
              value={currentOrder.completedAt ? formatDate(currentOrder.completedAt) : "Belum selesai"}
            />
            <InfoCell label="Total Biaya" value={formatRupiah(currentOrder.totalPrice)} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              IMEI ({currentOrder.imeiList.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currentOrder.imeiList.map((imei, i) => (
                <div key={i} className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-[11px] font-mono px-2 py-1 rounded-md">
                  {imei}
                  <CopyButton text={imei} />
                </div>
              ))}
            </div>
          </div>

          {currentOrder.results && currentOrder.results.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Hasil dari API
              </p>
              <div className="space-y-2">
                {currentOrder.results.map((r, i) => (
                  <div key={i} className="bg-muted/30 border border-border rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{r.imei ?? `#${i + 1}`}</span>
                      {r.status && (
                        <span className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          r.status.toLowerCase().includes("success") || r.status.toLowerCase().includes("selesai")
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : r.status.toLowerCase().includes("fail") || r.status.toLowerCase().includes("gagal")
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        )}>
                          {r.status}
                        </span>
                      )}
                    </div>
                    {r.detail && (
                      <p className="text-xs text-muted-foreground mt-1">{r.detail}</p>
                    )}
                    {Object.entries(r).filter(([k]) => !["imei", "status", "detail"].includes(k)).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/60 uppercase">{key}:</span>
                        <span className="text-[11px] text-foreground">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {currentOrder.status === "PENDING_PAYMENT" && currentOrder.paymentId && (
            <Link
              href={`/pembayaran/${currentOrder.paymentId}`}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
            >
              Lanjutkan Pembayaran →
            </Link>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-0.5">{label}</p>
      <p className={cn("text-sm text-foreground", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}

type RoamerHistoryPageProps = {
  category: "CEIR" | "GSM" | "UNLOCK_IMEI";
  title: string;
  subtitle: string;
  emptyMessage: string;
};

export function RoamerHistoryPage({ category, title, subtitle, emptyMessage }: RoamerHistoryPageProps) {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<HistoryOrder | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/orders/history?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
        setPagination(data.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch { console.error("Gagal fetch riwayat"); }
    finally { setLoading(false); }
  }, [category, page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId && orders.length > 0 && !selectedOrder) {
      const found = orders.find(o => o.orderId === openId);
      if (found) setSelectedOrder(found);
    }
  }, [searchParams, orders, selectedOrder]);

  const allStatuses = ["SUCCESS", "PROCESSING", "PENDING", "PENDING_PAYMENT", "FAILED", "EXPIRED"];

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Order ID atau IMEI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-card border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">Semua Status</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg font-medium">
            {loading ? "..." : `${pagination.total} pesanan`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Order ID</th>
                <th className="text-left text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Layanan</th>
                <th className="text-left text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">IMEI</th>
                <th className="text-center text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
                <th className="text-center text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Waktu Order</th>
                <th className="text-center text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Waktu Selesai</th>
                <th className="text-center text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {search || statusFilter ? "Coba ubah filter pencarian" : "Pesanan akan muncul di sini setelah Anda melakukan order"}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const sc = statusConfig[order.status] ?? statusConfig.PENDING;
                  const StatusIcon = sc.icon;

                  return (
                    <tr
                      key={order.orderId}
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono font-semibold text-foreground">{order.orderId}</span>
                          <CopyButton text={order.orderId} />
                        </div>
                        {order.dhruOrderId && (
                          <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">
                            DHRU: {order.dhruOrderId}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-xs text-foreground font-medium leading-snug">{order.serviceName}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {order.imeiList.slice(0, 2).map((imei, i) => (
                            <span key={i} className="text-[12px] font-mono text-muted-foreground">{imei}</span>
                          ))}
                          {order.imeiList.length > 2 && (
                            <span className="text-[10px] text-muted-foreground/60">
                              +{order.imeiList.length - 2} lainnya
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold", sc.color)}>
                          <StatusIcon size={11} />
                          {sc.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="text-[11px] text-muted-foreground">{formatDate(order.createdAt)}</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="text-[11px] text-muted-foreground">
                          {order.completedAt ? formatDate(order.completedAt) : "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {order.status === "PENDING_PAYMENT" && order.paymentId && (
                            <Link
                              href={`/pembayaran/${order.paymentId}`}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-blue-500"
                              title="Bayar"
                            >
                              <CreditCard size={14} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-foreground bg-muted rounded-lg">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {mounted && selectedOrder && createPortal(
        <DetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />,
        document.body
      )}
    </div>
  );
}
