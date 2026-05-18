"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Loader2, Download, CheckCircle2, Send, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type IconType = React.FC<LucideProps>;

/**
 * DoubleConfirmButton - Best for destructive or high-consequence actions (Reject, Delete)
 * Features "Confirm?" step to prevent accidental clicks.
 */
interface DoubleConfirmButtonProps {
  idleText: string;
  confirmText?: string;
  successText?: string;
  idleIcon?: IconType;
  confirmIcon?: IconType;
  successIcon?: IconType;
  idleClasses?: string;
  confirmClasses?: string;
  successClasses?: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
}

export function DoubleConfirmButton({
  idleText,
  confirmText = "Confirm?",
  successText = "Done",
  idleIcon: IdleIcon,
  confirmIcon: ConfirmIcon = AlertCircle as IconType,
  successIcon: SuccessIcon = Check as IconType,
  idleClasses = "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800",
  confirmClasses = "bg-red-500/10 text-red-500 border border-red-500/50",
  successClasses = "bg-red-500 text-white",
  onConfirm,
  className,
}: DoubleConfirmButtonProps) {
  const [step, setStep] = useState(0);

  const handleClick = async () => {
    if (step === 0) setStep(1);
    else if (step === 1) {
      setStep(2);
      await onConfirm();
      setTimeout(() => setStep(0), 3000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative rounded-lg font-semibold transition-all duration-300 overflow-hidden flex items-center justify-center text-sm select-none h-10 px-5",
        step === 0 ? idleClasses : step === 1 ? confirmClasses : successClasses,
        className
      )}
    >
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="1" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
            {IdleIcon && <IdleIcon size={16} />} <span>{idleText}</span>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="2" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
            <ConfirmIcon size={16} /> <span>{confirmText}</span>
          </motion.div>
        )}
        {step === 2 && (
           <motion.div key="3" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
            <SuccessIcon size={16} /> <span>{successText}</span>
           </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * MorphingSubmitButton - Best for approval or standard submissions.
 * Morphing animation: Idle -> Loading -> Success
 */
interface MorphingSubmitButtonProps {
  idleText: string;
  loadingText?: string;
  successText?: string;
  idleIcon?: IconType;
  onAction: () => Promise<void> | void;
  className?: string;
  variant?: "primary" | "success" | "purple";
}

export function MorphingSubmitButton({
  idleText,
  loadingText = "Processing...",
  successText = "Approved",
  idleIcon: IdleIcon = Send as IconType,
  onAction,
  className,
  variant = "primary",
}: MorphingSubmitButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleClick = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    try {
      await onAction();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("idle");
    }
  };

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className={cn(
        "relative rounded-lg font-semibold transition-all duration-300 overflow-hidden flex items-center justify-center text-sm h-10 px-5",
        status === "success" ? "bg-emerald-500 text-white" : variantClasses[variant],
        className
      )}
    >
      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div key="idle" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
            {IdleIcon && <IdleIcon size={16} />} <span>{idleText}</span>
          </motion.div>
        )}
        {status === "loading" && (
          <motion.div key="loading" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> <span>{loadingText}</span>
          </motion.div>
        )}
        {status === "success" && (
          <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
            <Check size={16} /> <span>{successText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * AnimatedDownloadButton - Features a filling progress background.
 */
interface AnimatedDownloadButtonProps {
  onDownload: () => Promise<void> | void;
  className?: string;
  text?: string;
}

export function AnimatedDownloadButton({ onDownload, className, text = "Download PDF" }: AnimatedDownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleDownload = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    try {
      await onDownload();
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4500);
    } catch (error) {
      setStatus("idle");
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      className={cn(
        "relative font-semibold border rounded-lg overflow-hidden transition-all text-sm h-10 px-5",
        "bg-white text-black border-zinc-200 hover:bg-zinc-50",
        "dark:bg-[#1e2130] dark:text-[#d1d5db] dark:border-[#2e3347] dark:hover:bg-[#252837]",
        className
      )}
    >
      <AnimatePresence>
        {status === "loading" && (
           <motion.div 
             initial={{ width: 0 }} 
             animate={{ width: "100%" }} 
             transition={{ duration: 2.5, ease: "linear" }}
             className="absolute left-0 top-0 bottom-0 bg-blue-50 dark:bg-blue-500/10"
           />
        )}
      </AnimatePresence>
      <div className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
         <AnimatePresence mode="wait">
            {status === "idle" && (
               <motion.div key="i" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2">
                  <Download size={16} /> {text}
               </motion.div>
            )}
            {status === "loading" && (
               <motion.div key="l" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Loader2 size={16} className="animate-spin" /> <span>Downloading</span>
               </motion.div>
            )}
            {status === "done" && (
               <motion.div key="d" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} /> <span>Complete</span>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </button>
  );
}
