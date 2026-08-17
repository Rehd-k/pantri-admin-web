"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { MediaUpload } from "@/lib/types";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ImageField({
  label,
  hint,
  value,
  onChange,
  required = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api.upload<MediaUpload>("/media/upload", form);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
          />
        ) : null}
        <Input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Upload image
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    </Field>
  );
}
