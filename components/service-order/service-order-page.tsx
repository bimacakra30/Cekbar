"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Clock,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseIMEIList, formatRupiah } from "@/lib/utils";
import { placeOrder } from "@/lib/services";
import { ImeiInput } from "./imei-input";
import { SyaratKetentuanContent } from "@/app/(main)/syarat-ketentuan/page";
import type { Service, Order } from "@/types";

type ServiceOrderPageProps = {
  services: Service[];
  categorySlug: string;
  categoryLabel: string;
};

export function ServiceOrderPage({ services, categorySlug, categoryLabel }: ServiceOrderPageProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imeiText, setImeiText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showTnC, setShowTnC] = useState(false);
  const [mounted, setMounted] = useState(false);

  const service = services[selectedIndex];

  useEffect(() => {
    setAgreed(!service.requiresAgreement);
  }, [selectedIndex, service.requiresAgreement]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (showTnC) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showTnC]);

  // Auto-clear error when user changes input
  useEffect(() => {
    setOrderError(null);
  }, [selectedIndex, imeiText]);

  const { valid: validImeis, invalid: invalidImeis } = parseIMEIList(imeiText);
  const totalPrice = validImeis.length * service.pricePerUnit;
  const canSubmit = validImeis.length > 0 && agreed && !isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setOrderError(null);
    try {
      type PlaceOrderResult = Order & { paymentId?: string; qrisId?: string; qrImage?: string };
      const order = await placeOrder({
        serviceId: service.id,
        serviceName: service.name,
        imeiList: validImeis,
        pricePerUnit: service.pricePerUnit,
      }) as PlaceOrderResult;

      if (order.paymentId) {
        router.push(`/pembayaran/${order.paymentId}`);
      } else {
        throw new Error("Payment ID tidak ditemukan");
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      const message = err instanceof Error ? err.message : "Terjadi kesalahan, silakan coba lagi.";
      setOrderError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, service, validImeis, router]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">

      <div className="mb-8 sm:mb-10">
        <p className="text-xs font-semibold text-blue-500 tracking-widest uppercase mb-3">
          {categoryLabel} / ORDER BARU
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-foreground tracking-tight leading-[1.15]">
          Pilih layanan,<br />
          tempel IMEI, bayar.
        </h1>

        {service.bannerInfo && (
          <div className="mt-5 flex items-center gap-2.5 text-sm text-muted-foreground">
            <Clock size={14} className="shrink-0 text-muted-foreground/60" />
            <span>{service.bannerInfo}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        <div className="lg:col-span-8 space-y-8">

          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xs font-bold text-muted-foreground/50 tracking-wider">01</span>
              <h2 className="text-lg font-bold text-foreground">Layanan</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((svc, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedIndex(i)}
                    className={cn(
                      "relative flex flex-col gap-1.5 px-4 py-4 rounded-xl border-2 text-left transition-all duration-200",
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                        : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold leading-snug",
                        isSelected ? "text-foreground" : "text-foreground/80"
                      )}>
                        {svc.name}
                      </span>
                      {svc.isOnline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      )}
                    </div>
                    {svc.processTime && (
                      <span className="text-xs text-muted-foreground">{svc.processTime}</span>
                    )}
                    <span className={cn(
                      "text-sm font-bold mt-0.5",
                      isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                    )}>
                      {formatRupiah(svc.pricePerUnit)} / IMEI
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-xs font-bold text-muted-foreground/50 tracking-wider">02</span>
              <h2 className="text-lg font-bold text-foreground">Daftar IMEI</h2>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5">
              <ImeiInput
                value={imeiText}
                onChange={setImeiText}
                label={service.inputLabel}
                disabled={isSubmitting}
              />
            </div>
          </section>

          {service.requiresAgreement && (
            <section>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xs font-bold text-muted-foreground/50 tracking-wider">03</span>
                <h2 className="text-lg font-bold text-foreground">Persetujuan</h2>
              </div>

              <div className="bg-card rounded-2xl border border-border px-5 py-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={isSubmitting}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                      agreed
                        ? "bg-blue-500 border-blue-500"
                        : "border-border group-hover:border-blue-400"
                    )}>
                      {agreed && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">
                    Saya sudah membaca dan menyetujui{" "}
                    <button
                      type="button"
                      onClick={() => setShowTnC(true)}
                      className="text-blue-500 hover:text-blue-600 font-semibold underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                    >
                      <FileText size={13} />
                      Syarat &amp; Ketentuan
                    </button>
                  </span>
                </label>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/30">

              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ringkasan</span>
                <span className="text-[10px] font-mono text-blue-400 tracking-wider">#BARU</span>
              </div>

              <div className="px-5 pb-4">
                <h3 className="text-base font-bold text-white leading-snug">{service.name}</h3>
              </div>

              <div className="h-px bg-slate-700/50 mx-5" />

              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Harga per IMEI</span>
                  <span className="text-white font-mono font-medium">{formatRupiah(service.pricePerUnit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">IMEI valid</span>
                  <span className="text-white font-mono font-medium">
                    {validImeis.length} <span className="text-slate-500">×</span>
                  </span>
                </div>
                {invalidImeis.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Perlu diperbaiki</span>
                    <span className="text-red-400 font-mono font-medium">{invalidImeis.length} baris</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-700/50 mx-5" />

              <div className="px-5 py-4">
                <p className="text-[11px] text-slate-500 font-medium mb-1">Total bayar</p>
                <p className={cn(
                  "text-3xl font-black tracking-tight transition-colors",
                  validImeis.length > 0 ? "text-white" : "text-slate-600"
                )}>
                  {formatRupiah(totalPrice)}
                </p>
              </div>

              <div className="mx-5 flex items-center gap-2.5 px-3.5 py-3 bg-slate-800 rounded-xl">
                <QrCode size={16} className="text-blue-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">Bayar dengan QRIS</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">GoPay, DANA, OVO, ShopeePay, e-wallet</p>
                </div>
              </div>

              <div className="p-5">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                    canSubmit
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
                      : "bg-slate-700 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      {canSubmit
                        ? `Bayar ${formatRupiah(totalPrice)}`
                        : "Masukkan IMEI"
                      }
                    </>
                  )}
                </button>

                {orderError && (
                  <div className="mt-3 flex items-start gap-2.5 px-3.5 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-red-400">Gagal membuat pesanan</p>
                      <p className="text-[11px] text-red-300/80 mt-0.5">{orderError}</p>
                    </div>
                    <button
                      onClick={() => setOrderError(null)}
                      className="text-red-400/60 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {invalidImeis.length > 0 && validImeis.length > 0 && (
                  <p className="text-[10px] text-slate-500 text-center mt-3">
                    Baris yang belum valid tidak ikut dihitung.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {mounted && showTnC && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTnC(false); }}
        >
          <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border animate-fade-in flex flex-col" style={{ maxHeight: "calc(100vh - 2rem)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">Syarat &amp; Ketentuan</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {service.name.includes("Roamer") ? "Add Roamer" : service.name}
                </p>
              </div>
              <button
                onClick={() => setShowTnC(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <SyaratKetentuanContent />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
