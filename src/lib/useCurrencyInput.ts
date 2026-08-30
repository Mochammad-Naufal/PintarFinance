/**
 * useCurrencyInput — real-time IDR formatter hook
 *
 * Usage:
 *   const { displayValue, rawValue, onChange, onBlur } = useCurrencyInput(initialNumber);
 *
 * - displayValue: formatted string, e.g. "1.500.000" (no "Rp" prefix — the "Rp" label sits outside)
 * - rawValue: raw number to store in state / form
 * - onChange: handler for input[type=text] onChange event
 * - onBlur: strips trailing dots / normalises on blur
 * - setValue: programmatically set the raw value (e.g. when editing an existing record)
 */

"use client";

import { useCallback, useState } from "react";

function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

interface UseCurrencyInputOptions {
  min?: number;
  max?: number;
}

export function useCurrencyInput(
  initialValue: number = 0,
  options: UseCurrencyInputOptions = {}
) {
  const [displayValue, setDisplayValue] = useState<string>(
    initialValue > 0 ? initialValue.toLocaleString("id-ID") : ""
  );
  const [rawValue, setRawValue] = useState<number>(initialValue);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digits = raw.replace(/\D/g, "");
      const num = digits ? Number(digits) : 0;

      // Enforce max if provided
      if (options.max !== undefined && num > options.max) return;

      const formatted = digits ? Number(digits).toLocaleString("id-ID") : "";
      setDisplayValue(formatted);
      setRawValue(num);
    },
    [options.max]
  );

  const onBlur = useCallback(() => {
    // Normalise — re-format on blur
    if (rawValue > 0) {
      setDisplayValue(rawValue.toLocaleString("id-ID"));
    } else {
      setDisplayValue("");
    }
  }, [rawValue]);

  /** Programmatically set the value (e.g., when editing an existing record) */
  const setValue = useCallback((value: number) => {
    setRawValue(value);
    setDisplayValue(value > 0 ? value.toLocaleString("id-ID") : "");
  }, []);

  return { displayValue, rawValue, onChange, onBlur, setValue, formatThousands };
}
