"use client";

import React, { useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  UploadIcon,
  DownloadIcon,
  ListIcon,
  EditIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import {
  parseFile,
  validateDeliveryRow,
  type ParsedRow,
} from "@/lib/fileParser";
import { RGS_CITIES } from "@/lib/rgs_cities";
import { JNT_CITIES } from "@/lib/jnt_cities";
import { IMILE_CITIES } from "@/lib/imile_cities";

export default function BulkDeliveriesUploadPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  type PreviewRow = {
    index: number;
    row: ParsedRow;
    valid: boolean;
    reason?: string;
    values: string[];
  };
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  // Inline editing state
  const [editingRow, setEditingRow] = useState<PreviewRow | null>(null);
  const [editValues, setEditValues] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const canStart = useMemo(
    () => !!file && rows.some((r) => r.valid),
    [file, rows]
  );

  // Handle row editing
  const handleEditRow = (row: PreviewRow) => {
    setEditingRow(row);
    setEditValues([...row.values]);
    setShowEditModal(true);
  };

  // Save edited row
  const handleSaveEdit = () => {
    if (!editingRow) return;

    // Create new row data from edited values
    const newRowData: ParsedRow = {};
    columns.forEach((header, index) => {
      newRowData[header] = editValues[index] || "";
    });

    // Validate the edited row
    const validation = validateDeliveryRow(newRowData, columns);

    // Update the row
    const updatedRows = rows.map((r) => {
      if (r.index === editingRow.index) {
        return {
          ...r,
          row: newRowData,
          valid: validation.isValid,
          reason: validation.reason || undefined,
          values: editValues,
        };
      }
      return r;
    });

    setRows(updatedRows);
    setShowEditModal(false);
    setEditingRow(null);
    setEditValues([]);

    if (validation.isValid) {
      showSuccess(
        "Row Updated",
        "Row has been successfully updated and is now valid."
      );
    } else {
      showError(
        "Validation Failed",
        `Row still has issues: ${validation.reason}`
      );
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingRow(null);
    setEditValues([]);
  };

  async function handleFileChange(f: File | null) {
    setFile(f);
    setRows([]);
    setColumns([]);
    setParseError(null);
    if (!f) return;

    // Validate file type
    const fileName = f.name.toLowerCase();
    const fileType = f.type;
    const isCSV = fileType === "text/csv" || fileName.endsWith(".csv");
    const isXLSX =
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx");

    if (!isCSV && !isXLSX) {
      setParseError("Unsupported file type. Please upload a CSV or XLSX file.");
      return;
    }

    try {
      // Parse the file using the new parser
      const parseResult = await parseFile(f);
      const { rows: parsedRows, headers } = parseResult;

      setColumns(headers);

      if (parsedRows.length === 0) {
        setParseError("No data rows found in the file.");
        return;
      }

      // Validate each row
      const previewRows: PreviewRow[] = [];
      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const validation = validateDeliveryRow(row, headers);

        // Convert row object to array of values for display
        const values = headers.map((header) => row[header]?.toString() || "");

        previewRows.push({
          index: i + 1,
          row,
          valid: validation.isValid,
          reason: validation.reason || undefined,
          values,
        });
      }

      setRows(previewRows);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to parse file";
      setParseError(errorMessage);
    }
  }

  async function downloadTemplate() {
    // IMPORTANT: COD format issue - The system only accepts "cod" (lowercase)
    // and does NOT accept "COD" (uppercase) for the paymentMethod field.
    // This was discovered during testing where bulk uploads failed with uppercase COD values.

    // Download empty template
    const headers = [
      "reference,customerName,customerPhone,deliveryAddress,deliveryCity,packageType,description,codAmount,notes,serviceType,customerWhatsApp",
    ].join("\n");
    const blob = new Blob([headers], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deliveries_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Wait a moment before downloading the example file to avoid browser blocking
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Also download example template with sample data
    const exampleData = [
      "reference,customerName,customerPhone,deliveryAddress,deliveryCity,packageType,description,codAmount,notes,serviceType,customerWhatsApp",
      "SS10001,Ahmed Al-Rashid,501234567,456 Customer Ave,Jeddah,parcel,Electronics package,150.00,Sample delivery,1,0599999999",
      "SS10002,Sarah Johnson,503456789,789 Customer Rd,Abu Sidayrah,parcel,Clothing items,75.50,Handle with care,5,0599999999",
      "SS10003,Mohammed Ali,505678901,123 Customer St,Mijannah,parcel,Books and documents,45.00,No signature required,9,0599999999",
    ].join("\n");

    const exampleBlob = new Blob([exampleData], {
      type: "text/csv;charset=utf-8;",
    });
    const exampleUrl = URL.createObjectURL(exampleBlob);
    const exampleLink = document.createElement("a");
    exampleLink.href = exampleUrl;
    exampleLink.download = "deliveries_example.csv";
    document.body.appendChild(exampleLink);
    exampleLink.click();
    document.body.removeChild(exampleLink);
    URL.revokeObjectURL(exampleUrl);

    // Show success message
    showSuccess(
      "Templates Downloaded",
      "Both empty template and example template have been downloaded successfully."
    );
  }

  async function startUpload() {
    if (!file || rows.length === 0) return;
    setUploading(true);
    try {
      // Instead of sending the original file, send the edited data
      const editedData = {
        headers: columns,
        rows: rows.map((row) => row.row), // Use the edited row data
        fileName: file.name,
        fileType: file.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv",
      };

      const res = await fetch("/api/deliveries/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
      });
      if (!res.ok) {
        const error = await res.json();
        showError("Upload Failed", error.error);
        return;
      }
      showSuccess(
        "Bulk Upload Complete",
        "All deliveries have been uploaded successfully"
      );
      router.push("/client/track");
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Bulk Deliveries Upload
      </h1>

      {/* Upload Instructions */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-600 grid place-items-center">
            <ListIcon size={18} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Upload Instructions</div>
            <ul className="mt-2 text-[13px] text-slate-600 space-y-1 list-disc pl-5">
              <li>Upload a CSV or XLSX file containing delivery information</li>
              <li>Maximum file size: 10MB</li>
              <li>Maximum 1000 deliveries per upload</li>
              <li>Ensure all required fields are included</li>
              <li>Both CSV and Excel (.xlsx) formats are supported</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* CSV Template */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">File Template</div>
            <div className="text-[12px] text-slate-500">
              Download both empty and example CSV templates to ensure proper
              formatting
            </div>
          </div>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon size={16} />}
            onClick={downloadTemplate}
          >
            Download Templates
          </Button>
        </div>
      </Card>

      {/* Upload CSV */}
      <Card>
        <div className="border-2 border-dashed border-sky-200 rounded-xl p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-sky-50 text-sky-600 grid place-items-center mb-3">
            <UploadIcon size={20} />
          </div>
          <div className="text-slate-700 font-medium">
            Drop your CSV or XLSX file here
          </div>
          <div className="text-[12px] text-slate-500">
            or click to browse and select
          </div>
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              hidden
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <Button
              leftIcon={<UploadIcon size={16} />}
              onClick={() => fileRef.current?.click()}
            >
              Choose File
            </Button>
            {file && (
              <div className="mt-2 text-sm text-slate-600">
                Selected: {file.name}
              </div>
            )}
            {parseError && (
              <div className="mt-2 text-sm text-rose-600">{parseError}</div>
            )}
          </div>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card
          header={<div className="font-semibold ">Preview Data</div>}
          padded={false}
          className="overflow-hidden max-w-full"
        >
          <div className="px-6 py-3 text-[13px] text-slate-600">
            Showing first {Math.min(rows.length, 20)} of {rows.length} row(s).
            Valid: {rows.filter((r) => r.valid).length}, Invalid:{" "}
            {rows.filter((r) => !r.valid).length}
          </div>
          <div className="overflow-x-auto w-full max-w-full min-w-0">
            <table className="min-w-max table-auto">
              <thead>
                <tr className="text-left text-[13px] text-slate-500">
                  <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[80px]">
                    Valid
                  </th>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 font-medium whitespace-nowrap min-w-[120px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="relative group">
                        <button
                          onClick={() => !r.valid && handleEditRow(r)}
                          disabled={r.valid}
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap transition-all duration-200 " +
                            (r.valid
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-default"
                              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200 cursor-pointer hover:bg-rose-100 hover:ring-rose-300")
                          }
                        >
                          {r.valid ? (
                            "Valid"
                          ) : (
                            <>
                              Invalid
                              <EditIcon size={10} />
                            </>
                          )}
                        </button>
                        {!r.valid && r.reason && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
                            {r.reason}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                        )}
                      </div>
                    </td>
                    {r.values.map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-3 text-slate-800 whitespace-nowrap max-w-[200px] truncate"
                        title={value || ""}
                      >
                        {value || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Button */}
      <Card>
        <div className="flex justify-end">
          <Button
            variant="gradient"
            onClick={startUpload}
            disabled={!canStart || uploading}
          >
            {uploading ? "Uploading..." : "Start Upload"}
          </Button>
        </div>
      </Card>

      {/* Edit Row Modal */}
      <Modal
        open={showEditModal}
        onClose={handleCancelEdit}
        title={`Edit Row ${editingRow?.index || ""}`}
        widthClassName="max-w-4xl"
      >
        {editingRow && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              {editingRow.reason && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-3">
                  <div className="font-medium text-rose-800">
                    Validation Error:
                  </div>
                  <div className="text-rose-700">{editingRow.reason}</div>
                </div>
              )}
              <p>
                Edit the values below to fix validation issues. Click Save when
                done.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {columns.map((header, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {header}
                  </label>
                  {header.toLowerCase().includes("servicetype") ||
                  header.toLowerCase().includes("service type") ? (
                    <select
                      value={editValues[index] || ""}
                      onChange={(e) => {
                        const newValues = [...editValues];
                        newValues[index] = e.target.value;
                        setEditValues(newValues);

                        // Build full row data from all edited values
                        const newRowData: ParsedRow = {};
                        columns.forEach((col, idx) => {
                          newRowData[col] = newValues[idx] || "";
                        });

                        // Validate full row on each change
                        const validation = validateDeliveryRow(
                          newRowData,
                          columns
                        );

                        // Reflect current validation state live in the modal
                        setEditingRow((prev) =>
                          prev
                            ? {
                                ...prev,
                                row: newRowData,
                                values: newValues,
                                valid: validation.isValid,
                                reason: validation.reason || undefined,
                              }
                            : prev
                        );

                        // If the row becomes valid, save immediately
                        if (validation.isValid && editingRow) {
                          const updatedRows = rows.map((r) => {
                            if (r.index === editingRow.index) {
                              return {
                                ...r,
                                row: newRowData,
                                valid: true,
                                reason: undefined,
                                values: newValues,
                              };
                            }
                            return r;
                          });

                          setRows(updatedRows);
                          setShowEditModal(false);
                          setEditingRow(null);
                          setEditValues([]);
                          showSuccess(
                            "Row Updated",
                            "Row has been successfully updated and is now valid."
                          );
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Service Type</option>
                      <option value="1">1 - Shipz Solutions</option>
                      <option value="5">5 - JNT</option>
                      <option value="9">9 - IMILE</option>
                    </select>
                  ) : header.toLowerCase().includes("deliverycity") ||
                    header.toLowerCase().includes("delivery city") ? (
                    <select
                      value={editValues[index] || ""}
                      onChange={(e) => {
                        const newValues = [...editValues];
                        newValues[index] = e.target.value;
                        setEditValues(newValues);

                        // Build full row data from all edited values
                        const newRowData: ParsedRow = {};
                        columns.forEach((col, idx) => {
                          newRowData[col] = newValues[idx] || "";
                        });

                        // Validate full row on each change
                        const validation = validateDeliveryRow(
                          newRowData,
                          columns
                        );

                        // Reflect current validation state live in the modal
                        setEditingRow((prev) =>
                          prev
                            ? {
                                ...prev,
                                row: newRowData,
                                values: newValues,
                                valid: validation.isValid,
                                reason: validation.reason || undefined,
                              }
                            : prev
                        );

                        // If the row becomes valid, save immediately
                        if (validation.isValid && editingRow) {
                          const updatedRows = rows.map((r) => {
                            if (r.index === editingRow.index) {
                              return {
                                ...r,
                                row: newRowData,
                                valid: true,
                                reason: undefined,
                                values: newValues,
                              };
                            }
                            return r;
                          });

                          setRows(updatedRows);
                          setShowEditModal(false);
                          setEditingRow(null);
                          setEditValues([]);
                          showSuccess(
                            "Row Updated",
                            "Row has been successfully updated and is now valid."
                          );
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select City</option>
                      {(() => {
                        // Get the current service type from the row
                        const serviceTypeIndex = columns.findIndex(
                          (col) =>
                            col.toLowerCase().includes("servicetype") ||
                            col.toLowerCase().includes("service type")
                        );
                        const currentServiceType =
                          serviceTypeIndex >= 0
                            ? editValues[serviceTypeIndex]
                            : "";

                        let cities: string[] = [];
                        switch (currentServiceType) {
                          case "1":
                            cities = RGS_CITIES;
                            break;
                          case "5":
                            cities = JNT_CITIES;
                            break;
                          case "9":
                            cities = IMILE_CITIES;
                            break;
                          default:
                            cities = [];
                        }

                        return cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ));
                      })()}
                    </select>
                  ) : (
                    <Input
                      type={header === "customerPhone" ? "number" : "text"}
                      value={editValues[index] || ""}
                      onChange={(e) => {
                        const newValues = [...editValues];
                        newValues[index] = e.target.value;
                        setEditValues(newValues);

                        // Build full row data from all edited values
                        const newRowData: ParsedRow = {};
                        columns.forEach((col, idx) => {
                          newRowData[col] = newValues[idx] || "";
                        });

                        // Validate full row on each change
                        const validation = validateDeliveryRow(
                          newRowData,
                          columns
                        );

                        // Reflect current validation state live in the modal
                        setEditingRow((prev) =>
                          prev
                            ? {
                                ...prev,
                                row: newRowData,
                                values: newValues,
                                valid: validation.isValid,
                                reason: validation.reason || undefined,
                              }
                            : prev
                        );

                        // If the row becomes valid, save immediately
                        if (validation.isValid && editingRow) {
                          const updatedRows = rows.map((r) => {
                            if (r.index === editingRow.index) {
                              return {
                                ...r,
                                row: newRowData,
                                valid: true,
                                reason: undefined,
                                values: newValues,
                              };
                            }
                            return r;
                          });

                          setRows(updatedRows);
                          setShowEditModal(false);
                          setEditingRow(null);
                          setEditValues([]);
                          showSuccess(
                            "Row Updated",
                            "Row has been successfully updated and is now valid."
                          );
                        }
                      }}
                      placeholder={`Enter ${header}`}
                      className="w-full"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
