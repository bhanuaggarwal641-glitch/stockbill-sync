import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  customer_name?: string;
  customer_gstin?: string;
  customer_address?: string;
  items: Array<{
    product_name: string;
    qty: number;
    unit_price: number;
    discount: number;
    gst_rate: number;
    line_total: number;
  }>;
  sub_total: number;
  gst_total: number;
  grand_total: number;
  payment_mode: string;
  amount_paid: number;
  balance_due: number;
}

interface PurchaseInvoiceData {
  purchase_number: string;
  purchase_date: string;
  supplier_name: string;
  supplier_gstin?: string;
  supplier_address?: string;
  supplier_invoice_number?: string;
  items: Array<{
    product_name: string;
    qty: number;
    unit_cost: number;
    gst_rate: number;
    line_total: number;
  }>;
  sub_total: number;
  gst_total: number;
  grand_total: number;
  is_gst: boolean;
}

export const generateSalesInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFillColor(33, 102, 217);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text("BizFlow CRM", 15, 15);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("Billing & Inventory Management", 15, 22);
  doc.text("GSTIN: 29XXXXX1234X1ZX", 15, 28);
  
  // Invoice Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text("TAX INVOICE", 150, 15);
  
  // Invoice Details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice No: ${data.invoice_number}`, 150, 22);
  doc.text(`Date: ${new Date(data.invoice_date).toLocaleDateString()}`, 150, 28);
  
  // Customer Details
  let yPos = 45;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text("Bill To:", 15, yPos);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(data.customer_name || "Walk-in Customer", 15, yPos + 6);
  if (data.customer_gstin) {
    doc.text(`GSTIN: ${data.customer_gstin}`, 15, yPos + 12);
  }
  if (data.customer_address) {
    const addressLines = doc.splitTextToSize(data.customer_address, 80);
    doc.text(addressLines, 15, yPos + (data.customer_gstin ? 18 : 12));
  }
  
  // Items Table
  const tableData = data.items.map((item) => [
    item.product_name,
    item.qty.toString(),
    `₹${item.unit_price.toFixed(2)}`,
    `₹${item.discount.toFixed(2)}`,
    `${item.gst_rate}%`,
    `₹${item.line_total.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: yPos + 30,
    head: [["Product", "Qty", "Price", "Discount", "GST", "Total"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [33, 102, 217], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 80;
  
  doc.setFont(undefined, 'normal');
  doc.text("Subtotal:", 130, finalY + 10);
  doc.text(`₹${data.sub_total.toFixed(2)}`, 180, finalY + 10, { align: 'right' });
  
  doc.text("GST Total:", 130, finalY + 16);
  doc.text(`₹${data.gst_total.toFixed(2)}`, 180, finalY + 16, { align: 'right' });
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text("Grand Total:", 130, finalY + 24);
  doc.text(`₹${data.grand_total.toFixed(2)}`, 180, finalY + 24, { align: 'right' });
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Mode: ${data.payment_mode}`, 130, finalY + 32);
  doc.text(`Amount Paid: ₹${data.amount_paid.toFixed(2)}`, 130, finalY + 38);
  doc.text(`Balance Due: ₹${data.balance_due.toFixed(2)}`, 130, finalY + 44);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Thank you for your business!", 105, 280, { align: 'center' });
  doc.text("This is a computer-generated invoice", 105, 285, { align: 'center' });
  
  return doc;
};

export const generatePurchaseInvoicePDF = (data: PurchaseInvoiceData) => {
  const doc = new jsPDF();
  
  // Company Header
  doc.setFillColor(33, 102, 217);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text("BizFlow CRM", 15, 15);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text("Purchase Invoice", 15, 22);
  doc.text("GSTIN: 29XXXXX1234X1ZX", 15, 28);
  
  // Invoice Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(data.is_gst ? "PURCHASE INVOICE (GST)" : "PURCHASE INVOICE (Non-GST)", 130, 15);
  
  // Invoice Details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Purchase No: ${data.purchase_number}`, 130, 22);
  doc.text(`Date: ${new Date(data.purchase_date).toLocaleDateString()}`, 130, 28);
  if (data.supplier_invoice_number) {
    doc.text(`Supplier Invoice: ${data.supplier_invoice_number}`, 130, 34);
  }
  
  // Supplier Details
  let yPos = 45;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text("Supplier:", 15, yPos);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(data.supplier_name, 15, yPos + 6);
  if (data.supplier_gstin) {
    doc.text(`GSTIN: ${data.supplier_gstin}`, 15, yPos + 12);
  }
  if (data.supplier_address) {
    const addressLines = doc.splitTextToSize(data.supplier_address, 80);
    doc.text(addressLines, 15, yPos + (data.supplier_gstin ? 18 : 12));
  }
  
  // Items Table
  const tableData = data.items.map((item) => [
    item.product_name,
    item.qty.toString(),
    `₹${item.unit_cost.toFixed(2)}`,
    data.is_gst ? `${item.gst_rate}%` : 'N/A',
    `₹${item.line_total.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: yPos + 30,
    head: [["Product", "Qty", "Unit Cost", "GST", "Total"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [33, 102, 217], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 80;
  
  doc.setFont(undefined, 'normal');
  doc.text("Subtotal:", 130, finalY + 10);
  doc.text(`₹${data.sub_total.toFixed(2)}`, 180, finalY + 10, { align: 'right' });
  
  if (data.is_gst) {
    doc.text("GST Total:", 130, finalY + 16);
    doc.text(`₹${data.gst_total.toFixed(2)}`, 180, finalY + 16, { align: 'right' });
  }
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text("Grand Total:", 130, finalY + (data.is_gst ? 24 : 18));
  doc.text(`₹${data.grand_total.toFixed(2)}`, 180, finalY + (data.is_gst ? 24 : 18), { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("This is a computer-generated document", 105, 280, { align: 'center' });
  
  return doc;
};
