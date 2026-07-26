// src/components/DynamicFields.tsx
"use client";

export type FieldEntry = { label: string; value: string };

export default function DynamicFields({
  fields,
  onChange,
}: {
  fields: FieldEntry[];
  onChange: (fields: FieldEntry[]) => void;
}) {
  function addField() {
    onChange([...fields, { label: "", value: "" }]);
  }

  function updateField(index: number, key: "label" | "value", text: string) {
    const next = [...fields];
    next[index] = { ...next[index], [key]: text };
    onChange(next);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            value={field.label}
            onChange={(e) => updateField(i, "label", e.target.value)}
            placeholder="Field name (e.g. Instructions)"
            className="w-1/3 bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-ink-faint transition"
          />
          <input
            value={field.value}
            onChange={(e) => updateField(i, "value", e.target.value)}
            placeholder="Value"
            className="flex-1 bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-ink-faint transition"
          />
          <button
            type="button"
            onClick={() => removeField(i)}
            className="text-flag text-xs px-2 py-1.5 hover:brightness-110 transition"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="text-xs font-mono text-tag hover:brightness-110 transition"
      >
        + Add field
      </button>
    </div>
  );
}
