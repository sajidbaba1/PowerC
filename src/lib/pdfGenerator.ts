import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface Word {
    id: string;
    original: string;
    translated: string;
    pronunciation?: string;
    example?: string;
    notes?: string;
    createdAt: string | Date;
}

export const generateWordsPDF = (words: Word[], userRole: string, targetLang: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header Design ---
    // Background for header
    doc.setFillColor(255, 240, 245); // Lavender/Light Pinkish
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(236, 72, 153); // Pink-500
    doc.text(`Power Couple Learning Log`, pageWidth / 2, 15, { align: "center" });

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${userRole}'s Journey to ${targetLang}`, pageWidth / 2, 25, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 33, { align: "center" });

    // --- Stats Section ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Total Words Learned: ${words.length}`, 14, 50);

    // --- Table Data Preparation ---
    const tableData = words.map((word, index) => [
        index + 1,
        word.original,
        word.translated,
        word.pronunciation || '-',
        word.example || '-',
        format(new Date(word.createdAt), 'MMM d, yyyy')
    ]);

    // --- Table ---
    (doc as any).autoTable({
        startY: 55,
        head: [['#', 'Original', `Meaning (${targetLang})`, 'Pronunciation', 'Example/Notes', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [236, 72, 153], // Pink-500
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { fontStyle: 'bold' },
            2: { fontStyle: 'bold', textColor: [37, 99, 235] }, // Blue for translation
            5: { halign: 'center', cellWidth: 30 }
        },
        alternateRowStyles: {
            fillColor: [255, 248, 250] // Very light pink
        },
        margin: { top: 60 },
        didDrawPage: (data: any) => {
            // Footer
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Page ${data.pageNumber}`,
                data.settings.margin.left,
                pageHeight - 10
            );
            doc.text(
                'Power Couple App',
                pageSize.width - data.settings.margin.right,
                pageHeight - 10,
                { align: 'right' }
            );
        }
    });

    // Save
    const fileName = `${userRole}_${targetLang}_Words_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
};
