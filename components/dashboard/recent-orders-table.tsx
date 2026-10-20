"use client";

import Link from "next/link";
import { Clock, ArrowRight, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Order } from "@/types";

type RecentOrdersTableProps = {
  orders: Order[];
};

const statusConfig: Record<string, { label: string; dot: string; pill: string }> = {
  PENDING_PAYMENT: {
    label: "Belum Bayar",
    dot: "bg-orange-400",
    pill: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/40",
  },
  PENDING: {
    label: "Menunggu",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40",
  },
  PROCESSING: {
    label: "Diproses",
    dot: "bg-blue-400",
    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40",
  },
  SUCCESS: {
    label: "Selesai",
    dot: "bg-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40",
  },
  FAILED: {
    label: "Gagal",
    dot: "bg-red-400",
    pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
  },
  EXPIRED: {
    label: "Kadaluarsa",
    dot: "bg-gray-400",
    pill: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800/40",
  },
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const recentOrders = orders.slice(0, 10);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-foreground">Pesanan Terakhir</h2>
          <p className="text-xs text-muted-foreground mt-0.5">10 pesanan terbaru Anda</p>
        </div>
        <Link
          href="/riwayat/pesanan-ceir"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
        >
          Lihat Semua
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #3b82f615, #1d4ed808)" }}
          >
            <Package size={26} className="text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Belum ada pesanan</p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Buat pesanan pertama Anda dengan memilih layanan di atas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">
                  Order ID
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 py-3">
                  Layanan
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 py-3 hidden md:table-cell">
                  IMEI
                </th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-5 sm:px-6 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((order) => {
                const status = statusConfig[order.status] ?? statusConfig.PENDING;
                return (
                  <tr
                    key={order.orderId}
                    className="transition-colors hover:bg-muted/40 group"
                  >
                    <td className="px-5 sm:px-6 py-4">
                      <span className="text-[13px] font-mono font-medium text-foreground">
                        {order.orderId}
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] text-foreground font-medium">
                        {order.serviceName}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-[12px] font-mono text-muted-foreground">
                        {order.imeiList[0]}
                        {order.imeiList.length > 1 && (
                          <span className="text-[11px] ml-1.5 text-blue-500 font-semibold">
                            +{order.imeiList.length - 1} lainnya
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                          status.pill
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dot)} />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
