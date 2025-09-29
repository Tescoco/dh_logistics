import React from "react";
import SmartSelect from "./SmartSelect";
import { RGS_CITIES } from "@/lib/rgs_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { IMILE_CITIES } from "@/lib/imile_cities";

interface CitySelectProps {
  serviceType: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CitySelect({
  serviceType,
  value,
  onChange,
  className = "",
  placeholder = "Select City",
}: CitySelectProps) {
  const getCities = (serviceType: string): string[] => {
    switch (serviceType) {
      case "1":
        return RGS_CITIES;
      case "5":
        return JNT_CITIES;
      case "9":
        return IMILE_CITIES;
      default:
        return [];
    }
  };

  const cities = getCities(serviceType);

  if (cities.length === 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      >
        <option value="">{placeholder}</option>
      </select>
    );
  }

  return (
    <SmartSelect
      options={cities}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
