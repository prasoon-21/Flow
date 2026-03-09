import * as contactRepo from '@/server/repositories/contact.repository';
import * as orderRepo from '@/server/repositories/order.repository';
import * as productRepo from '@/server/repositories/product.repository';
import { PDFDocument, rgb } from 'pdf-lib';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  company: { name: string; address: string; gstin: string };
  customer: { name: string; email: string; phone: string };
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  gst: number;
  total: number;
}

let invoiceCounter = 3003;

export function generateInvoiceData(orderId: string): InvoiceData {
  const order = orderRepo.getById(orderId);
  if (!order) throw new Error('Order not found');

  const contact = contactRepo.getById(order.contactId);

  invoiceCounter++;
  const items = order.items.map((item) => {
    const product = productRepo.getById(item.productId);
    return {
      name: product?.name ?? item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const gst = Math.round(subtotal * 0.18 * 100) / 100;

  return {
    invoiceNumber: `INV-${invoiceCounter}`,
    date: new Date().toISOString().slice(0, 10),
    company: {
      name: 'Aurika Flow Pvt Ltd',
      address: '123 Business Park, Bengaluru, India',
      gstin: '29AABCU9603R1ZM',
    },
    customer: {
      name: contact?.name ?? 'Unknown',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
    },
    items,
    subtotal,
    gst,
    total: subtotal + gst,
  };
}

export async function generateInvoicePdf(orderId: string): Promise<string> {
  const data = generateInvoiceData(orderId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4

  const drawText = (t: string, x: number, y: number, size = 12) => {
    page.drawText(t, { x, y, size, color: rgb(0, 0, 0) });
  };

  drawText(data.company.name, 50, 800, 20);
  drawText(data.company.address, 50, 780, 10);
  drawText(`GSTIN: ${data.company.gstin}`, 50, 765, 10);

  drawText(`INVOICE`, 450, 800, 24);
  drawText(`Number: ${data.invoiceNumber}`, 450, 780, 10);
  drawText(`Date: ${data.date}`, 450, 765, 10);

  page.drawLine({ start: { x: 50, y: 740 }, end: { x: 545, y: 740 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  drawText(`Billed To:`, 50, 715, 12);
  drawText(data.customer.name, 50, 695, 14);
  const emailStr = data.customer.email ? ` | ${data.customer.email}` : '';
  drawText(`${data.customer.phone}${emailStr}`, 50, 680, 10);

  page.drawLine({ start: { x: 50, y: 650 }, end: { x: 545, y: 650 }, thickness: 1, color: rgb(0, 0, 0) });

  drawText('Item', 55, 630, 10);
  drawText('Qty', 350, 630, 10);
  drawText('Price', 400, 630, 10);
  drawText('Total', 500, 630, 10);

  page.drawLine({ start: { x: 50, y: 620 }, end: { x: 545, y: 620 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  let y = 600;
  for (const item of data.items) {
    drawText(item.name.substring(0, 45), 55, y, 10);
    drawText(item.quantity.toString(), 350, y, 10);
    drawText(item.unitPrice.toLocaleString('en-IN'), 400, y, 10);
    drawText(item.total.toLocaleString('en-IN'), 500, y, 10);
    y -= 25;
  }

  y -= 20;
  page.drawLine({ start: { x: 300, y: y + 15 }, end: { x: 545, y: y + 15 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

  drawText('Subtotal:', 400, y, 10);
  drawText(data.subtotal.toLocaleString('en-IN'), 500, y, 10);
  y -= 20;
  drawText('GST (18%):', 400, y, 10);
  drawText(data.gst.toLocaleString('en-IN'), 500, y, 10);
  y -= 20;
  drawText('Total:', 400, y, 12);
  drawText(data.total.toLocaleString('en-IN'), 500, y, 12);

  const base64 = await pdfDoc.saveAsBase64();
  return base64;
}
