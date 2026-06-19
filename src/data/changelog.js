// What's New — user-facing changelog.
// Each entry carries BOTH languages so the page just reads the active locale.
// Keep it human and benefit-focused — NOT a dev commit log. Newest first.
// Western numerals everywhere (per the Arabic localization rules). No RTL flip.
//
// Shape:
//   { date: 'YYYY-MM-DD', tag: 'New' | 'Improved' | 'Fixed',
//     en: { title, points: [] }, ar: { title, points: [] } }

export const changelog = [
  {
    date: '2026-06-19',
    tag: 'New',
    en: {
      title: 'Sell by piece, strip, or full pack',
      points: [
        'A product can now be sold in more than one size from the same stock — for example, a medicine box sold as a single tablet, a strip, or a whole pack.',
        'For each size you set how many pieces it holds (e.g. a strip = 10 tablets) and its own price.',
        'Stock is always counted in the smallest piece, so your inventory stays accurate no matter which size you sell.',
        'At the register, just pick the size when you add the product to the bill.',
        'This is optional and set per product — anything sold one way keeps working exactly as before.',
      ],
    },
    ar: {
      title: 'البيع بالقطعة أو الشريط أو العلبة كاملة',
      points: [
        'يمكن الآن بيع المنتج بأكثر من حجم من نفس المخزون — مثلاً علبة دواء تُباع كقرص واحد، أو شريط، أو علبة كاملة.',
        'لكل حجم تحدد عدد القطع التي يحتويها (مثلاً: الشريط = 10 أقراص) وسعره الخاص.',
        'يُحسب المخزون دائماً بأصغر وحدة، فيبقى رصيدك دقيقاً مهما كان الحجم الذي تبيعه.',
        'عند البيع، اختر الحجم فقط عند إضافة المنتج إلى الفاتورة.',
        'الميزة اختيارية وتُضبط لكل منتج على حدة — وأي منتج يُباع بحجم واحد يعمل تماماً كما كان.',
      ],
    },
  },
]
