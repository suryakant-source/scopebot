"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: "default" | "primary" | "subtle";
  size?: "sm" | "md";
}

export function CopyButton({
  text,
  label = "Copy section",
  copiedLabel = "Copied!",
  className = "",
  variant = "default",
  size = "sm",
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

  const sizeClasses =
    size === "sm" ? "px-2.5 py-1 text-xs gap-1.5" : "px-3.5 py-1.5 text-xs sm:text-sm gap-2";

  const baseStyles = `inline-flex items-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${sizeClasses}`;

  const variantStyles = {
    default: copied
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
      : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900/90 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
    primary: copied
      ? "bg-emerald-600 text-white border border-emerald-600 shadow-sm"
      : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-600 shadow-sm dark:shadow-none",
    subtle: copied
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60",
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 opacity-70 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
