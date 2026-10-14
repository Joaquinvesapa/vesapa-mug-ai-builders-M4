"use client";

import { useEffect, useId, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { inputClass } from "@/components/ui";
import type { PublicUser } from "@/server/users";

const MIN_LENGTH = 2;

/** Username field with prefix suggestions from GET /api/users (FR-022). */
export function InviteUserInput() {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);
  const [open, setOpen] = useState(false);
  const listId = useId();

  useEffect(() => {
    if (value.trim().length < MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/users?q=${encodeURIComponent(value.trim())}`, { signal: controller.signal });
        if (response.ok) setResults((await response.json()) as PublicUser[]);
      } catch {
        // Aborted or offline: keep the previous suggestions.
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const suggestions = value.trim().length >= MIN_LENGTH ? results : [];
  const expanded = open && suggestions.length > 0;

  return (
    <div className="relative flex flex-1 flex-col gap-1">
      <label htmlFor={`${listId}-input`}>Nombre de usuario a invitar</label>
      <input
        id={`${listId}-input`}
        name="username"
        required
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className={inputClass}
      />
      {expanded && (
        <ul id={listId} role="listbox" className="absolute top-full z-10 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 py-1">
          {suggestions.map((user) => (
            <li
              key={user.username}
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue(user.username);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-neutral-800"
            >
              <Avatar shape={user.avatar.shape} color={user.avatar.color} size={20} decorative />
              {user.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
