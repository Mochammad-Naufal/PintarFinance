"use client";

import React from "react";

interface ChatMessageContentProps {
  content: string;
  isUser?: boolean;
}

// ─── Inline Formatter (Bold, Italic, Code) ───────────────────────────────────

function formatInline(text: string, isUser: boolean): React.ReactNode[] {
  // Regex matches:
  // 1. **bold**
  // 2. *italic* or _italic_
  // 3. `code`
  const tokens = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      const inner = token.slice(2, -2);
      return (
        <strong
          key={index}
          className={
            isUser
              ? "font-bold text-white"
              : "font-semibold text-zinc-900 dark:text-zinc-50"
          }
        >
          {inner}
        </strong>
      );
    }

    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <em key={index} className="italic opacity-90">
          {inner}
        </em>
      );
    }

    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      const inner = token.slice(1, -1);
      return (
        <code
          key={index}
          className={
            isUser
              ? "px-1.5 py-0.5 rounded bg-emerald-700/60 font-mono text-[11px]"
              : "px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700/80 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]"
          }
        >
          {inner}
        </code>
      );
    }

    return <React.Fragment key={index}>{token}</React.Fragment>;
  });
}

// ─── Block Formatter (Paragraphs, Lists, Headers) ─────────────────────────────

export function ChatMessageContent({
  content,
  isUser = false,
}: ChatMessageContentProps) {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let currentList: { type: "ordered" | "unordered"; items: string[] } | null =
    null;

  const flushList = () => {
    if (!currentList) return;

    if (currentList.type === "ordered") {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-1.5 my-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span
                className={
                  isUser
                    ? "font-bold text-emerald-200 text-xs shrink-0"
                    : "w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5"
                }
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                {formatInline(item, isUser)}
              </div>
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 leading-relaxed">
              <span
                className={
                  isUser
                    ? "text-emerald-200 text-xs shrink-0 mt-0.5"
                    : "text-emerald-500 font-bold text-xs shrink-0 mt-0.5"
                }
              >
                •
              </span>
              <div className="flex-1 min-w-0">
                {formatInline(item, isUser)}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Numbered list match (e.g. "1. ", "2. ", "10. ")
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (currentList && currentList.type !== "ordered") flushList();
      if (!currentList) currentList = { type: "ordered", items: [] };
      currentList.items.push(orderedMatch[2]);
      continue;
    }

    // Bullet list match (e.g. "- ", "* ", "• ")
    const unorderedMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (unorderedMatch) {
      if (currentList && currentList.type !== "unordered") flushList();
      if (!currentList) currentList = { type: "unordered", items: [] };
      currentList.items.push(unorderedMatch[1]);
      continue;
    }

    // Regular line / header
    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h-${elements.length}`}
          className="font-bold text-xs mt-2 mb-1 text-zinc-900 dark:text-zinc-100"
        >
          {formatInline(trimmed.slice(4), isUser)}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h-${elements.length}`}
          className="font-bold text-sm mt-2.5 mb-1 text-zinc-900 dark:text-zinc-100"
        >
          {formatInline(trimmed.slice(3), isUser)}
        </h3>
      );
    } else {
      elements.push(
        <p
          key={`p-${elements.length}`}
          className="leading-relaxed my-1 first:mt-0 last:mb-0"
        >
          {formatInline(trimmed, isUser)}
        </p>
      );
    }
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}
