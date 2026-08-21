"use client";

import type { AiProviderChoice } from "@/lib/types";
import { Select } from "@/components/ui/Input";

export function AiProviderMenu({
  value,
  onChange,
}: {
  value: AiProviderChoice;
  onChange: (value: AiProviderChoice) => void;
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as AiProviderChoice)}
      className="w-auto"
    >
      <option value="auto">Auto (Claude / ChatGPT)</option>
      <option value="anthropic">Claude</option>
      <option value="openai">ChatGPT</option>
    </Select>
  );
}
