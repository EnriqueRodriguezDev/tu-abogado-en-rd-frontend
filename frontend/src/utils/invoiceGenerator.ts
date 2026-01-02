import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { Payment, Appointment } from '../types'; // Type-only import

interface InvoiceData {
    payment: Payment;
    appointment: Appointment;
    company: {
        name: string;
        rnc: string;
        address: string;
        logoUrl?: string;
    };
}

export const generateInvoicePDF = async ({ payment, appointment, company }: InvoiceData): Promise<string> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height; // Define pageHeight


    // --- Header ---
    // Logo (Left)
    if (company.logoUrl) {
        try {
            // Helper to load image as Data URL to ensure it works in PDF
            const loadImage = (url: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = url;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return reject('No context');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = reject;
                });
            };

            const logoDataUrl = await loadImage(company.logoUrl);
            doc.addImage(logoDataUrl, 'PNG', 15, 15, 20, 20);
        } catch (e) {
            console.warn("Could not load logo", e);
            // Fallback: Gold Square with T
            doc.setFillColor(212, 175, 55);
            doc.rect(15, 15, 20, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text("T", 20, 28);
        }
    } else {
        // Default Fallback if no URL
        doc.setFillColor(212, 175, 55);
        doc.rect(15, 15, 20, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("T", 20, 28);
    }

    // Company Info (Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // Navy
    doc.text(company.name, pageWidth - 15, 25, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`RNC: ${company.rnc}`, pageWidth - 15, 32, { align: "right" });
    doc.text(company.address, pageWidth - 15, 37, { align: "right" });

    // --- Invoice Title & details ---
    doc.setDrawColor(212, 175, 55); // Gold Line
    doc.setLineWidth(1);
    doc.line(15, 45, pageWidth - 15, 45);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Navy
    doc.text("FACTURA DE CRÉDITO FISCAL", 15, 60);

    doc.setFontSize(10);
    doc.setTextColor(80);
    const rightColX = pageWidth - 60;

    // Left: Client data
    doc.text("FACTURADO A:", 15, 75);
    doc.setFont("helvetica", "bold");
    doc.text(appointment.client_name, 15, 80);
    if (payment.rnc_client) {
        doc.setFont("helvetica", "normal");
        doc.text(`RNC/Cédula: ${payment.rnc_client}`, 15, 85);
    }

    // Right: Invoice Metadata
    doc.setFont("helvetica", "normal");
    doc.text("NCF:", rightColX, 75);
    doc.setFont("helvetica", "bold");
    doc.text(payment.ncf_number || "PENDIENTE", pageWidth - 15, 75, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text("Fecha:", rightColX, 82);
    doc.text(new Date(payment.created_at).toLocaleDateString(), pageWidth - 15, 82, { align: "right" });

    doc.text("Vence:", rightColX, 89);
    doc.text("31/12/2026", pageWidth - 15, 89, { align: "right" }); // Mock Sequence Exp

    // --- Table ---
    const tableData = [
        [
            `Servicio Legal: ${appointment.meeting_type === 'whatsapp' ? 'Consulta WhatsApp' : 'Video Consulta'} (${appointment.duration_minutes} min)`,
            "1",
            `$${payment.amount.toFixed(2)}`,
            `$${payment.amount.toFixed(2)}`
        ]
    ];

    autoTable(doc, {
        startY: 100,
        head: [['Descripción', 'Cant', 'Precio', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' }
        }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- Totals ---
    // ITBIS Calculation (Inclusive)
    // Base = Total / 1.18
    const total = payment.amount;
    const basePrice = total / 1.18;
    const itbis = total - basePrice;

    doc.setFontSize(10);
    doc.text("Subtotal:", pageWidth - 60, finalY);
    doc.text(`$${basePrice.toFixed(2)}`, pageWidth - 15, finalY, { align: "right" });

    doc.text("ITBIS (18%):", pageWidth - 60, finalY + 7);
    doc.text(`$${itbis.toFixed(2)}`, pageWidth - 15, finalY + 7, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", pageWidth - 60, finalY + 16);
    doc.text(`$${total.toFixed(2)} USD`, pageWidth - 15, finalY + 16, { align: "right" });

    // --- Footer & QR ---
    const qrText = `https://dgii.gov.do/verificarNCO/Paginas/default.aspx?RNC=${company.rnc}&NCF=${payment.ncf_number}&Monto=${payment.amount}&Fecha=${appointment.date}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(qrText);
        doc.addImage(qrDataUrl, 'PNG', 15, finalY + 30, 30, 30);
    } catch (e) {
        console.warn("QR Error", e);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text("Código QR para validación ante la DGII", 15, finalY + 65);

    const legalText = payment.ncf_number?.startsWith("B01")
        ? "Factura válida para Crédito Fiscal"
        : "Factura para Consumidor Final";

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(legalText, pageWidth / 2, pageHeight - 15, { align: "center" });

    // Return Blob URL for viewing in browser
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
};
