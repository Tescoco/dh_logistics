import React, { useState, useRef, useEffect } from "react";
import Select from "./Select";

export interface SmartSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function SmartSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  className = "",
  disabled = false,
}: SmartSelectProps) {
  // Always declare hooks at the top, before any conditional logic
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside (only used for searchable dropdown)
  useEffect(() => {
    if (options.length <= 7) return; // Skip if using regular select

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [options.length]);

  // If 7 or fewer options, use regular select
  if (options.length <= 7) {
    return (
      <div className={className}>
        {label && <label className="text-[13px] text-slate-600">{label}</label>}
        <Select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option, i) => (
            <option key={i} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
    );
  }

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find the selected option display text
  const selectedOption = options.find((option) => option === value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option selection
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="text-[13px] text-slate-600">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedOption || ""}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[15px] text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] pr-10 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className={`px-3 py-2 cursor-pointer hover:bg-slate-50 ${
                index === highlightedIndex ? "bg-slate-100" : ""
              } ${
                option === value ? "bg-blue-50 text-blue-600" : "text-slate-900"
              }`}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-3 text-slate-500 text-sm">
          No options found
        </div>
      )}
    </div>
  );
}
