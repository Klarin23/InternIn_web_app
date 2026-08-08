"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";

export default function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  function addTag() {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput("");
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          className="h-10 flex-1 rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-sm border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          Ajouter
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)}>
                <FiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
