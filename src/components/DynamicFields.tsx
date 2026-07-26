// src/components/DynamicFields.tsx
"use client";

export type FieldEntry = { label: string; value: string; copyable?: boolean };

export default function DynamicFields({
  fields,
  onChange,
  accent = "tag",
}: {
  fields: FieldEntry[];
  onChange: (fields: FieldEntry[]) => void;
  accent?: "tag" | "sites" | "methods";
}) {
  function addField() {
    onChange([...fields, { label: "", value: "", copyable: false }]);
  }

  function updateField(
    index: number,
    key: keyof FieldEntry,
    val: string | boolean,
  ) {
    const next = [...fields];
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  const accentClass =
    accent === "sites"
      ? "text-sites"
      : accent === "methods"
        ? "text-methods"
        : "text-tag";

  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={field.label}
            onChange={(e) => updateField(i, "label", e.target.value)}
            placeholder="Field name"
            className="w-1/3 bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-ink-faint transition"
          />
          <input
            value={field.value}
            onChange={(e) => updateField(i, "value", e.target.value)}
            placeholder="Value"
            className="flex-1 bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-ink-faint transition"
          />
          <label className="flex items-center gap-1 text-[10px] text-ink-faint whitespace-nowrap">
            <input
              type="checkbox"
              checked={!!field.copyable}
              onChange={(e) => updateField(i, "copyable", e.target.checked)}
            />
            copyable
          </label>
          <button
            type="button"
            onClick={() => removeField(i)}
            className="text-flag text-xs px-1 hover:brightness-110 transition"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className={`text-xs font-mono ${accentClass} hover:brightness-110 transition`}
      >
        + Add field
      </button>
    </div>
  );
}
