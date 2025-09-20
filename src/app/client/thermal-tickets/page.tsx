"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DownloadIcon } from "@/components/icons";
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
  customerWhatsApp: string;
  deliveryAddress: string;
  deliveryCity: string;
  codAmount?: number;
  weight?: string;
  description?: string;
  senderName?: string;
  serviceType?: string;
  createdAt: string;
};

function ThermalTicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [tickets, setTickets] = useState<DeliveryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [barcodes, setBarcodes] = useState<Record<string, string>>({});

  const deliveryIds = searchParams?.get("deliveryIds");

  // Function to generate QR codes and barcodes for all tickets
  const generateCodesForTickets = async (ticketList: DeliveryTicket[]) => {
    const qrCodeMap: Record<string, string> = {};
    const barcodeMap: Record<string, string> = {};

    for (const ticket of ticketList) {
      const referenceUpper = ticket.reference.toUpperCase();

      try {
        // Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(referenceUpper, {
          width: 80,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        qrCodeMap[ticket._id] = qrCodeDataUrl;

        // Generate Barcode
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, referenceUpper, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: false,
          margin: 0,
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
      router.push("/client/track");
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

        // Use bulk API to fetch all deliveries at once
        const response = await fetch("/api/deliveries/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

        // Generate QR codes and barcodes after tickets are loaded
        await generateCodesForTickets(validDeliveries);
      } catch (error) {
        showError("Error", "Failed to load ticket data");
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [deliveryIds, router, showError]);

  const handlePrint = () => {
    setPrinting(true);

    // Create a dedicated print window with all tickets
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
        <title>Thermal Tickets - Print</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
          }
          
          .thermal-ticket {
            width: 4in;
            height: 6in;
            border: 2px solid black;
            padding: 0.25in;
            margin: 0;
            background: white;
            page-break-after: always;
            font-size: 12px;
            line-height: 1.2;
          }
          
          .thermal-ticket:last-child {
            page-break-after: avoid;
          }
          
          @page {
            size: 4in 6in;
            margin: 0;
          }
          
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .mb-3 { margin-bottom: 12px; }
          .my-2 { margin: 8px 0; }
          .my-3 { margin: 12px 0; }
          .my-4 { margin: 16px 0; }
          .my-5 { margin: 20px 0; }
          .mb-4 { margin-bottom: 16px; }
          .mt-5 { margin-top: 20px; }
          .mt-1 { margin-top: 4px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 20px; }
          .text-sm { font-size: 14px; }
          .text-xs { font-size: 12px; }
          hr {
            border: none;
            border-top: 2px solid black;
            margin: 12px 0;
          }
        </style>
      </head>
      <body>
        ${tickets
          .map(
            (ticket) => `
          <div class="thermal-ticket">
            <!-- Header -->
            <div class="text-center mb-3">
              <div class="font-bold text-sm">
                Date: ${new Date().toISOString().split("T")[0]}
              </div>
              <div class="text-lg font-bold my-2 uppercase">
                ${ticket.reference}
              </div>
            </div>

            <hr />

            <!-- Receiver Info -->
            <div class="mb-4 text-xs">
              <div><strong>Receiver:</strong> ${ticket.customerName}</div>
              <div><strong>Reference:</strong> <span class="uppercase">${
                ticket.reference
              }</span></div>
              <div><strong>Contact #:</strong> ${ticket.customerPhone}</div>
              <div><strong>Whatsapp #:</strong> ${ticket.customerWhatsApp}</div>
              <div><strong>Address:</strong> ${ticket.deliveryAddress}</div>
            </div>

            <!-- City -->
            <div class="text-center my-4">
              <div class="text-xl font-bold">
                City: ${ticket.deliveryCity}
              </div>
            </div>

            <hr />

            <!-- COD and Weight -->
            <div class="text-center my-4 text-sm">
              <div><strong>COD: Amount (${
                ticket.codAmount ? `SAR ${ticket.codAmount}` : "N/A"
              })</strong></div>
              <div><strong>Weight: ${ticket.weight || "KG"}</strong></div>
            </div>

            <hr />

            <!-- Shipper Info -->
            <div class="mb-4 text-xs">
              <div><strong>Shipper:</strong> ${
                ticket.createdById.firstName +
                  " " +
                  ticket.createdById.lastName || "Shipz Solutions"
              }</div>
              <div><strong>Service:</strong> ${getServiceName(
                ticket.serviceType
              )}</div>
              <div><strong>Desc:</strong> ${
                ticket.description || "Package delivery"
              }</div>
            </div>

            <!-- QR Code -->
            <div class="text-center my-5">
              ${
                qrCodes[ticket._id]
                  ? `<img src="${
                      qrCodes[ticket._id]
                    }" alt="QR Code" style="width: 80px; height: 80px;" />`
                  : `<div style="width: 80px; height: 80px; background: #f0f0f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc; font-size: 10px;">QR CODE</div>`
              }
            </div>

            <!-- Barcode -->
            <div class="text-center mt-5">
              ${
                barcodes[ticket._id]
                  ? `<img src="${
                      barcodes[ticket._id]
                    }" alt="Barcode" style="height: 40px;" />`
                  : `<div style="font-family: 'Courier New', monospace; font-size: 24px; letter-spacing: 2px;">||||||||||||||||||||||||</div>`
              }
              <div class="text-sm mt-1 uppercase">${ticket.reference}</div>
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

    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      setPrinting(false);
    }, 500);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Ensure codes are generated before downloading
      if (
        Object.keys(qrCodes).length === 0 ||
        Object.keys(barcodes).length === 0
      ) {
        await generateCodesForTickets(tickets);
      }

      // Create a new window with the tickets for PDF generation
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      const ticketsHtml = generateTicketsHtml();
      printWindow.document.write(ticketsHtml);
      printWindow.document.close();

      // Focus and print the new window
      printWindow.focus();
      printWindow.print();

      showSuccess("Download", "Tickets are being prepared for download");
    } catch (error) {
      showError("Download Failed", "Could not prepare tickets for download");
      console.error("Download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  const generateTicketsHtml = () => {
    const ticketsHtml = tickets
      .map(
        (ticket) => `
      <div style="
        width: 4in;
        height: 6in;
        border: 2px solid #000;
        margin: 0 auto 20px;
        padding: 10px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        background: white;
        page-break-after: always;
      ">
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="font-weight: bold; font-size: 14px;">Date: ${
            new Date().toISOString().split("T")[0]
          }</div>
          <div style="font-size: 18px; font-weight: bold; margin: 5px 0; text-transform: uppercase;">${
            ticket.reference
          }</div>
        </div>
        
        <hr style="border: 1px solid #000; margin: 10px 0;">
        
        <div style="margin-bottom: 15px;">
          <div><strong>Receiver:</strong> ${ticket.customerName}</div>
          <div>
            <strong>Reference:</strong> <span style="text-transform: uppercase;">${
              ticket.reference
            }</span>
          </div>
          <div><strong>Contact #:</strong> ${ticket.customerPhone}</div>
          <div><strong>Whatsapp #:</strong> ${ticket.customerWhatsApp}</div>
          <div><strong>Address:</strong> ${ticket.deliveryAddress}</div>
        </div>
        
        <div style="text-align: center; margin: 15px 0;">
          <div style="font-size: 20px; font-weight: bold;">City: ${
            ticket.deliveryCity
          }</div>
        </div>
        
        <hr style="border: 1px solid #000; margin: 10px 0;">
        
        <div style="text-align: center; margin: 15px 0;">
          <div><strong>COD: Amount (${
            ticket.codAmount ? `SAR ${ticket.codAmount}` : "N/A"
          })</strong></div>
          <div><strong>Weight: ${ticket.weight || "KG"}</strong></div>
        </div>
        
        <hr style="border: 1px solid #000; margin: 10px 0;">
        
        <div style="margin-bottom: 15px;">
          <div><strong>Shipper:</strong> ${
            ticket.createdById.firstName + " " + ticket.createdById.lastName ||
            "Shipz Solutions"
          }</div>
          <div><strong>Service:</strong> ${getServiceName(
            ticket.serviceType
          )}</div>
          <div><strong>Desc:</strong> ${
            ticket.description || "Package delivery"
          }</div>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          ${
            qrCodes[ticket._id]
              ? `<img src="${
                  qrCodes[ticket._id]
                }" alt="QR Code" style="width: 80px; height: 80px;" />`
              : `<div style="width: 80px; height: 80px; background: #f0f0f0; margin: 0 auto; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc; font-size: 10px;">QR CODE</div>`
          }
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          ${
            barcodes[ticket._id]
              ? `<img src="${
                  barcodes[ticket._id]
                }" alt="Barcode" style="height: 40px;" />`
              : `<div style="font-family: 'Courier New', monospace; font-size: 24px; letter-spacing: 2px;">||||||||||||||||||||||||</div>`
          }
          <div style="font-size: 14px; margin-top: 5px; text-transform: uppercase;">${
            ticket.reference
          }</div>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Thermal Tickets</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 0.5in; }
          }
          body { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        ${ticketsHtml}
      </body>
      </html>
    `;
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
        return "COD SOLUTIONS";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">
          Loading tickets and generating codes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thermal Tickets</h1>
          <p className="text-slate-600">Generated tickets ready for printing</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push("/client/track")}
          >
            Back to Track
          </Button>
          <Button
            variant="secondary"
            leftIcon={<DownloadIcon size={16} />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Preparing..." : "Download PDF"}
          </Button>
          <Button onClick={handlePrint} disabled={printing}>
            {printing ? "Preparing..." : "Print All"}
          </Button>
        </div>
      </div>

      <Card
        header={
          <div className="font-semibold">
            Thermal Tickets ({tickets.length} tickets)
          </div>
        }
        padded={false}
      >
        <div className="p-6 print:p-0">
          <div className="grid gap-6 print:gap-0">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="thermal-ticket border-2 border-black bg-white print:page-break-after-always print:border-0"
                style={{
                  width: "4in",
                  minHeight: "6in",
                  margin: "0 auto",
                  padding: "10px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {/* Header */}
                <div className="text-center mb-3">
                  <div className="font-bold text-sm">
                    Date: {new Date().toISOString().split("T")[0]}
                  </div>
                  <div className="text-lg font-bold my-2 uppercase">
                    {ticket.reference}
                  </div>
                </div>

                <hr className="border-black border-t-2 my-3" />

                {/* Receiver Info */}
                <div className="mb-4 text-xs">
                  <div>
                    <strong>Receiver:</strong> {ticket.customerName}
                  </div>
                  <div>
                    <strong>Reference:</strong>{" "}
                    <span className="uppercase">{ticket.reference}</span>
                  </div>
                  <div>
                    <strong>Contact #:</strong> {ticket.customerPhone}
                  </div>
                  <div>
                    <strong>Whatsapp #:</strong> {ticket.customerWhatsApp}
                  </div>
                  <div>
                    <strong>Address:</strong> {ticket.deliveryAddress}
                  </div>
                </div>

                {/* City */}
                <div className="text-center my-4">
                  <div className="text-xl font-bold">
                    City: {ticket.deliveryCity}
                  </div>
                </div>

                <hr className="border-black border-t-2 my-3" />

                {/* COD and Weight */}
                <div className="text-center my-4 text-sm">
                  <div>
                    <strong>
                      COD: Amount (
                      {ticket.codAmount ? `SAR ${ticket.codAmount}` : "N/A"})
                    </strong>
                  </div>
                  <div>
                    <strong>Weight: {ticket.weight || "KG"}</strong>
                  </div>
                </div>

                <hr className="border-black border-t-2 my-3" />

                {/* Shipper Info */}
                <div className="mb-4 text-xs">
                  <div>
                    <strong>Shipper:</strong>{" "}
                    {ticket.createdById.firstName +
                      " " +
                      ticket.createdById.lastName || "Shipz Solutions"}
                  </div>
                  <div>
                    <strong>Service:</strong>{" "}
                    {getServiceName(ticket.serviceType)}
                  </div>
                  <div>
                    <strong>Desc:</strong>{" "}
                    {ticket.description || "Package delivery"}
                  </div>
                </div>

                {/* QR Code */}
                <div className="text-center my-5">
                  {qrCodes[ticket._id] ? (
                    <img
                      src={qrCodes[ticket._id]}
                      alt="QR Code"
                      className="w-20 h-20 mx-auto"
                      width={80}
                      height={80}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center text-xs text-slate-500">
                      QR CODE
                    </div>
                  )}
                </div>

                {/* Barcode */}
                <div className="text-center mt-5">
                  {barcodes[ticket._id] ? (
                    <img
                      src={barcodes[ticket._id]}
                      alt="Barcode"
                      className="h-10 mx-auto"
                      width={200}
                      height={40}
                    />
                  ) : (
                    <div className="font-mono text-2xl tracking-wider">
                      ||||||||||||||||||||||||
                    </div>
                  )}
                  <div className="text-sm mt-1 uppercase">
                    {ticket.reference}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .thermal-ticket,
          .thermal-ticket * {
            visibility: visible;
          }

          .thermal-ticket {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            height: 6in !important;
            margin: 0 !important;
            padding: 0.25in !important;
            border: 2px solid black !important;
            background: white !important;
            page-break-after: always;
            box-sizing: border-box !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          @page {
            size: 4in 6in;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function ThermalTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-500">Loading...</div>
        </div>
      }
    >
      <ThermalTicketsContent />
    </Suspense>
  );
}
