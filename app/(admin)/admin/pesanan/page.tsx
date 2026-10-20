"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Loader2, RefreshCw, Eye } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CeirResultRenderer } from "@/components/history/ceir-result-renderer";

type AdminOrder = {
  orderId: string;
  serviceName: string;
  imeiList: string[];
  totalPrice: number;
  orderStatus: string;
  ceirOrderId: string | null;
  statusNote: string | null;
  roamerMonths: number | null;
  results: unknown;
  paymentId: string | null;
  paymentStatus: string | null;
  totalAmount: number;
  username: string;
  email: string;
  nama: string;
  confirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

const orderStatusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  PENDING_PAYMENT: { label: "Belum Bayar", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40" },
  PENDING: { label: "Pending", dot: "bg-blue-400", pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40" },
  PROCESSING: { label: "Diproses", dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40" },
  SUCCESS: { label: "Selesai", dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40" },
  FAILED: { label: "Gagal", dot: "bg-red-400", pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40" },
  EXPIRED: { label: "Expired", dot: "bg-gray-400", pill: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800/40" },
};

const paymentStatusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  MENUNGGU: { label: "Belum Bayar", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40" },
  LUNAS: { label: "Lunas", dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40" },
  KADALUARSA: { label: "Kadaluarsa", dot: "bg-red-400", pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40" },
  GAGAL: { label: "Gagal", dot: "bg-red-400", pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40" },
};

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOrderStatus, setFilterOrderStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterOrderStatus !== "ALL") params.set("orderStatus", filterOrderStatus);
      const res = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {
      console.error("Gagal fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filterOrderStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.username.toLowerCase().includes(q) ||
      o.serviceName.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.ceirOrderId ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: orders.length,
    success: orders.filter((o) => o.orderStatus === "SUCCESS").length,
    pending: orders.filter((o) => o.orderStatus === "PENDING" || o.orderStatus === "PROCESSING").length,
    failed: orders.filter((o) => o.orderStatus === "FAILED").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Order", value: stats.total, color: "text-foreground" },
          { label: "Selesai", value: stats.success, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Pending/Proses", value: stats.pending, color: "text-blue-600 dark:text-blue-400" },
          { label: "Gagal", value: stats.failed, color: "text-red-600 dark:text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari order ID, username, CEIR ID..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <select
            value={filterOrderStatus}
            onChange={(e) => setFilterOrderStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING_PAYMENT">Belum Bayar</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Diproses</option>
            <option value="SUCCESS">Selesai</option>
            <option value="FAILED">Gagal</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Tidak ada order ditemukan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3 hidden md:table-cell">Layanan</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Total</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Order</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Bayar</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => {
                  const os = orderStatusConfig[order.orderStatus] ?? orderStatusConfig.PENDING;
                  const ps = order.paymentStatus ? (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU) : null;

                  return (
                    <tr key={order.orderId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-medium text-foreground">{order.orderId}</span>
                        {order.ceirOrderId && (
                          <span className="block text-[10px] font-mono text-blue-500 mt-0.5">{order.ceirOrderId}</span>
                        )}
                        <span className="block text-[11px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-foreground">{order.username}</span>
                        <span className="block text-[11px] text-muted-foreground">{order.email}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-foreground">{order.serviceName}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {order.imeiList?.length ?? 0} IMEI
                          {order.roamerMonths && ` · ${order.roamerMonths} Bulan`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-foreground">{formatRupiah(order.totalAmount || order.totalPrice)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", os.pill)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", os.dot)} />
                          {os.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {ps ? (
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", ps.pill)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ps.dot)} />
                            {ps.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Detail"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && typeof document !== "undefined" && createPortal(
        <AdminDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />,
        document.body
      )}
    </div>
  );
}

type CeirResultsData = {
  ceir_order_id?: string;
  service_id?: number;
  result?: unknown;
  processed?: number;
  total_potong?: number;
  transaction_id?: string;
  error?: string;
  errorCode?: string;
};

function isCeirResults(results: unknown): results is CeirResultsData {
  return typeof results === "object" && results !== null && "service_id" in results;
}

function getServiceLabel(serviceId?: number): string {
  switch (serviceId) {
    case 30: return "STATUS IMEI CEIR";
    case 31: return "HISTORY IMEI CEIR";
    case 38: return "VALID ROAMER CEIR";
    case 39: return "IMEI BEA CUKAI";
    default: return "CEIR";
  }
}

function getStatusCatatan(status: string, imei: string): { type: "info" | "warning" | "error"; text: string } | null {
  switch (status) {
    case "REGISTERED":
      return {
        type: "info",
        text: `IMEI ${imei} terdaftar di database CEIR. Perangkat ini telah melewati proses registrasi resmi dan aman digunakan di Indonesia.`,
      };
    case "UNREGISTERED":
      return {
        type: "error",
        text: `IMEI perangkat tidak terdaftar di database CEIR. Status ini berisiko tinggi mengalami pemblokiran sinyal.`,
      };
    case "UNKNOWN":
      return {
        type: "error",
        text: `IMEI perangkat tidak dikenal atau tidak terdaftar di database CEIR. Status ini berisiko tinggi mengalami pemblokiran sinyal.`,
      };
    default:
      return null;
  }
}

function StatusCatatan({ result }: { result: Record<string, string[]> }) {
  return (
    <>
      {Object.entries(result).flatMap(([status, imeis]) =>
        imeis.map((imei, i) => {
          const catatan = getStatusCatatan(status, imei);
          if (!catatan) return null;
          return (
            <div
              key={`cat-${status}-${i}`}
              className={cn(
                "rounded-xl px-4 py-3 border-l-4",
                catatan.type === "info" && "bg-blue-50 dark:bg-blue-950/20 border-blue-400",
                catatan.type === "error" && "bg-red-50 dark:bg-red-950/20 border-red-400",
                catatan.type === "warning" && "bg-amber-50 dark:bg-amber-950/20 border-amber-400",
              )}
            >
              <p className={cn(
                "text-sm font-semibold mb-1",
                catatan.type === "info" && "text-blue-700 dark:text-blue-300",
                catatan.type === "error" && "text-red-700 dark:text-red-300",
                catatan.type === "warning" && "text-amber-700 dark:text-amber-300",
              )}>
                Catatan IMEI {i + 1} ({imei}):
              </p>
              <p className={cn(
                "text-sm leading-relaxed",
                catatan.type === "info" && "text-blue-600 dark:text-blue-400",
                catatan.type === "error" && "text-red-600 dark:text-red-400",
                catatan.type === "warning" && "text-amber-600 dark:text-amber-400",
              )}>
                {catatan.text}
              </p>
            </div>
          );
        })
      )}
    </>
  );
}

function AdminDetailModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const isRoamer = order.roamerMonths !== null;
  const hasCeirResults = order.results && isCeirResults(order.results);
  const serviceId = hasCeirResults ? (order.results as CeirResultsData).service_id : undefined;
  const ceirResult: Record<string, unknown> | unknown[] | undefined = hasCeirResults
    ? (order.results as CeirResultsData).result as Record<string, unknown> | unknown[] | undefined
    : undefined;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-6 py-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Detail Order</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informasi Pemesan</p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2 text-sm">
              <DetailRow label="User" value={`${order.username} (${order.nama})`} />
              <DetailRow label="Email" value={order.email} />
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Informasi Order</p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2 text-sm">
              <DetailRow label="Order ID" value={order.orderId} mono />
              {order.ceirOrderId && (
                <DetailRow label="CEIR Order ID" value={order.ceirOrderId} mono className="text-blue-500" />
              )}
              <DetailRow label="Layanan" value={order.serviceName} />
              {order.roamerMonths && (
                <DetailRow label="Durasi Roamer" value={`${order.roamerMonths} Bulan`} />
              )}
              <DetailRow label="Total Bayar" value={formatRupiah(order.totalAmount || order.totalPrice)} className="font-bold text-blue-600 dark:text-blue-400" />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Status Order</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                  (orderStatusConfig[order.orderStatus] ?? orderStatusConfig.PENDING).pill
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", (orderStatusConfig[order.orderStatus] ?? orderStatusConfig.PENDING).dot)} />
                  {(orderStatusConfig[order.orderStatus] ?? orderStatusConfig.PENDING).label}
                </span>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Status Bayar</span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                    (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU).pill
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", (paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU).dot)} />
                    {(paymentStatusConfig[order.paymentStatus] ?? paymentStatusConfig.MENUNGGU).label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Waktu</p>
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2 text-sm">
              <DetailRow label="Tanggal Order" value={formatDate(order.createdAt)} />
              {order.confirmedAt && (
                <DetailRow label="Dibayar Pada" value={formatDate(order.confirmedAt)} />
              )}
              {order.completedAt && (
                <DetailRow label="Selesai Pada" value={formatDate(order.completedAt)} />
              )}
            </div>
          </div>

          <div className="border-b border-border pb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {isRoamer
                ? "Detail Add Roamer"
                : hasCeirResults
                  ? `Hasil Pengecekan ${getServiceLabel(serviceId)}`
                  : "Hasil Pesanan"
              }
            </p>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Total: {order.imeiList?.length ?? 0}/{order.imeiList?.length ?? 0}
            </p>
            {order.imeiList?.map((imei, i) => (
              <p key={i} className="text-sm font-mono text-foreground">
                IMEI: {imei}
              </p>
            ))}
          </div>

          {isRoamer && (
            <div className="bg-card border border-border rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground">{order.imeiList?.[0]}</span>
                <span className="text-sm text-muted-foreground">
                  Durasi: <strong className="text-foreground">{order.roamerMonths} Bulan</strong>
                </span>
              </div>
              {order.statusNote && (
                <p className={`text-sm font-medium ${
                  order.orderStatus === "SUCCESS" ? "text-emerald-600 dark:text-emerald-400"
                  : order.orderStatus === "FAILED" ? "text-red-500"
                  : "text-muted-foreground"
                }`}>
                  {order.statusNote}
                </p>
              )}
            </div>
          )}

          {!isRoamer && hasCeirResults ? (
            <CeirResultRenderer results={order.results as CeirResultsData} />
          ) : null}

          {serviceId === 30 && ceirResult && (
            <StatusCatatan result={ceirResult as Record<string, string[]>} />
          )}

          {serviceId === 31 && hasCeirResults && (order.results as CeirResultsData).transaction_id ? (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-blue-50 dark:bg-blue-950/20 border-blue-400">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Catatan:</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                {`{"provider_transaction_id":"${(order.results as CeirResultsData).transaction_id}"}`}
              </p>
            </div>
          ) : null}

          {!isRoamer && order.results && !isCeirResults(order.results) && Array.isArray(order.results) ? (
            <div className="space-y-1.5">
              {(order.results as { imei?: string; status?: string; detail?: string }[]).map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-lg px-3 py-2.5">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">{r.imei ?? `#${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[11px] font-semibold mr-2 ${
                      r.status?.toLowerCase().includes("gagal") || r.status?.toLowerCase().includes("blocked") || r.status?.toLowerCase().includes("invalid")
                        ? "text-red-500"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}>{r.status}</span>
                    <span className="text-[11px] text-muted-foreground">{r.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {order.orderStatus === "FAILED" && order.statusNote && (
            <div className="rounded-xl px-4 py-3 border-l-4 bg-red-50 dark:bg-red-950/20 border-red-400">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Gagal:</p>
              <p className="text-sm text-red-600 dark:text-red-400">{order.statusNote}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DetailRow({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-right", mono && "font-mono text-xs", className)}>{value}</span>
    </div>
  );
}
