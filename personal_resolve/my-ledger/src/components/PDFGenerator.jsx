import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function PDFGenerator({ user, transactions, currentMonthStr, bankMode }) {
  const { t } = useSettings();

  const generatePDF = () => {
    if (!transactions || transactions.length === 0) {
      alert("No data available to generate PDF.");
      return;
    }

    const doc = new jsPDF();
    
    // Add Watermark
    doc.setTextColor(240, 240, 250);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.text("MONEYBOOK", 45, 150, { angle: 45, opacity: 0.1 });
    
    // 1. Draw MoneyBook Center-Aligned Brand Emblem (Teal/Navy rounded rect with 'M')
    doc.setFillColor(13, 45, 68); // Brand Navy
    doc.roundedRect(100, 12, 10, 10, 2.5, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("M", 103.5, 19);

    // Draw MoneyBook application name centered
    doc.setTextColor(13, 45, 68); // Brand Navy
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("MONEYBOOK", 105, 28, { align: "center" });

    // Draw Subtext centered
    doc.setTextColor(78, 163, 204); // Brand Light Steel Blue
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("PERSONAL LEDGER PLATFORM", 105, 33, { align: "center" });

    // Line separator
    doc.setDrawColor(200, 215, 225); // Slate
    doc.setLineWidth(0.5);
    doc.line(14, 37, 196, 37);

    // 2. Statement Title & Metadata - Centered Layout
    doc.setTextColor(13, 45, 68); // Brand Navy
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(bankMode ? `${bankMode} Account Statement` : "Overall Transaction Statement", 105, 45, { align: "center" });

    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`User Profile: ${user?.name || 'Guest'}   |   Statement Period: ${currentMonthStr === 'all' ? 'All Time' : currentMonthStr}`, 105, 52, { align: "center" });
    doc.text(`Generated On: ${new Date().toLocaleString()}${bankMode ? `   |   Source Account: ${bankMode}` : ''}`, 105, 58, { align: "center" });
    
    // Summaries calculation
    let totalExp = 0, totalInc = 0, totalInv = 0, totalSav = 0, totalRec = 0, totalPay = 0;
    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'expenditure') totalExp += amt;
      else if (t.type === 'salary') totalInc += amt;
      else if (t.type === 'investment') totalInv += amt;
      else if (t.type === 'saving') totalSav += amt;
      else if (t.type === 'lent' && t.status === 'pending') totalRec += amt;
      else if (t.type === 'borrowed' && t.status === 'pending') totalPay += amt;
    });

    const netBalance = totalInc - totalExp;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Account Summary", 14, 68);
    
    autoTable(doc, {
      startY: 72,
      head: [['Metric', 'Amount (INR)']],
      body: [
        ['Total Income', `+${totalInc.toFixed(2)}`],
        ['Total Expense', `-${totalExp.toFixed(2)}`],
        ['Total Invested', `${totalInv.toFixed(2)}`],
        ['Total Saved', `${totalSav.toFixed(2)}`],
        ['Pending to Receive', `${totalRec.toFixed(2)}`],
        ['Pending to Pay', `${totalPay.toFixed(2)}`],
        ['Net Balance', `${netBalance.toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10 }
    });

    const summaryFinalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;

    // Transactions Table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(bankMode ? "Bank Transaction History" : "Complete Transaction History", 14, summaryFinalY + 12);
    
    const tableData = transactions.map(t => [
      t.date || '-',
      t.name || '-',
      (t.type || '-').toUpperCase(),
      t.bankName || '-',
      Number(t.amount).toFixed(2),
      (t.status || '-').toUpperCase()
    ]);

    autoTable(doc, {
      startY: summaryFinalY + 16,
      head: [['Date', 'Title', 'Category', 'Bank', 'Amount (INR)', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [47, 55, 69] },
      styles: { fontSize: 9 }
    });

    doc.save(`MoneyBook_Statement_${bankMode || currentMonthStr}.pdf`);
  };

  return (
    <button 
      onClick={generatePDF}
      className="flex items-center justify-center gap-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-4 py-2 rounded-xl font-bold transition-all border border-indigo-500/30 w-full md:w-auto"
    >
      <Download className="w-4 h-4" />
      {t('downloadPdf')}
    </button>
  );
}
