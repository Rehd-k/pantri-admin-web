"use client";

export function StepEditor({
  steps,
  onChange,
}: {
  steps: string[];
  onChange: (steps: string[]) => void;
}) {
  function update(index: number, value: string) {
    onChange(steps.map((step, i) => (i === index ? value : step)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= steps.length) return;
    const copy = [...steps];
    const [removed] = copy.splice(index, 1);
    copy.splice(next, 0, removed);
    onChange(copy);
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="mt-2 w-5 text-xs font-semibold text-indigo-600">{index + 1}</span>
          <textarea
            value={step}
            rows={2}
            onChange={(e) => update(index, e.target.value)}
            className="min-h-13 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            placeholder="What should they do in this step?"
          />
          <div className="flex flex-col gap-1">
            <button type="button" className="text-xs text-slate-400" onClick={() => move(index, -1)}>
              ↑
            </button>
            <button type="button" className="text-xs text-slate-400" onClick={() => move(index, 1)}>
              ↓
            </button>
            <button
              type="button"
              className="text-xs text-rose-500"
              onClick={() => onChange(steps.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="text-sm font-medium text-indigo-600"
        onClick={() => onChange([...steps, ""])}
      >
        + Add step
      </button>
    </div>
  );
}
