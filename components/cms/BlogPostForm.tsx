"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type {
  BlogCategoryOption,
  BlogPost,
  BlogPostCategoryKey,
  BlogPostStatus,
  CreateBlogPostInput,
} from "@/lib/types";
import { ImageField } from "@/components/cms/ImageField";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, Spinner, SuccessBanner } from "@/components/ui/Feedback";

const DEFAULT_GRADIENT = "from-emerald-400/40 to-teal-600/30";

const GRADIENT_PRESETS = [
  "from-emerald-400/40 to-teal-600/30",
  "from-orange-400/40 to-red-500/30",
  "from-amber-400/40 to-yellow-600/20",
  "from-rose-400/40 to-purple-500/20",
  "from-sky-400/40 to-indigo-500/30",
  "from-slate-400/40 to-slate-700/40",
];

function paragraphsToText(paragraphs: string[]): string {
  return paragraphs.join("\n\n");
}

function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function youtubeEmbedFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") id = parsed.searchParams.get("v");
      else {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (
          (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") &&
          parts[1]
        ) {
          id = parts[1];
        }
      }
    }
    return id && /^[\w-]{11}$/.test(id)
      ? `https://www.youtube.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}

export function BlogPostForm({ postId }: { postId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<BlogCategoryOption[]>([]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "FOOD" as BlogPostCategoryKey,
    bodyText: "",
    coverGradient: DEFAULT_GRADIENT,
    coverImageUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    readTimeMinutes: "5",
    status: "DRAFT" as BlogPostStatus,
  });

  const isVideo = form.category === "VIDEOS";
  const embedPreview = useMemo(
    () => youtubeEmbedFromUrl(form.youtubeUrl),
    [form.youtubeUrl],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cats = await api.get<BlogCategoryOption[]>("/admin/blog/categories");
        if (!cancelled) setCategories(cats);

        if (postId) {
          const post = await api.get<BlogPost>(`/admin/blog/posts/${postId}`);
          if (!cancelled) {
            setForm({
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              category: post.categoryKey,
              bodyText: paragraphsToText(post.bodyParagraphs),
              coverGradient: post.coverGradient,
              coverImageUrl: post.coverImageUrl ?? "",
              youtubeUrl: post.youtubeUrl ?? "",
              tiktokUrl: post.tiktokUrl ?? "",
              readTimeMinutes: String(post.readTimeMinutes),
              status: post.status,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load post.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: CreateBlogPostInput = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      category: form.category,
      bodyParagraphs: textToParagraphs(form.bodyText),
      coverGradient: form.coverGradient.trim() || DEFAULT_GRADIENT,
      coverImageUrl: form.coverImageUrl.trim() || null,
      youtubeUrl: form.youtubeUrl.trim() || null,
      tiktokUrl: form.tiktokUrl.trim() || null,
      readTimeMinutes: Number(form.readTimeMinutes) || 1,
      status: form.status,
    };

    try {
      if (isEdit && postId) {
        await api.patch(`/admin/blog/posts/${postId}`, payload);
        setSuccess("Post saved.");
      } else {
        await api.post("/admin/blog/posts", payload);
        router.push("/blog");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save post.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!postId) return;
    setArchiving(true);
    setError(null);
    try {
      await api.patch(`/admin/blog/posts/${postId}/archive`);
      router.push("/blog");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to archive post.");
    } finally {
      setArchiving(false);
    }
  }

  if (loading) return <Spinner label="Loading post…" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {isEdit ? "Edit journal post" : "New journal post"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Articles and Videos appear on the public Food & Wellness Journal.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Content" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Field label="Title" className="md:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </Field>
            <Field label="Slug" hint="Leave blank to auto-generate from title">
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="my-post-slug"
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as BlogPostCategoryKey,
                  }))
                }
              >
                {(categories.length
                  ? categories
                  : [{ key: "FOOD" as const, label: "Food" }]
                ).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Excerpt" className="md:col-span-2">
              <Textarea
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                required
              />
            </Field>
            <Field
              label={isVideo ? "Captions (optional)" : "Body paragraphs"}
              hint="Separate paragraphs with a blank line"
              className="md:col-span-2"
            >
              <Textarea
                rows={10}
                value={form.bodyText}
                onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))}
                required={!isVideo}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Media & links" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Field label="Cover gradient" className="md:col-span-2">
              <Select
                value={
                  GRADIENT_PRESETS.includes(form.coverGradient)
                    ? form.coverGradient
                    : "__custom"
                }
                onChange={(e) => {
                  if (e.target.value !== "__custom") {
                    setForm((f) => ({ ...f, coverGradient: e.target.value }));
                  }
                }}
              >
                {GRADIENT_PRESETS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__custom">Custom (edit below)</option>
              </Select>
              <Input
                className="mt-2"
                value={form.coverGradient}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverGradient: e.target.value }))
                }
              />
            </Field>
            <div className="md:col-span-2">
              <ImageField
                label="Cover image (optional)"
                value={form.coverImageUrl}
                onChange={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
              />
            </div>
            <Field
              label="YouTube URL"
              hint={isVideo ? "Required for Videos — embeds on the site" : "Optional"}
              className="md:col-span-2"
            >
              <Input
                value={form.youtubeUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, youtubeUrl: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=…"
                required={isVideo}
              />
            </Field>
            {embedPreview ? (
              <div className="md:col-span-2 overflow-hidden rounded-xl border border-slate-200">
                <iframe
                  title="YouTube preview"
                  src={embedPreview}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            <Field
              label="TikTok URL (optional)"
              hint="Opens externally — not embedded"
              className="md:col-span-2"
            >
              <Input
                value={form.tiktokUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tiktokUrl: e.target.value }))
                }
                placeholder="https://www.tiktok.com/@…"
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Publishing" />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as BlogPostStatus,
                  }))
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Field>
            <Field label="Read time (minutes)">
              <Input
                type="number"
                min={1}
                value={form.readTimeMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, readTimeMinutes: e.target.value }))
                }
              />
            </Field>
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create post"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/blog")}
          >
            Cancel
          </Button>
          {isEdit ? (
            <Button
              type="button"
              variant="danger"
              disabled={archiving}
              onClick={() => void handleArchive()}
            >
              {archiving ? "Archiving…" : "Archive"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
