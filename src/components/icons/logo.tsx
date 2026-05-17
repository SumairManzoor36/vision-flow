import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.SVGProps<SVGSVGElement> & { size?: number };

export function Logo({ size = 32, className, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="vafp-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3a64ff" />
          <stop offset="0.5" stopColor="#6c5cff" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="vafp-grad-2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#vafp-grad)" />
      <path
        d="M14 18 L24 12 L34 18 L34 30 L24 36 L14 30 Z"
        stroke="url(#vafp-grad-2)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="24" cy="24" r="4.5" fill="white" />
      <circle cx="24" cy="24" r="2" fill="#3a64ff" />
      <path
        d="M14 18 L24 24 M34 18 L24 24 M24 24 L24 36"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoMark({ size = 24, className, ...props }: Props) {
  return <Logo size={size} className={className} {...props} />;
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo size={28} />
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">Vision Audit</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Flow Pro
        </span>
      </div>
    </div>
  );
}
