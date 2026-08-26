import { type ExportReportData } from "@/actions/export";
import { formatCurrency } from "@/lib/utils";

export function generateAndPrintPDFReport(data: ExportReportData) {
  const isPositiveNet = data.netCashflow >= 0;

  const rowsHtml = data.records
    .map((r, idx) => {
      let typeBadgeBg = "#f4f4f5";
      let typeBadgeColor = "#27272a";

      if (r.type === "income") {
        typeBadgeBg = "#ecfdf5";
        typeBadgeColor = "#059669";
      } else if (r.type === "expense") {
        typeBadgeBg = "#fff1f2";
        typeBadgeColor = "#e11d48";
      } else if (r.type === "transfer") {
        typeBadgeBg = "#f5f3ff";
        typeBadgeColor = "#7c3aed";
      } else if (r.type === "saving") {
        typeBadgeBg = "#eff6ff";
        typeBadgeColor = "#2563eb";
      }

      const accountLabel =
        r.type === "transfer" || r.type === "saving"
          ? `${r.walletName} → ${r.destinationName}`
          : r.walletName;

      return `
        <tr style="border-bottom: 1px solid #e4e4e7; ${
          idx % 2 === 1 ? "background-color: #fafafa;" : "background-color: #ffffff;"
        }">
          <td style="padding: 8px 10px; text-align: center; color: #71717a; font-size: 11px;">${idx + 1}</td>
          <td style="padding: 8px 10px; font-size: 11px; white-space: nowrap; color: #18181b;">${r.formattedDate}</td>
          <td style="padding: 8px 10px; font-size: 11px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 10px; background-color: ${typeBadgeBg}; color: ${typeBadgeColor};">
              ${r.typeLabel}
            </span>
          </td>
          <td style="padding: 8px 10px; font-size: 11px; color: #27272a; font-weight: 500;">${r.categoryName}</td>
          <td style="padding: 8px 10px; font-size: 11px; color: #52525b;">${accountLabel}</td>
          <td style="padding: 8px 10px; font-size: 11px; font-family: 'Geist Mono', 'Courier New', monospace; font-weight: 700; text-align: right; white-space: nowrap; color: ${
            r.type === "income" ? "#059669" : "#18181b"
          };">
            ${r.type === "income" ? "+" : "-"} ${formatCurrency(r.amount)}
          </td>
          <td style="padding: 8px 10px; font-size: 11px; color: #52525b; max-width: 180px;">${r.description}</td>
        </tr>
      `;
    })
    .join("");

  const printHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan_Transaksi_${data.periodLabel.replace(/\s+/g, "_")}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #09090b;
          margin: 0;
          padding: 0;
          background: #ffffff;
          line-height: 1.4;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #10b981;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .logo-block {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 16px;
        }
        .company-name {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #09090b;
        }
        .company-sub {
          font-size: 10px;
          color: #71717a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .report-title {
          font-size: 16px;
          font-weight: 700;
          color: #09090b;
          text-align: right;
          margin: 0;
        }
        .report-meta {
          font-size: 11px;
          color: #52525b;
          text-align: right;
          margin-top: 3px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #e4e4e7;
          background: #fcfcfc;
        }
        .summary-card.income {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
        }
        .summary-card.expense {
          background-color: #fff1f2;
          border-color: #fecdd3;
        }
        .summary-card.net {
          background-color: ${isPositiveNet ? "#f0fdf4" : "#fff1f2"};
          border-color: ${isPositiveNet ? "#bbf7d0" : "#fecdd3"};
        }
        .summary-label {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #71717a;
          margin-bottom: 4px;
        }
        .summary-value {
          font-size: 16px;
          font-weight: 800;
          font-family: 'Geist Mono', 'Courier New', monospace;
          color: #09090b;
        }
        .summary-value.income { color: #059669; }
        .summary-value.expense { color: #e11d48; }
        .summary-value.net { color: ${isPositiveNet ? "#059669" : "#e11d48"}; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background-color: #f4f4f5;
          color: #27272a;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 10px;
          border-top: 1px solid #e4e4e7;
          border-bottom: 1px solid #d4d4d8;
          text-align: left;
        }
        .footer-note {
          border-top: 1px solid #e4e4e7;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #71717a;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header-container">
        <div class="logo-block">
          <div class="logo-box">P</div>
          <div>
            <div class="company-name">Pintar Finance</div>
            <div class="company-sub">Personal Financial Ledger</div>
          </div>
        </div>
        <div>
          <h1 class="report-title">Laporan Riwayat Transaksi</h1>
          <div class="report-meta">
            Periode: <strong>${data.periodLabel}</strong> | Pengguna: <strong>${data.userName}</strong>
          </div>
          <div class="report-meta" style="font-size: 10px; color: #a1a1aa;">
            Dicetak pada: ${data.generatedAt}
          </div>
        </div>
      </div>

      <!-- Financial Metrics Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card income">
          <div class="summary-label">Total Pemasukan</div>
          <div class="summary-value income">${formatCurrency(data.totalIncome)}</div>
        </div>
        <div class="summary-card expense">
          <div class="summary-label">Total Pengeluaran</div>
          <div class="summary-value expense">${formatCurrency(data.totalExpense)}</div>
        </div>
        <div class="summary-card net">
          <div class="summary-label">Arus Kas Bersih</div>
          <div class="summary-value net">
            ${data.netCashflow > 0 ? "+" : ""}${formatCurrency(data.netCashflow)}
          </div>
        </div>
      </div>

      <!-- Transaction Records Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">No.</th>
            <th style="width: 125px;">Tanggal & Jam</th>
            <th style="width: 90px;">Tipe Mutasi</th>
            <th style="width: 120px;">Kategori</th>
            <th style="width: 140px;">Dompet / Akun</th>
            <th style="width: 120px; text-align: right;">Nominal (IDR)</th>
            <th>Catatan / Merchant</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Document Footer -->
      <div class="footer-note">
        <div>
          Dokumen ini dihasilkan secara otomatis oleh sistem <strong>Pintar Finance</strong>. Seluruh data mutasi tercatat pada buku besar terenkripsi.
        </div>
        <div>
          Total ${data.totalTransactions} Catatan Transaksi
        </div>
      </div>
    </body>
    </html>
  `;

  // Open in print-ready popup window
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();

    // Trigger print dialog once loaded
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);
    };
  } else {
    // Fallback: If popup blocked, create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }
  }
}
