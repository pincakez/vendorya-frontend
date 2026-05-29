/**
 * Shared export utilities for report tables — CSV / Excel / PDF.
 *
 * Used by every report via <ExportMenu>. Built once so formatting is consistent
 * everywhere and nothing gets wired twice.
 *
 * columns: [{ key, label, type }]
 *   type ∈ 'text' | 'number' | 'currency' | 'qty' | 'date'
 *   - currency / number / qty / date cells render through utils/format + utils/date
 *     so exports match exactly what the user sees on screen.
 *   - Excel keeps numeric types as real numbers so totals stay computable;
 *     CSV and PDF use the display strings.
 */
import { formatNumber, formatCurrency, formatQty } from '@/utils/format'
import { formatDate } from '@/utils/date'

/** Display string for a cell, matching on-screen formatting. */
export function displayValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return type === 'text' ? '' : ''
  }
  switch (type) {
    case 'currency': return formatCurrency(value)
    case 'number':   return formatNumber(value)
    case 'qty':      return formatQty(value)
    case 'date':     return formatDate(value)
    default:         return String(value)
  }
}

function rawNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : value
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function csvEscape(s) {
  const str = String(s ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/** CSV — display strings, UTF-8 BOM so Excel opens Arabic/symbols correctly. */
export function exportCSV(rows, columns, filename) {
  const header = columns.map(c => csvEscape(c.label)).join(',')
  const body = rows.map(r =>
    columns.map(c => csvEscape(displayValue(r[c.key], c.type))).join(',')
  )
  const csv = '﻿' + [header, ...body].join('\r\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`)
}

/** Excel — numeric types as real numbers (computable), others as display strings. */
export async function exportExcel(rows, columns, filename, sheetName = 'Report') {
  const XLSX = await import('xlsx')
  const numeric = new Set(['number', 'currency', 'qty'])
  const aoa = [
    columns.map(c => c.label),
    ...rows.map(r => columns.map(c =>
      numeric.has(c.type) ? rawNumber(r[c.key]) : displayValue(r[c.key], c.type)
    )),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** PDF — landscape table with title + meta header (date range, store). */
export async function exportPDF(rows, columns, filename, title, meta = '') {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFontSize(14)
  doc.text(title || 'Report', 40, 36)
  if (meta) {
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(meta, 40, 52)
    doc.setTextColor(0)
  }

  autoTable(doc, {
    startY: meta ? 64 : 48,
    head: [columns.map(c => c.label)],
    body: rows.map(r => columns.map(c => displayValue(r[c.key], c.type))),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 40, right: 40 },
  })
  doc.save(`${filename}.pdf`)
}

export function useExport() {
  return { exportCSV, exportExcel, exportPDF, displayValue }
}
