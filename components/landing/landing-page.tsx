"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Globe,
  ArrowRight,
  Menu,
  X,
  Fingerprint,
  Lock,
  CreditCard,
  CheckCircle,
  Star,
  Zap,
  Users,
  Clock,
  BadgeCheck,
  Mail,
  MessageSquare,
} from "lucide-react";
import { CekbarLogo, CekbarIcon, CekbarWordmark } from "@/components/ui/cekbar-logo";

const ANIMATION_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes lp-line-grow {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-12px) rotate(2deg); }
  }
  @keyframes lp-float-rev {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-10px) rotate(-2deg); }
  }
  @keyframes lp-pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.75); }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lp-blob {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }
  @keyframes lp-gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes lp-pulse-badge {
    0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
    70%  { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
    100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  }

  .lp-float      { animation: lp-float     5s ease-in-out infinite; }
  .lp-float-rev  { animation: lp-float-rev 6s ease-in-out infinite; }
  .lp-blob       { animation: lp-blob      8s ease-in-out infinite; }

  .lp-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .lp-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 48px -12px rgba(37,99,235,0.15);
    border-color: #93c5fd;
  }

  .lp-connector {
    background: linear-gradient(90deg, #bfdbfe 0%, #3B82F6 50%, #bfdbfe 100%);
    background-size: 200% auto;
    animation: lp-shimmer 2.5s linear infinite;
  }

  .lp-progress {
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    background: linear-gradient(90deg, #1D4ED8, #60a5fa, #1D4ED8);
    background-size: 200% auto;
    animation: lp-shimmer 2s linear infinite;
    z-index: 100;
    transition: width 0.1s linear;
  }

  .lp-heading-line::after {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(90deg, #1D4ED8, #60a5fa);
    border-radius: 4px;
    margin-top: 10px;
    width: 0;
    transition: width 0.7s cubic-bezier(.22,.68,0,1.1) 0.2s;
  }
  .lp-heading-line.lp-visible::after { width: 56px; }

  .lp-gradient-text {
    background: linear-gradient(135deg, #93c5fd, #60a5fa, #38bdf8, #93c5fd);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-gradient-x 4s ease infinite;
  }

  .lp-badge-glow { animation: lp-pulse-badge 2.5s infinite; }

  .lp-icon-glow { transition: box-shadow 0.25s ease; }
  .lp-icon-glow:hover { box-shadow: 0 8px 24px -4px rgba(37,99,235,0.5); }
`;

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCounter(target: number, duration = 1400, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [start, target, duration]);
  return count;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      setProgress(doc.scrollHeight - doc.clientHeight > 0
        ? (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const progress = useScrollProgress();

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Layanan", href: "#layanan" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Kontak", href: "#kontak" },
  ];

  return (
    <>
      <div className="lp-progress" style={{ width: `${progress}%` }} />
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-blue-100/60 shadow-lg shadow-blue-900/5"
          : "bg-transparent"
          }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 sm:h-[72px] items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <CekbarIcon size={36} className="transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-4deg]" />
              <CekbarWordmark variant={scrolled ? "light" : "dark"} size="md" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 text-[13.5px] font-medium rounded-lg transition-colors ${scrolled
                    ? "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                    : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className={`px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
                  }`}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-[13.5px] font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg shadow-blue-600/25 transition-all duration-200 hover:from-blue-500 hover:to-blue-600 active:scale-[0.97]"
              >
                Daftar Akun
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 shadow-xl">
            <div className="px-5 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link href="/login" className="block w-full px-4 py-3 text-sm font-semibold text-center text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                  Masuk
                </Link>
                <Link href="/register" className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg transition-colors">
                  Daftar Akun
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center pt-16 pb-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 70%, #0369a1 100%)" }}
    >
      <div aria-hidden="true" className="lp-blob absolute top-[-10%] left-[-5%] w-[500px] h-[500px] opacity-20 rounded-full"
        style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }} />
      <div aria-hidden="true" className="lp-float-rev absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] opacity-15 rounded-full"
        style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", animationDelay: "2s" }} />
      <div aria-hidden="true" className="lp-blob absolute top-[30%] right-[15%] w-[300px] h-[300px] opacity-10 rounded-full"
        style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)", animationDelay: "3s" }} />

      <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

      <div aria-hidden="true" className={`lp-float absolute top-[22%] left-[6%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-700 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20 border border-emerald-400/30">
          <CheckCircle size={16} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">Status IMEI</p>
          <p className="text-xs text-white font-bold">Terdaftar Legal ✓</p>
        </div>
      </div>

      <div aria-hidden="true" className={`lp-float-rev absolute top-[18%] right-[6%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-900 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400/20 border border-blue-400/30">
          <ShieldCheck size={16} className="text-blue-300" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">Bea Cukai</p>
          <p className="text-xs text-white font-bold">Resmi Terdaftar ✓</p>
        </div>
      </div>

      <div aria-hidden="true" className={`lp-float absolute bottom-[25%] left-[8%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-[1100ms] ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-400/30">
          <Star size={16} className="text-amber-400" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">10.000+</p>
          <p className="text-xs text-white font-bold">Cek Berhasil</p>
        </div>
      </div>

      <div aria-hidden="true" className={`lp-float-rev absolute bottom-[28%] right-[7%] hidden lg:flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 transition-all duration-1000 delay-[1300ms] ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/20 border border-cyan-400/30">
          <Zap size={16} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-[11px] text-blue-200 font-medium">Hasil Instan</p>
          <p className="text-xs text-white font-bold">Real-time CEIR</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 w-full">
        <div className="max-w-3xl mx-auto text-center">

          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="lp-badge-glow inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: "lp-pulse-dot 2s ease-in-out infinite" }} />
              <span className="text-xs font-semibold text-blue-100 tracking-wide">Platform verifikasi IMEI resmi Indonesia</span>
            </div>
          </div>

          <h1 className={`text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.08] tracking-[-0.04em] text-white transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Pastikan perangkat Anda{" "}
            <span className="lp-gradient-text">asli & legal</span>{" "}
            sebelum membeli
          </h1>

          <p className={`mt-6 text-lg sm:text-xl leading-relaxed text-blue-200 max-w-2xl mx-auto transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            Cek status IMEI di database CEIR resmi, verifikasi Apple Carrier,
            dan pastikan perangkat terdaftar legal di Bea Cukai Indonesia.
          </p>

          <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <Link
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-blue-900 bg-white rounded-xl shadow-2xl shadow-white/20 transition-all duration-200 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.97]"
            >
              Cek IMEI Sekarang
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-[15px] font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-200 hover:bg-white/20"
            >
              Masuk ke Akun
            </Link>
          </div>

          <div className={`mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
            {[
              { icon: CheckCircle, text: "Database CEIR Resmi" },
              { icon: BadgeCheck, text: "Verifikasi Bea Cukai" },
              { icon: Clock, text: "Hasil Instan" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-sm text-blue-200">
                <Icon size={14} className="text-emerald-400" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full">
          <path d="M0 80L60 72C120 64 240 48 360 40C480 32 600 32 720 37.3C840 43 960 53 1080 58.7C1200 64 1320 64 1380 64L1440 64V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Search, title: "Cek Status IMEI", desc: "Verifikasi IMEI perangkat di database CEIR resmi Indonesia. Pastikan perangkat tidak terblokir dan terdaftar secara legal.", color: "from-blue-500 to-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
  { icon: Globe, title: "Cek Validity Roamer", desc: "Periksa apakah IMEI aktif sebagai roamer dan cek masa berlakunya. Informasi akurat langsung dari sistem resmi.", color: "from-cyan-500 to-cyan-700", bg: "bg-cyan-50", border: "border-cyan-100" },
  { icon: Fingerprint, title: "Apple Carrier & SIMLock", desc: "Cek status carrier lock dan SIMLock perangkat Apple. Ketahui apakah iPhone yang Anda beli bisa digunakan bebas di Indonesia.", color: "from-indigo-500 to-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" },
  { icon: Lock, title: "Cek IMEI Bea Cukai", desc: "Verifikasi apakah perangkat sudah terdaftar resmi di Bea Cukai Indonesia. Hindari perangkat ilegal yang bisa diblokir sewaktu-waktu.", color: "from-sky-500 to-sky-700", bg: "bg-sky-50", border: "border-sky-100" },
  { icon: ShieldCheck, title: "Lindungi dari Penipuan", desc: "Jangan beli perangkat bekas tanpa verifikasi. Cek IMEI sebelum transaksi untuk memastikan perangkat aman dan tidak bermasalah.", color: "from-emerald-500 to-teal-700", bg: "bg-emerald-50", border: "border-emerald-100" },
  { icon: CreditCard, title: "Pembayaran via QRIS", desc: "Proses cepat, bayar langsung via QRIS. Tanpa ribet, tanpa daftar kartu — cukup scan dan selesai.", color: "from-violet-500 to-purple-700", bg: "bg-violet-50", border: "border-violet-100" },
];

function Features() {
  const { ref: titleRef, visible: titleVisible } = useReveal(0.2);
  const { ref: gridRef, visible: gridVisible } = useReveal(0.1);

  return (
    <section id="layanan" className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">

        <div ref={titleRef} className="max-w-2xl mx-auto text-center mb-14 sm:mb-16">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4 transition-all duration-500 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Layanan</span>
          </div>
          <h2 className={`lp-heading-line text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 transition-all duration-600 delay-100 ${titleVisible ? "opacity-100 translate-y-0 lp-visible" : "opacity-0 translate-y-4"}`}>
            Verifikasi IMEI perangkat Anda sebelum membeli
          </h2>
          <p className={`mt-4 text-base sm:text-lg text-slate-500 leading-relaxed transition-all duration-600 delay-200 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Jangan ambil risiko membeli perangkat ilegal atau bermasalah. Cek keaslian dan legalitas IMEI hanya dalam hitungan detik.
          </p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`lp-card group ${f.bg} ${f.border} border rounded-2xl p-6 sm:p-7 transition-all ${gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDuration: "550ms", transitionDelay: gridVisible ? `${i * 70}ms` : "0ms" }}
            >
              <div className={`lp-icon-glow inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white mb-5 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]`}>
                <f.icon size={22} strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { step: "01", title: "Buat Akun", desc: "Daftar akun Cekbar secara gratis. Cukup email dan password, langsung bisa digunakan.", icon: Users },
  { step: "02", title: "Pilih Layanan", desc: "Pilih jenis pengecekan yang Anda butuhkan — status CEIR, Apple Carrier, Bea Cukai, dan lainnya.", icon: Search },
  { step: "03", title: "Masukkan IMEI", desc: "Input nomor IMEI perangkat yang ingin dicek. Nomor IMEI biasanya tertera di kotak atau pengaturan perangkat.", icon: Fingerprint },
  { step: "04", title: "Bayar & Lihat Hasil", desc: "Bayar via QRIS, dan hasil verifikasi langsung tampil. Proses cepat, akurat, dan terpercaya.", icon: CheckCircle },
];

function HowItWorks() {
  const { ref: titleRef, visible: titleVisible } = useReveal(0.2);
  const { ref: stepsRef, visible: stepsVisible } = useReveal(0.1);

  return (
    <section id="cara-kerja" className="py-20 sm:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)" }}
    >
      <div aria-hidden="true" className="absolute top-0 right-0 w-[400px] h-[400px] opacity-[0.08] rounded-full"
        style={{ background: "radial-gradient(circle, #1D4ED8, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-[300px] h-[300px] opacity-[0.08] rounded-full"
        style={{ background: "radial-gradient(circle, #1D4ED8, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div ref={titleRef} className="max-w-2xl mx-auto text-center mb-14 sm:mb-16">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 mb-4 transition-all duration-500 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Cara Kerja</span>
          </div>
          <h2 className={`lp-heading-line text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 transition-all duration-600 delay-100 ${titleVisible ? "opacity-100 translate-y-0 lp-visible" : "opacity-0 translate-y-4"}`}>
            Empat langkah sederhana
          </h2>
          <p className={`mt-4 text-base sm:text-lg text-slate-500 leading-relaxed transition-all duration-600 delay-200 ${titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Proses yang mudah dan transparan dari awal hingga akhir.
          </p>
        </div>

        <div ref={stepsRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STEPS.map((item, i) => (
            <div
              key={item.step}
              className={`relative transition-all ${stepsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDuration: "600ms", transitionDelay: stepsVisible ? `${i * 100}ms` : "0ms" }}
            >
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`hidden lg:block absolute top-8 left-[calc(50%+32px)] h-px overflow-hidden transition-all duration-700 ${stepsVisible ? "w-[calc(100%-64px)]" : "w-0"}`}
                  style={{ transitionDelay: stepsVisible ? `${i * 100 + 400}ms` : "0ms" }}
                >
                  <div className="lp-connector h-full w-full" />
                </div>
              )}

              <div className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-600/30">
                    <item.icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-blue-600 text-[10px] font-black text-blue-700 shadow-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, suffix, label, delay, start }: { value: number; suffix: string; label: string; delay: number; start: boolean }) {
  const count = useCounter(value, 1400, start);
  return (
    <div
      className={`text-center transition-all duration-700 ${start ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
        {count.toLocaleString("id-ID")}{suffix}
      </p>
      <div className="w-8 h-0.5 bg-blue-400/50 rounded mx-auto my-2" />
      <p className="text-sm text-blue-300 font-medium">{label}</p>
    </div>
  );
}

function Stats() {
  const { ref, visible } = useReveal(0.2);
  const stats = [
    { value: 10000, suffix: "+", label: "Transaksi diproses" },
    { value: 99, suffix: ".9%", label: "Uptime layanan" },
    { value: 3, suffix: " jam", label: "Rata-rata proses" },
    { value: 24, suffix: "/7", label: "Layanan tersedia" },
  ];

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}
    >
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((s, i) => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} delay={i * 120} start={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Kontak() {
  const { ref, visible } = useReveal(0.1);

  const contactItems = [
    {
      icon: Mail,
      title: "Email",
      value: "support@barasystem.id",
      desc: "Respons dalam 1×24 jam",
      href: "mailto:support@barasystem.id",
      color: "from-blue-500 to-blue-700",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp",
      value: "+62 812-3456-7890",
      desc: "Chat langsung dengan tim kami",
      href: "https://wa.me/6281234567890",
      color: "from-emerald-500 to-emerald-700",
    },
    {
      icon: Clock,
      title: "Jam Operasional",
      value: "Senin – Jumat",
      desc: "08.00 – 17.00 WIB",
      href: null,
      color: "from-violet-500 to-violet-700",
    },
  ];

  return (
    <section id="kontak" className="py-20 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">Hubungi Kami</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
              Ada yang bisa kami{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #1d4ed8, #60a5fa)" }}>
                bantu?
              </span>
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">
              Tim kami siap membantu Anda seputar verifikasi IMEI, kendala akun, atau pertanyaan tentang layanan.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const card = (
                <div className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 h-full lp-card">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg mb-5`}>
                    <Icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{item.title}</p>
                  <p className="text-base font-bold text-slate-900 mb-1">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              );
              return item.href ? (
                <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="block">{card}</a>
              ) : (
                <div key={item.title}>{card}</div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { ref, visible } = useReveal(0.2);

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          ref={ref}
          className={`relative rounded-3xl px-6 sm:px-12 py-14 sm:py-20 text-center overflow-hidden transition-all duration-700 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"}`}
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0369a1 100%)" }}
        >
          <div aria-hidden="true" className="absolute top-0 left-0 w-[300px] h-[300px] opacity-20 rounded-full"
            style={{ background: "radial-gradient(circle, #93c5fd, transparent 70%)", transform: "translate(-40%, -40%)" }} />
          <div aria-hidden="true" className="absolute bottom-0 right-0 w-[250px] h-[250px] opacity-20 rounded-full"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)", transform: "translate(40%, 40%)" }} />
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

          <div className="relative">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6 transition-all duration-500 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-blue-100">Terpercaya & Akurat</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight text-white transition-all duration-600 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Cek IMEI sebelum terlambat
            </h2>
            <p className={`mt-4 text-base sm:text-lg text-blue-200 max-w-xl mx-auto leading-relaxed transition-all duration-600 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Ribuan perangkat beredar tanpa status yang jelas. Pastikan perangkat Anda aman, legal, dan tidak akan diblokir — sebelum Anda menyesal.
            </p>
            <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-600 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <Link href="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-[15px] font-bold text-blue-900 bg-white rounded-xl shadow-2xl shadow-black/20 transition-all duration-200 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.97]">
                Daftar Akun Gratis
                <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-[15px] font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/25 rounded-xl transition-all duration-200 hover:bg-white/20">
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { ref, visible } = useReveal(0.1);

  return (
    <footer id="kontak" className="border-t border-blue-100"
      style={{ background: "linear-gradient(180deg, #eff6ff 0%, #dbeafe 60%, #eff6ff 100%)" }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 sm:py-16">
        <div
          ref={ref}
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <CekbarLogo variant="light" size="sm" />
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Platform verifikasi IMEI terpercaya. Pastikan perangkat Anda asli, legal, dan aman sebelum membeli.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Layanan</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {[
                "Check IMEI Status",
                "Apple Carrier Check",
                "Check IMEI Bea Cukai",
                "Cek Validity Roamer",
              ].map((label) => (
                <li key={label}>
                  <Link href="/dashboard" className="hover:text-blue-600 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><Link href="/login" className="hover:text-blue-600 transition-colors">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-blue-600 transition-colors">Daftar Akun</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-4">Informasi</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li><span className="hover:text-blue-600 transition-colors cursor-default">Cara Baca Hasil</span></li>
              <li><span className="hover:text-blue-600 transition-colors cursor-default">FAQ</span></li>
              <li><Link href="#kontak" className="hover:text-blue-600 transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
        </div>

        <div className={`mt-12 pt-8 border-t border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-700 delay-200 ${visible ? "opacity-100" : "opacity-0"}`}>
          <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Cekbar. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  useEffect(() => {
    if (document.getElementById("lp-styles")) return;
    const style = document.createElement("style");
    style.id = "lp-styles";
    style.textContent = ANIMATION_STYLES;
    document.head.appendChild(style);
    return () => { document.getElementById("lp-styles")?.remove(); };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Kontak />
      <CTA />
      <Footer />
    </div>
  );
}
