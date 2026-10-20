import { Suspense } from "react";
import { HistoryPage } from "@/components/history/history-page";

export default function RiwayatGsmPage() {
  return (
    <Suspense>
      <HistoryPage
        category="GSM"
        title="Riwayat Pesanan GSM"
        subtitle="Layanan GSM — Apple Carrier & SIMLock, Pembuatan Apple ID/iCloud"
        emptyMessage="Belum ada pesanan layanan GSM"
      />
    </Suspense>
  );
}
