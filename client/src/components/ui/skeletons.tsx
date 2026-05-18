import React from "react";

// ─── Shared building block ────────────────────────────────────────

function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-md animate-shimmer ${className}`}
      style={style}
    />
  );
}

// ─── Table rows skeleton (Products, Inventory, Orders…) ──────────

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-6 py-4 border-b bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-6 py-5 border-b last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Bone key={c} className={`h-4 flex-1 ${c === 0 ? "max-w-[180px]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── KPI stat cards skeleton ──────────────────────────────────────

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <Bone className="h-3 w-24" />
            <Bone className="h-8 w-8 rounded-lg" />
          </div>
          <Bone className="h-8 w-20" />
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// ─── Supplier card grid skeleton ──────────────────────────────────

export function SupplierCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-16" />
            </div>
            <Bone className="h-6 w-12 rounded" />
          </div>
          <div className="space-y-2">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-3 w-28 mt-2" />
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard skeleton (full page) ──────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Bone className="h-6 w-48" />
            <Bone className="h-3 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          {[120, 110, 100].map((w, i) => (
            <Bone key={i} className="h-9 rounded-lg" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* KPIs */}
      <StatCardsSkeleton count={4} />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Bone className="h-4 w-32" />
          <Bone className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="col-span-3 rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Bone className="h-4 w-28" />
          <Bone className="h-[300px] w-full rounded-lg" />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
          <TableSkeleton rows={5} cols={4} />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Bone className="h-4 w-24" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <Bone className="h-3 w-20" />
              <Bone className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Generic page skeleton (header + search + table) ─────────────

export function PageSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-8 w-40" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
      {/* Search bar */}
      <div className="rounded-lg border bg-card p-4">
        <Bone className="h-9 w-full" />
      </div>
      {/* Table */}
      <TableSkeleton rows={rows} cols={cols} />
    </div>
  );
}


