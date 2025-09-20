"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import { useToast } from "@/contexts/ToastContext";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

type DeliveryTicket = {
  _id: string;
  reference: string;
  createdById: {
    firstName: string;
    lastName: string;
  };
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  codAmount?: number;
  weight?: string;
  description?: string;
  senderName?: string;
  serviceType?: string;
  createdAt: string;
};

export default function A4TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showError } = useToast();
  const [tickets, setTickets] = useState<DeliveryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [barcodes, setBarcodes] = useState<Record<string, string>>({});

  const deliveryIds = searchParams?.get("deliveryIds");

  // Function to generate QR codes and barcodes for all tickets
  const generateCodesForTickets = async (ticketList: DeliveryTicket[]) => {
    const qrCodeMap: Record<string, string> = {};
    const barcodeMap: Record<string, string> = {};

    for (const ticket of ticketList) {
      const referenceUpper = ticket.reference.toUpperCase();
      const numericReference = referenceUpper.replace(/[^0-9]/g, "");

      try {
        // Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(referenceUpper, {
          width: 80,
          margin: 1,
        });
        qrCodeMap[ticket._id] = qrCodeDataUrl;

        // Generate Barcode
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, referenceUpper, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          text: numericReference,
          fontSize: 16,
          margin: 10,
        });
        barcodeMap[ticket._id] = canvas.toDataURL();
      } catch (error) {
        console.error(`Error generating codes for ${referenceUpper}:`, error);
      }
    }

    setQrCodes(qrCodeMap);
    setBarcodes(barcodeMap);
  };

  useEffect(() => {
    if (!deliveryIds) {
      router.push("/admin/delivery-status");
      return;
    }

    const fetchTickets = async () => {
      try {
        const ids = deliveryIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        if (ids.length === 0) {
          showError("Error", "No valid delivery IDs provided");
          return;
        }

        const response = await fetch("/api/deliveries/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch deliveries");
        }

        const data = await response.json();
        const validDeliveries = data.deliveries || [];

        if (validDeliveries.length === 0) {
          showError("Error", "No deliveries found for the provided IDs");
          return;
        }

        setTickets(validDeliveries);
        await generateCodesForTickets(validDeliveries);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load ticket data";
        showError("Error", message);
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [deliveryIds, router, showError]);

  const handlePrint = () => {
    setPrinting(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showError(
        "Print Failed",
        "Popup blocked. Please allow popups for this site."
      );
      setPrinting(false);
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>A4 Tickets - Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body { font-family: Arial, sans-serif; background: white; font-size: 12px; }
          .a4-ticket {
            border: 2px solid black;
            background: white;
            margin-bottom: 15px;
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: 2fr 1.5fr 5fr;
            align-items: stretch;
            height: 2in;
          }
          .a4-ticket:last-child { margin-bottom: 0; }
          @page { size: A4 landscape; margin: 0.5in; }
          .section { padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 2px solid black; min-height: 100%; text-align: center; }
          .section:last-child { border-right: none; }
          .main-info-section { flex-direction: row; justify-content: space-between; align-items: center; text-align: left; }
          .reference-large { font-size: 36px; font-weight: bold; text-transform: uppercase; line-height: 1.1; }
          .info-block { font-size: 11px; margin-top: 5px; }
        </style>
      </head>
      <body>
        ${tickets
          .map(
            (ticket) => `
          <div class="a4-ticket">
            <div class="section barcode-section">
              ${
                barcodes[ticket._id]
                  ? `<img src="${
                      barcodes[ticket._id]
                    }" alt="Barcode" style="height: 80px;" />`
                  : ""
              }
            </div>
            <div class="section date-section">
              <span style="font-size: 24px; font-weight: bold;">${
                new Date(ticket.createdAt).toISOString().split("T")[0]
              }</span>
            </div>
            <div class="section main-info-section">
              <div style="flex-grow: 1;">
                <div class="reference-large">${ticket.reference.toUpperCase()}</div>
                <div class="info-block">
                  <span><strong>(${
                    ticket.createdById.firstName +
                    " " +
                    ticket.createdById.lastName
                  })</strong> Ref: ${ticket.description || "N/A"}</span>
                  <span style="margin-left: 20px;">${getServiceName(
                    ticket.serviceType
                  )}</span>
                </div>
              </div>
              <div style="text-align: center; margin-left: 15px;">
                <div style="font-size: 14px; font-weight: bold;">${
                  ticket.deliveryCity
                } - (U)</div>
                ${
                  qrCodes[ticket._id]
                    ? `<img src="${
                        qrCodes[ticket._id]
                      }" alt="QR Code" style="width: 70px; height: 70px; margin-top: 5px;" />`
                    : ""
                }
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      setPrinting(false);
    }, 500);
  };

  const getServiceName = (serviceType?: string) => {
    switch (serviceType) {
      case "1":
        return "Shipz Solutions";
      case "5":
        return "JNT";
      case "9":
        return "IMILE";
      default:
        return "COD Solutions";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">A4 Tickets</h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push("/admin/delivery-status")}
          >
            Back to Deliveries
          </Button>
          <Button variant="gradient" onClick={handlePrint} disabled={printing}>
            {printing ? "Preparing..." : "Print All"}
          </Button>
        </div>
      </div>

      <Card
        header={
          <div className="font-semibold">
            A4 Tickets Preview ({tickets.length} tickets)
          </div>
        }
        padded={false}
      >
        <div className="p-6 space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="a4-ticket-preview border-2 border-black grid grid-cols-[2fr_1.5fr_5fr] items-stretch"
              style={{ height: "2in" }}
            >
              <div className="section-preview flex flex-col items-center justify-center p-2 border-r-2 border-black">
                {barcodes[ticket._id] ? (
                  <img
                    src={barcodes[ticket._id]}
                    alt="Barcode"
                    className="h-20"
                    width={200}
                    height={80}
                  />
                ) : (
                  <div className="text-xs">Loading Barcode...</div>
                )}
              </div>
              <div className="section-preview flex items-center justify-center p-2 border-r-2 border-black">
                <span className="text-2xl font-bold">
                  {new Date(ticket.createdAt).toISOString().split("T")[0]}
                </span>
              </div>
              <div className="section-preview flex items-center justify-between p-3">
                <div className="flex-grow">
                  <div className="text-4xl font-bold uppercase leading-tight">
                    {ticket.reference}
                  </div>
                  <div className="text-xs mt-1">
                    <span>
                      <strong>
                        (
                        {ticket.createdById.firstName +
                          " " +
                          ticket.createdById.lastName}
                        )
                      </strong>{" "}
                      Ref: {ticket.description || "N/A"}
                    </span>
                    <span className="ml-4">
                      {getServiceName(ticket.serviceType)}
                    </span>
                  </div>
                </div>
                <div className="text-center ml-4">
                  <div className="font-bold">{ticket.deliveryCity} - (U)</div>
                  {qrCodes[ticket._id] ? (
                    <img
                      src={qrCodes[ticket._id]}
                      alt="QR Code"
                      className="w-16 h-16 mt-1"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <div className="text-xs">...</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
