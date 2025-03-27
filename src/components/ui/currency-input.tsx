"use client";

import type React from "react";

import { useState, useEffect, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ItemChangeHandler = (itemId: number | string, newValue: number) => void;
type SimpleChangeHandler = (newValue: number) => void;

interface CurrencyInputProps {
  id?: string;
  itemId?: string | number; // Added itemId to identify which item is being updated
  label?: string;
  value?: number;
  onChange?: ItemChangeHandler | SimpleChangeHandler;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  onKeyDownCapture?: (e: any) => void;
}

export default function CurrencyInput({
  id = "currency-input",
  itemId, // Item identifier from the array
  label,
  value = 0,
  onChange,
  placeholder = "0.00",
  className,
  disabled = false,
  required = false,
  name = "currency-input",
  onKeyDownCapture,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Format the number as currency
  const formatAsCurrency = (num: number): string => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse the display value to a number
  const parseToNumber = (str: string): number => {
    // Remove all non-numeric characters except decimal point
    const cleanedValue = str.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = cleanedValue.split(".");
    const formattedValue = parts[0] + (parts.length > 1 ? "." + parts[1] : "");
    return Number.parseFloat(formattedValue) || 0;
  };

  // Initialize display value from props
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatAsCurrency(value) : "");
    }
  }, [value, isFocused]);

  const handleValueChange = (numericValue: number) => {
    if (!onChange) return;

    if (itemId !== undefined) {
      (onChange as ItemChangeHandler)(itemId, numericValue);
    } else {
      (onChange as SimpleChangeHandler)(numericValue);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Remove currency formatting for editing
    const rawValue = inputValue.replace(/[^0-9.]/g, "");

    // Handle decimal places
    const parts = rawValue.split(".");
    let formattedForEditing = parts[0];
    if (parts.length > 1) {
      formattedForEditing += "." + parts[1].slice(0, 2);
    }

    setDisplayValue(formattedForEditing);

    // Convert to number and call onChange with itemId
    const numericValue = parseToNumber(formattedForEditing);
    handleValueChange(numericValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the value when the input loses focus
    const numericValue = parseToNumber(displayValue);
    setDisplayValue(numericValue ? formatAsCurrency(numericValue) : "");
    handleValueChange(numericValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // When focusing, show the raw number without formatting
    const numericValue = parseToNumber(displayValue);
    setDisplayValue(numericValue ? numericValue.toString() : "");

    // Move cursor to the end
    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
        <Input
          id={id}
          name={name}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onKeyDownCapture={onKeyDownCapture}
          className={cn(
            "pl-7",
            disabled && "opacity-70 cursor-not-allowed",
            "border-none",
            "focus-visible:ring-0",
            "shadow-none",
            "underline",
            "text-right",
            "pr-0",
          )}
        />
      </div>
    </div>
  );
}
