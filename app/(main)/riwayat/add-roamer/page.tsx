import { RoamerHistoryPage } from "@/components/history/roamer-history-page";

export default function RiwayatAddRoamerPage() {
  return (
    <RoamerHistoryPage
      category="UNLOCK_IMEI"
      title="Riwayat Pesanan Roamer"
      subtitle="Semua pesanan Add Roamer 1/3 Bulan"
      emptyMessage="Anda belum memiliki riwayat pesanan Roamer."
    />
  );
}
