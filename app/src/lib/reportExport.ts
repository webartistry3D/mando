import jsPDF from 'jspdf';
import { formatDate } from './utils';

type Tab = 'sales' | 'expenses' | 'profit' | 'products' | 'customers' | 'deliveries';

function formatMoney(n: number): string {
  return Number(n || 0).toLocaleString('en-US', { useGrouping: true, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number | null | undefined): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCSV(tab: Tab, data: any, dateFrom: string, dateTo: string): string {
  const lines: string[] = [];
  lines.push(`Mando Report - ${tab.toUpperCase()}`);
  lines.push(`Period,${dateFrom} to ${dateTo}`);
  lines.push('');

  switch (tab) {
    case 'sales': {
      lines.push('Metric,Value');
      lines.push(`Invoices,${data.summary.invoiceCount}`);
      lines.push(`Invoiced,NGN ${formatMoney(data.summary.totalInvoiced)}`);
      lines.push(`Collected,NGN ${formatMoney(data.summary.totalCollected)}`);
      lines.push(`Outstanding,NGN ${formatMoney(data.summary.totalOutstanding)}`);
      lines.push('');
      lines.push('Date,Invoiced,Collected');
      data.byDay.forEach((d: any) => lines.push(`${d.date},NGN ${formatMoney(d.invoiced)},NGN ${formatMoney(d.collected)}`));
      break;
    }
    case 'expenses': {
      lines.push('Metric,Value');
      lines.push(`Total Expenses,NGN ${formatMoney(data.summary.total)}`);
      lines.push(`Count,${data.summary.expenseCount}`);
      lines.push('');
      lines.push('Category,Count,Total');
      data.byCategory.forEach((c: any) => lines.push(`${csvEscape(c.category)},${c.count},NGN ${formatMoney(c.total)}`));
      break;
    }
    case 'profit': {
      lines.push('Metric,Value');
      lines.push(`Revenue,NGN ${formatMoney(data.summary.revenue)}`);
      lines.push(`Expenses,NGN ${formatMoney(data.summary.expenses)}`);
      lines.push(`Profit,NGN ${formatMoney(data.summary.profit)}`);
      lines.push('');
      lines.push('Month,Revenue,Expenses,Profit');
      data.byMonth.forEach((m: any) => lines.push(`${m.month},NGN ${formatMoney(m.revenue)},NGN ${formatMoney(m.expenses)},NGN ${formatMoney(m.profit)}`));
      break;
    }
    case 'products': {
      lines.push('Product,Type,Quantity,Revenue,Cost,Profit');
      data.products.forEach((p: any) => lines.push(`${csvEscape(p.name)},${p.type},${p.quantity},NGN ${formatMoney(p.revenue)},NGN ${formatMoney(p.cost)},NGN ${formatMoney(p.profit)}`));
      break;
    }
    case 'customers': {
      lines.push('Customer,Payments,Total Paid');
      data.customers.forEach((c: any) => lines.push(`${csvEscape(c.name)},${c.count},NGN ${formatMoney(c.totalPaid)}`));
      break;
    }
    case 'deliveries': {
      lines.push('Metric,Value');
      lines.push(`Deliveries,${data.summary.deliveryCount}`);
      lines.push(`Total Fees,NGN ${formatMoney(data.summary.totalFees)}`);
      lines.push('');
      lines.push('Number,Status,Delivery Fee,Customer,Invoice,Date');
      data.deliveries.forEach((d: any) => lines.push(`${d.number},${d.status.replace('_', ' ')},NGN ${formatMoney(d.deliveryFee)},${csvEscape(d.customerName)},${csvEscape(d.invoiceNumber)},${formatDate(d.createdAt)}`));
      break;
    }
  }
  return lines.join('\n');
}

function buildPDF(tab: Tab, data: any, dateFrom: string, dateTo: string): jsPDF {
  const doc = new jsPDF();
  const rightX = 190;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(`${tab.charAt(0).toUpperCase() + tab.slice(1)} Report`, rightX, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Period: ${dateFrom} to ${dateTo}`, rightX, 28, { align: 'right' });

  let y = 40;

  const drawSection = (title: string) => {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };

  const drawRow = (label: string, value: string, x = 14) => {
    doc.text(label, x, y);
    doc.text(value, rightX, y, { align: 'right' });
    y += 6;
  };

  const drawTableHeader = (cols: string[], widths: number[], x = 14) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    let cx = x;
    cols.forEach((c, i) => {
      doc.text(c, cx, y);
      cx += widths[i];
    });
    y += 5;
    doc.setFont('helvetica', 'normal');
  };

  const drawTableRow = (cols: string[], widths: number[], x = 14) => {
    if (y > 270) { doc.addPage(); y = 20; }
    let cx = x;
    cols.forEach((c, i) => {
      doc.text(c, cx, y);
      cx += widths[i];
    });
    y += 5;
  };

  switch (tab) {
    case 'sales': {
      drawSection('Summary');
      drawRow('Invoices', String(data.summary.invoiceCount));
      drawRow('Invoiced', `NGN ${formatMoney(data.summary.totalInvoiced)}`);
      drawRow('Collected', `NGN ${formatMoney(data.summary.totalCollected)}`);
      drawRow('Outstanding', `NGN ${formatMoney(data.summary.totalOutstanding)}`);
      drawSection('Daily Breakdown');
      drawTableHeader(['Date', 'Invoiced', 'Collected'], [60, 55, 55]);
      data.byDay.forEach((d: any) => drawTableRow([formatDate(d.date), `NGN ${formatMoney(d.invoiced)}`, `NGN ${formatMoney(d.collected)}`], [60, 55, 55]));
      break;
    }
    case 'expenses': {
      drawSection('Summary');
      drawRow('Total Expenses', `NGN ${formatMoney(data.summary.total)}`);
      drawRow('Count', String(data.summary.expenseCount));
      drawSection('By Category');
      drawTableHeader(['Category', 'Count', 'Total'], [70, 30, 50]);
      data.byCategory.forEach((c: any) => drawTableRow([c.category, String(c.count), `NGN ${formatMoney(c.total)}`], [70, 30, 50]));
      break;
    }
    case 'profit': {
      drawSection('Summary');
      drawRow('Revenue', `NGN ${formatMoney(data.summary.revenue)}`);
      drawRow('Expenses', `NGN ${formatMoney(data.summary.expenses)}`);
      drawRow('Profit', `NGN ${formatMoney(data.summary.profit)}`);
      drawSection('Monthly Breakdown');
      drawTableHeader(['Month', 'Revenue', 'Expenses', 'Profit'], [40, 45, 45, 45]);
      data.byMonth.forEach((m: any) => drawTableRow([m.month, `NGN ${formatMoney(m.revenue)}`, `NGN ${formatMoney(m.expenses)}`, `NGN ${formatMoney(m.profit)}`], [40, 45, 45, 45]));
      break;
    }
    case 'products': {
      drawSection('Product Performance');
      drawTableHeader(['Product', 'Type', 'Qty', 'Revenue', 'Cost', 'Profit'], [45, 25, 20, 40, 35, 35]);
      data.products.forEach((p: any) => drawTableRow([p.name.slice(0, 25), p.type, String(p.quantity), `NGN ${formatMoney(p.revenue)}`, `NGN ${formatMoney(p.cost)}`, `NGN ${formatMoney(p.profit)}`], [45, 25, 20, 40, 35, 35]));
      break;
    }
    case 'customers': {
      drawSection('Customer Revenue');
      drawTableHeader(['Customer', 'Payments', 'Total Paid'], [80, 30, 55]);
      data.customers.forEach((c: any) => drawTableRow([c.name.slice(0, 40), String(c.count), `NGN ${formatMoney(c.totalPaid)}`], [80, 30, 55]));
      break;
    }
    case 'deliveries': {
      drawSection('Summary');
      drawRow('Deliveries', String(data.summary.deliveryCount));
      drawRow('Total Fees', `NGN ${formatMoney(data.summary.totalFees)}`);
      drawSection('All Deliveries');
      drawTableHeader(['Number', 'Status', 'Fee', 'Customer', 'Invoice', 'Date'], [30, 30, 30, 40, 30, 35]);
      data.deliveries.forEach((d: any) => drawTableRow([d.number, d.status.replace('_', ' '), `NGN ${formatMoney(d.deliveryFee)}`, (d.customerName || '').slice(0, 20), d.invoiceNumber || '', formatDate(d.createdAt)], [30, 30, 30, 40, 30, 35]));
      break;
    }
  }

  // Footer divider at the base of the document content
  doc.setDrawColor(200);
  doc.line(14, y + 2, rightX, y + 2);

  return doc;
}

export function exportReportCSV(tab: Tab, data: any, dateFrom: string, dateTo: string) {
  const csv = buildCSV(tab, data, dateFrom, dateTo);
  downloadFile(csv, `mando-${tab}-report.csv`, 'text/csv');
}

export function exportReportPDF(tab: Tab, data: any, dateFrom: string, dateTo: string) {
  const doc = buildPDF(tab, data, dateFrom, dateTo);
  doc.save(`mando-${tab}-report.pdf`);
}
