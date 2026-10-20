"use client";

import * as LucideIcons from "lucide-react";

type DynamicIconProps = {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
};

export function DynamicIcon({ name, className, size = 18, style }: DynamicIconProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>>)[name];

  if (!IconComponent) {
    return <LucideIcons.Circle className={className} size={size} style={style} />;
  }

  return <IconComponent className={className} size={size} style={style} />;
}
