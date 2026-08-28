import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import styles from './ExportButtons.module.css';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function escapeXml(value) {
  return String(value ?? '').replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]));
}

function downloadFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function cellValue(row, column) {
  return typeof column.value === 'function' ? column.value(row) : row[column.key];
}

function formatCell(value, column) {
  return column.format ? column.format(value) : value ?? '—';
}

function loadImageData(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function exportExcel(rows, columns, title) {
  const xmlRows = [columns.map(({ label }) => label), ...rows.map((row) => columns.map((column) => formatCell(cellValue(row, column), column)))]
    .map((row) => `<Row>${row.map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join('')}</Row>`).join('');
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${escapeXml(title)}"><Table>${xmlRows}</Table></Worksheet></Workbook>`;
  downloadFile(`\ufeff${xml}`, `${title.toLowerCase().replace(/\s+/g, '-')}.xls`, 'application/vnd.ms-excel;charset=utf-8');
}

async function exportPdf(rows, columns, metadata) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logo = await loadImageData(metadata.partnerLogo);

  doc.setFillColor(0, 105, 166);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(18, 25, pageWidth - 36, 43, 5, 5, 'F');
  if (logo) doc.addImage(logo, 'PNG', 27, 34, 36, 25, undefined, 'FAST');
  doc.setTextColor(24, 60, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(metadata.partnerName, 73, 45, { maxWidth: pageWidth - 92 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(83, 109, 123);
  doc.text(`CNPJ: ${metadata.cnpj}`, 73, 54);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(25);
  doc.text(`Relatório de ${metadata.title}`, 18, 119);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, 18, 140);
  if (metadata.filters.length) {
    doc.setFontSize(9);
    doc.text(`Filtros: ${metadata.filters.join(' | ')}`, 18, 165, { maxWidth: pageWidth - 36 });
  }
  doc.setDrawColor(255, 255, 255);
  doc.line(18, pageHeight - 37, pageWidth - 18, pageHeight - 37);
  doc.setFontSize(9);
  doc.text(`${rows.length} registro(s) exportado(s)`, 18, pageHeight - 26);
  doc.text('Documento gerado eletronicamente pela MAG Capitalização.', 18, pageHeight - 18);

  doc.addPage();
  doc.setFillColor(0, 105, 166);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setTextColor(24, 60, 81);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(metadata.title, 18, 23);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(113, 134, 145);
  doc.text(`${metadata.tab} | ${rows.length} registro(s)`, 18, 30);
  autoTable(doc, {
    startY: 38,
    head: [columns.map(({ label }) => label)],
    body: rows.map((row) => columns.map((column) => formatCell(cellValue(row, column), column))),
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [83, 109, 123] },
    headStyles: { fillColor: [0, 105, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 250] },
    didDrawPage: ({ pageNumber }) => {
      doc.setFontSize(8);
      doc.setTextColor(145, 165, 174);
      doc.text(`MAG Capitalização | ${metadata.partnerName} | Página ${pageNumber}`, pageWidth - 18, pageHeight - 10, { align: 'right' });
    },
  });
  doc.save(`${metadata.title.toLowerCase().replace(/\s+/g, '-')}-${metadata.tab.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export default function ExportButtons({ rows, columns, title = 'Relatório', tab = title, filters = [], getAllRows, partnerLogo, partnerName, cnpj }) {
  const [isExporting, setIsExporting] = useState(false);
  const disabled = !rows.length || isExporting;

  async function getExportRows() {
    return getAllRows ? getAllRows() : rows;
  }

  async function handlePdf() {
    setIsExporting(true);
    try {
      const exportRows = await getExportRows();
      await exportPdf(exportRows, columns, { title, tab, filters, partnerLogo, partnerName, cnpj });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExcel() {
    setIsExporting(true);
    try {
      exportExcel(await getExportRows(), columns, title);
    } finally {
      setIsExporting(false);
    }
  }

  return <div className={styles.exportArea}>
    <button className={styles.trigger} type="button" aria-haspopup="true" disabled={isExporting}>
      <Download size={17} strokeWidth={1.9} aria-hidden="true" />
      <span>{isExporting ? 'Preparando...' : 'Exportar'}</span>
      <ChevronDown className={styles.chevron} size={15} strokeWidth={1.9} aria-hidden="true" />
    </button>
    <div className={styles.options} role="menu">
      <button type="button" role="menuitem" disabled={disabled} onClick={handleExcel}><span className={`${styles.fileIcon} ${styles.excelIcon}`}><FileSpreadsheet size={15} strokeWidth={2} aria-hidden="true" /></span>Excel</button>
      <button type="button" role="menuitem" disabled={disabled} onClick={handlePdf}><span className={`${styles.fileIcon} ${styles.pdfIcon}`}><FileText size={15} strokeWidth={2} aria-hidden="true" /></span>PDF</button>
    </div>
  </div>;
}
