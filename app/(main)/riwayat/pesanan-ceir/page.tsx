import { Suspense } from "react";
import { HistoryPage } from "@/components/history/history-page";

export default function RiwayatCeirPage() {
  return (
    <Suspense>
      <HistoryPage
        category="CEIR"
        title="Riwayat Pesanan CEIR"
        subtitle="Layanan pengecekan IMEI — Check Status, Device History, Validity, Bea Cukai"
        emptyMessage="Belum ada pesanan layanan CEIR"
      />
    </Suspense>
  );
}
