"use client";

import { DynamicIcon } from "@/components/ui/dynamic-icon";

type StatCardProps = {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
  trend?: string;
};

export function StatCard({ icon, iconColor, iconBg, value, label, trend }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 card-hover relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-[0.06] rounded-full -translate-y-8 translate-x-8"
        style={{ backgroundColor: iconColor }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-black text-foreground tracking-tight">
            {value.toLocaleString("id-ID")}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1.5">{trend}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: iconBg }}
        >
          <DynamicIcon name={icon} size={22} className="shrink-0" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}
