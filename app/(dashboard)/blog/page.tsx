"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { paginate } from "@/lib/catalog";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { BlogCategoryOption, BlogPost, BlogPostStatus } from "@/lib/types";
import {
  CatalogEmpty,
  CatalogSkeleton,
  PaginationBar,
  SearchField,
  ViewToggle,
  useCatalogView,
} from "@/components/cms/catalog-ui";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";

function statusTone(status: BlogPostStatus): "success" | "neutral" | "warning" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PostCard({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div
        className={`relative flex flex-col justify-end bg-linear-to-br p-4 text-slate-900 ${
          compact ? "min-h-24" : "min-h-32"
        } ${post.coverGradient}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {post.category}
        </p>
        <p className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>{post.title}</p>
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="truncate text-xs text-slate-500">{post.slug}</p>
        <Badge tone={statusTone(post.status)}>{post.status}</Badge>
      </div>
    </Link>
  );
}

export default function BlogListPage() {
  const [rows, setRows] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [view, setView] = useCatalogView();
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (category) query.set("category", category);
        if (status) query.set("status", status);
        const qs = query.toString();
        const [posts, cats] = await Promise.all([
          api.get<BlogPost[]>(`/admin/blog/posts${qs ? `?${qs}` : ""}`),
          api.get<BlogCategoryOption[]>("/admin/blog/categories"),
        ]);
        if (!cancelled) {
          setRows(posts);
          setCategories(cats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load posts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, status]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        row.excerpt.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q),
    );
  }, [rows, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status, pageSize]);

  const paged = paginate(filtered, page, pageSize);

  const columns: Column<BlogPost>[] = [
    {
      id: "post",
      header: "Post",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500">{row.slug}</p>
        </div>
      ),
    },
    { id: "category", header: "Category", accessor: (row) => row.category },
    {
      id: "published",
      header: "Published",
      accessor: (row) => formatDate(row.publishedAt),
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      id: "edit",
      header: "",
      accessor: (row) => (
        <Link href={`/blog/${row.id}`} className="text-sm font-medium text-indigo-600">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Journal posts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage articles and video links for the marketing blog.
          </p>
        </div>
        <Link href="/blog/new">
          <Button>New post</Button>
        </Link>
      </div>
      {error ? <ErrorBanner message={error} /> : null}

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Search" className="md:col-span-1">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search title, slug…"
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-900">
            {filtered.length} post{filtered.length === 1 ? "" : "s"}
          </p>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {loading ? (
          <CatalogSkeleton view={view} />
        ) : paged.total === 0 ? (
          <CatalogEmpty
            title={rows.length === 0 ? "Create the first journal post." : "No posts match these filters."}
            action={
              rows.length === 0 ? (
                <Link href="/blog/new">
                  <Button>New post</Button>
                </Link>
              ) : null
            }
          />
        ) : view === "table" ? (
          <DataTable columns={columns} rows={paged.slice} keyFor={(row) => row.id} />
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4"
                : "grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3"
            }
          >
            {paged.slice.map((post) => (
              <PostCard key={post.id} post={post} compact={view === "grid"} />
            ))}
          </div>
        )}
        <PaginationBar
          page={paged.page}
          pageCount={paged.pageCount}
          pageSize={pageSize}
          total={paged.total}
          from={paged.from}
          to={paged.to}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
