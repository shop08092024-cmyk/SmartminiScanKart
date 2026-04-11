import { Order } from "@/store/useStore";
import { ShopProfile } from "@/context/ShopProfileContext";
import html2pdf from "html2pdf.js";

export function generateInvoiceHTML(order: Order, shop: ShopProfile): string {
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const rows = order.items.map((item) => {
    const gstAmt = (item.unitPrice * item.quantity * item.taxPercent) / 100;
    return `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;">${item.productName}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.taxPercent}%</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:right;">₹${gstAmt.toFixed(2)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">₹${item.lineTotal.toFixed(2)}</td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invoice ${order.orderNumber} — ${shop.shopName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #1a1a1a; font-size: 13px; }
    .page { max-width: 680px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px; color: #fff; }
    .shop-name { font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
    .shop-tagline { font-size: 12px; opacity: 0.8; margin-top: 2px; }
    .header-right { text-align: right; }
    .invoice-label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-num { font-size: 20px; font-weight: 800; }
    .header-flex { display: flex; justify-content: space-between; align-items: flex-start; }
    .badge-paid { display: inline-block; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4); border-radius: 20px; padding: 3px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-top: 6px; }
    .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .info-block { padding: 20px 32px; border-bottom: 1px solid #f0f0f0; }
    .info-block:nth-child(odd) { border-right: 1px solid #f0f0f0; }
    .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #888; font-weight: 600; margin-bottom: 6px; }
    .info-val { font-size: 13px; font-weight: 600; color: #1a1a1a; line-height: 1.5; }
    .info-val-sm { font-size: 12px; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    .table-head th { background: #f8f8f8; padding: 10px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #777; font-weight: 700; }
    .table-head th:not(:first-child) { text-align: right; }
    .table-head th:nth-child(2),
    .table-head th:nth-child(4) { text-align: center; }
    .items-section { padding: 0 32px 8px; }
    .total-section { padding: 16px 32px 24px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .total-row.final { font-size: 16px; font-weight: 800; color: #4f46e5; border-top: 2px solid #4f46e5; padding-top: 10px; margin-top: 6px; }
    .total-row .lbl { color: #666; }
    .total-row.final .lbl { color: #4f46e5; }
    .footer { background: #fafafa; border-top: 1px solid #eee; padding: 20px 32px; display: flex; align-items: center; gap: 20px; justify-content: space-between; }
    .thank-msg { font-size: 13px; font-weight: 700; color: #4f46e5; }
    .footer-sub { font-size: 11px; color: #aaa; margin-top: 3px; }
    .divider { color: #e0e0e0; }
    .payment-badge { display: inline-flex; align-items: center; gap: 5px; background: #f0f0f8; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; color: #4f46e5; }
    @media print {
      body { background: white; }
      .page { box-shadow: none; margin: 0; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:16px;background:#fff;border-bottom:1px solid #eee;">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px;">🖨 Print / Save PDF</button>
    <button onclick="window.close()" style="background:#f5f5f5;color:#666;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer;">✕ Close</button>
  </div>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-flex">
        <div>
          <div class="shop-name">${shop.shopName}</div>
          <div class="shop-tagline">${shop.address}${shop.city ? ", " + shop.city : ""}${shop.state ? ", " + shop.state : ""}${shop.pincode ? " - " + shop.pincode : ""}</div>
          ${shop.phone ? `<div class="shop-tagline">📞 ${shop.phone}${shop.alternatePhone ? " / " + shop.alternatePhone : ""}</div>` : ""}
          ${shop.gstin ? `<div class="shop-tagline">GSTIN: ${shop.gstin}</div>` : ""}
          <div class="badge-paid">✓ PAID</div>
        </div>
        <div class="header-right">
          <div class="invoice-label">Tax Invoice</div>
          <div class="invoice-num">${order.orderNumber}</div>
          <div style="font-size:12px;opacity:0.8;margin-top:4px;">${dateStr}</div>
          <div class="payment-badge" style="margin-top:8px;background:rgba(255,255,255,0.2);color:#fff;">💳 ${order.paymentMethod}</div>
        </div>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-section">
      <div class="info-block">
        <div class="info-label">Shop Owner</div>
        <div class="info-val">${shop.ownerName}</div>
        ${shop.email ? `<div class="info-val-sm">${shop.email}</div>` : ""}
        ${shop.fssaiNumber ? `<div class="info-val-sm">FSSAI: ${shop.fssaiNumber}</div>` : ""}
      </div>
      <div class="info-block">
        <div class="info-label">Bill To</div>
        <div class="info-val">${order.customerName || "Walk-in Customer"}</div>
        ${order.customerPhone ? `<div class="info-val-sm">📞 ${order.customerPhone}</div>` : ""}
      </div>
      <div class="info-block">
        <div class="info-label">Order Date & Time</div>
        <div class="info-val">${dateStr}</div>
        ${order.razorpayPaymentId ? `<div class="info-val-sm" style="font-family:monospace;font-size:11px;">Txn: ${order.razorpayPaymentId}</div>` : ""}
      </div>
      <div class="info-block">
        <div class="info-label">Payment Details</div>
        <div class="info-val">${order.paymentMethod}</div>
        <div class="info-val-sm">Status: Paid ✓</div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="items-section" style="padding-top:16px;">
      <table>
        <thead class="table-head">
          <tr>
            <th style="text-align:left;">Item</th>
            <th>Qty</th>
            <th style="text-align:right;">Rate</th>
            <th>GST%</th>
            <th style="text-align:right;">Tax</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="total-section">
      <div style="max-width:260px;margin-left:auto;">
        <div class="total-row">
          <span class="lbl">Subtotal (${order.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span class="lbl">GST / Tax</span>
          <span>₹${order.tax.toFixed(2)}</span>
        </div>
        ${order.discount > 0 ? `<div class="total-row"><span class="lbl">Discount</span><span style="color:#e11d48;">−₹${order.discount.toFixed(2)}</span></div>` : ""}
        <div class="total-row final">
          <span class="lbl">Total Paid</span>
          <span>₹${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <div class="thank-msg">${shop.thankYouMessage || "Thank you for your purchase!"}</div>
        <div class="footer-sub">
          ${shop.shopName} · ${shop.city || ""}${shop.phone ? " · " + shop.phone : ""}
        </div>
        ${shop.upiId ? `<div class="footer-sub">UPI: ${shop.upiId}</div>` : ""}
      </div>
    </div>

    <div style="text-align:center;padding:12px;font-size:10px;color:#ccc;border-top:1px solid #f0f0f0;">
      This is a computer-generated invoice. No signature required. · Powered by ShopScan POS
    </div>
  </div>
</body>
</html>`;
}

export function downloadInvoice(order: Order, shop: ShopProfile) {
  const html = generateInvoiceHTML(order, shop);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // fallback: download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order.orderNumber}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function generatePDF(order: Order, shop: ShopProfile): Promise<Blob> {
  const html = generateInvoiceHTML(order, shop);
  const element = document.createElement("div");
  element.innerHTML = html;

  return new Promise((resolve, reject) => {
    const options = {
      margin: 0,
      filename: `${order.orderNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    (html2pdf() as any)
      .set(options)
      .from(element)
      .outputPdf("blob")
      .then((pdf: Blob) => {
        resolve(pdf);
      })
      .catch((err: Error) => {
        reject(err);
      });
  });
}

export async function downloadInvoicePDF(order: Order, shop: ShopProfile) {
  try {
    const pdf = await generatePDF(order, shop);
    const url = URL.createObjectURL(pdf);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${order.orderNumber}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}

export async function shareInvoiceViaWhatsApp(order: Order, shop: ShopProfile) {
  try {
    // Create a well-formatted WhatsApp message
    const dateObj = new Date(order.createdAt);
    const dateStr = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const address = [shop.address, shop.city, shop.state ? shop.state : undefined, shop.pincode ? `– ${shop.pincode}` : undefined].filter(Boolean).join(", ");
    const itemsList = order.items.map(item => `* ${item.productName} × ${item.quantity} — ₹${(item.unitPrice * item.quantity).toFixed(2)}`).join("\n");

    const message =
      `🧾 ORDER INVOICE\n\n` +
      `🏪 Store: ${shop.shopName}\n` +
      `📍 Address:\n${address}\n` +
      (shop.phone ? `📞 Phone: ${shop.phone}\n` : "") +
      `\n` +
      `📄 Invoice No: ${order.orderNumber}\n` +
      `💰 Amount Paid: ₹${order.total.toFixed(2)}\n` +
      `📅 Date: ${dateStr}, ${timeStr}\n` +
      `\n` +
      `🛍️ Items Purchased:\n${itemsList}\n` +
      `\n` +
      `🙏 Thank you for shopping with us!\nWe appreciate your business`;

    // Get customer phone number
    const phone = order.customerPhone;
    if (!phone) {
      throw new Error("Customer phone number not available");
    }

    // Normalize: strip all non-digits
    let formattedPhone = phone.replace(/\D/g, "");
    // Handle various formats: 10-digit, 91XXXXXXXXXX (12-digit), 0XXXXXXXXXX (11-digit)
    if (formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith("0")) {
      formattedPhone = "91" + formattedPhone.slice(1);
    } else if (formattedPhone.length === 12 && formattedPhone.startsWith("91")) {
      // Already correct
    } else if (formattedPhone.length < 10) {
      throw new Error("Invalid phone number — must be at least 10 digits");
    }

    // Open WhatsApp with message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");

    return {
      success: true,
      message: "WhatsApp opened with invoice message.",
    };
  } catch (error) {
    console.error("Error sharing invoice:", error);
    throw error;
  }
}