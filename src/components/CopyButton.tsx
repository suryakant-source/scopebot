"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: "default" | "primary" | "subtle";
}

export function CopyButton({
  text,
  label = "Copy section",
  copiedLabel = "Copied!",
  className = "",
  variant = "default",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const baseStyles =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

  const variantStyles = {
    default: copied
      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
      : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80",
    primary: copied
      ? "bg-emerald-600 text-white border border-emerald-500"
      : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-sm",
    subtle: copied
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-slate-800/50 hover:bg-slate-800 text-slate-300",
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={label}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
