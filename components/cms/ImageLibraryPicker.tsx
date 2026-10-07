"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MediaLibraryItem, MediaLibraryResponse } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

const PAGE_SIZE = 24;

function isUploadedFile(item: MediaLibraryItem): boolean {
  return /^[A-Za-z0-9_-]+$/.test(item.fileId);
}

export function ImageLibraryPicker({
  open,
  selectedUrl,
  onClose,
  onSelect,
  onDeleted,
}: {
  open: boolean;
  selectedUrl: string;
  onClose: () => void;
  onSelect: (url: string) => void;
  onDeleted?: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaLibraryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(0);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const requestRef = useRef(0);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setItems([]);
      setError(null);
      setHasMore(false);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    skipRef.current = 0;
    hasMoreRef.current = true;
    seenRef.current = new Set();
    setItems([]);
    setError(null);
    setHasMore(true);
    void loadPage(requestId, true);
    // loadPage is recreated each render; the search term is the only trigger we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debounced]);

  useEffect(() => {
    if (!open || !hasMore) return;
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadPage(requestRef.current, false);
        }
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasMore, items.length]);

  async function loadPage(requestId: number, replace: boolean) {
    if (!replace && (loadingRef.current || !hasMoreRef.current)) return;
    if (replace) hasMoreRef.current = true;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    let nextSkip = replace ? 0 : skipRef.current;
    let more = false;
    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const params = new URLSearchParams({
          skip: String(nextSkip),
          limit: String(PAGE_SIZE),
        });
        if (debounced) params.set("q", debounced);
        const page = await api.get<MediaLibraryResponse>(`/media/library?${params}`);
        if (requestId !== requestRef.current) return;
        nextSkip += PAGE_SIZE;
        more = page.hasMore;
        const fresh = page.items.filter((item) => {
          if (!item.url || seenRef.current.has(item.url)) return false;
          seenRef.current.add(item.url);
          return true;
        });
        if (fresh.length > 0) {
          setItems((prev) => (replace && attempt === 0 ? fresh : [...prev, ...fresh]));
        }
        if (!more || fresh.length > 0) break;
      }
      if (requestId !== requestRef.current) return;
      skipRef.current = nextSkip;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      hasMoreRef.current = false;
      setHasMore(false);
      setError(err instanceof ApiError ? err.message : "Could not load images.");
    } finally {
      if (requestId === requestRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/media/files/${encodeURIComponent(pendingDelete.fileId)}`);
      const removedUrl = pendingDelete.url;
      seenRef.current.delete(removedUrl);
      setItems((prev) => prev.filter((item) => item.url !== removedUrl));
      onDeleted?.(removedUrl);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Could not delete image.");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close image library"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-library-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="image-library-title" className="text-lg font-semibold text-slate-900">
              Choose an existing photo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Scroll to load more. Selecting a photo reuses its URL. Uploaded photos can be deleted when they are no longer used.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-5 py-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product or file name"
            aria-label="Search photos"
          />
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          {items.length === 0 && !loading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No photos yet. Upload one and it will show up here for reuse.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => {
                const selected = item.url === selectedUrl;
                const canDelete = isUploadedFile(item);
                return (
                  <div
                    key={item.url}
                    className={`overflow-hidden rounded-lg border transition-colors ${
                      selected
                        ? "border-indigo-500 ring-2 ring-indigo-500"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                    title={item.name}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(item.url)}
                      className="block w-full text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-cover"
                      />
                      <span className="block truncate px-2 py-1.5 text-xs text-slate-600">{item.name}</span>
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        className="w-full border-t border-slate-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeleteError(null);
                          setPendingDelete(item);
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <div ref={sentinelRef} className="h-8" />
          {loading ? <p className="pb-2 text-center text-sm text-slate-500">Loading photos…</p> : null}
        </div>
      </div>
      <Dialog
        open={pendingDelete !== null}
        title="Delete this uploaded image?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed from the library. Images still used on a product, category, package, or post cannot be deleted.`
            : undefined
        }
        confirmLabel="Delete image"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
      >
        {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
      </Dialog>
    </div>
  );
}
