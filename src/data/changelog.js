// What's New — user-facing changelog.
// Each entry carries BOTH languages so the page just reads the active locale.
// Keep it human and benefit-focused — NOT a dev commit log. Newest first.
// Western numerals everywhere (per the Arabic localization rules). No RTL flip.
//
// Shape:
//   { version: 'X.Y.Z', date: 'YYYY-MM-DD', tag: 'New' | 'Improved' | 'Fixed',
//     en: { title, points: [] }, ar: { title, points: [] } }
//
// Versioning: first public release = 1.1.0. A big new feature bumps the middle
// number (1.1.0 → 1.2.0); a small follow-up or fix bumps the last (1.2.0 → 1.2.1).

export const changelog = [
  {
    version: '1.4.0',
    date: '2026-06-19',
    tag: 'New',
    en: {
      title: 'Sell products by weight',
      points: [
        'Any product can now be sold by weight instead of by the piece — perfect for groceries, delis, butchers and produce.',
        'Set the price per kilogram, and at the POS the cashier just types the weight off the scale (e.g. 0.250 kg) on a quick keypad — the line total is worked out instantly.',
        'Stock is tracked to the gram, so your counts and profit stay exact.',
        'Turn it on per product under its “Selling Mode” toggle — only visible once you enable Weight-Based Selling in Settings → Capabilities.',
      ],
    },
    ar: {
      title: 'بيع المنتجات بالوزن',
      points: [
        'يمكن الآن بيع أي منتج بالوزن بدلاً من القطعة — مثالي للبقالة والأطعمة واللحوم والخضروات.',
        'حدّد السعر لكل كيلوجرام، وعند نقطة البيع يكتب الكاشير الوزن من الميزان (مثلاً 0.250 كجم) على لوحة أرقام سريعة — ويُحسب إجمالي السطر فوراً.',
        'يُتتبّع المخزون حتى الجرام، لتبقى الأعداد والأرباح دقيقة.',
        'فعّلها لكل منتج عبر مفتاح «طريقة البيع» — يظهر فقط بعد تفعيل البيع بالوزن من الإعدادات ← الإمكانيات.',
      ],
    },
  },
  {
    version: '1.3.0',
    date: '2026-06-19',
    tag: 'New',
    en: {
      title: 'One place to switch features on and off',
      points: [
        'New Settings → Capabilities page gathers your store’s big optional features in one spot: Multi-Unit Selling, Expiry / Batch Tracking, and Weight-Based Selling (coming soon).',
        'Each switch has a plain-language “?” explaining exactly what it does before you flip it.',
        'Turning a feature off never deletes anything — it just hides it, and a clear confirmation tells you what will be affected. Switch it back on and your data returns.',
        'New stores now pick a Store Type (Pharmacy, Grocery, and more) that sensibly pre-selects these switches — always adjustable afterwards.',
      ],
    },
    ar: {
      title: 'مكان واحد لتفعيل الميزات وإيقافها',
      points: [
        'صفحة جديدة: الإعدادات ← الإمكانيات تجمع ميزات متجرك الاختيارية الكبيرة في مكان واحد: البيع بوحدات متعددة، وتتبّع الصلاحية / التشغيلات، والبيع بالوزن (قريباً).',
        'لكل مفتاح زر «؟» يشرح بلغة بسيطة ما يفعله بالضبط قبل تفعيله.',
        'إيقاف أي ميزة لا يحذف شيئاً أبداً — يخفيها فقط، مع تأكيد واضح يخبرك بما سيتأثر. أعد التفعيل وتعود بياناتك.',
        'المتاجر الجديدة تختار الآن «نوع المتجر» (صيدلية، بقالة، وغيرها) يضبط هذه المفاتيح مبدئياً بشكل منطقي — ويمكن تعديلها دائماً لاحقاً.',
      ],
    },
  },
  {
    version: '1.2.1',
    date: '2026-06-19',
    tag: 'Improved',
    en: {
      title: 'Smoother pharmacy receiving',
      points: [
        'Receiving a brand-new medicine? You can now mark it for expiry tracking right on its first delivery — no need to create it first and receive it a second time.',
        'Receive stock by the strip or the full pack, not only by single piece — the system converts it to your base unit automatically and keeps your costs correct.',
        'Turning expiry tracking off now hides it cleanly everywhere, while your existing batch records stay safely stored in case you switch it back on.',
      ],
    },
    ar: {
      title: 'استلام أبسط للصيدليات',
      points: [
        'تستلم دواءً جديداً؟ يمكنك الآن تفعيل تتبّع الصلاحية له مباشرةً عند أول توريد — دون الحاجة لإنشائه أولاً ثم استلامه مرة أخرى.',
        'استلم المخزون بالشريط أو العلبة كاملة، لا بالقطعة فقط — ويحوّله النظام إلى وحدتك الأساسية تلقائياً مع بقاء التكاليف صحيحة.',
        'إيقاف تتبّع الصلاحية يخفيه الآن بنظافة من كل مكان، مع بقاء سجلات دفعاتك محفوظة بأمان في حال أعدت تفعيله.',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-06-19',
    tag: 'New',
    en: {
      title: 'Track expiry dates and sell oldest stock first',
      points: [
        'Perfect for pharmacies and anything with a shelf life: each delivery of a product is now kept as its own batch with its own expiry date.',
        'When you sell, the register automatically takes from the batch that expires soonest — so older stock leaves first and waste goes down.',
        'A new Expiry & Batches report shows what is expired and what is expiring soon, with the money value of each. A “Scan now” button alerts you on demand.',
        'You can warn the cashier — or fully block the sale — when stock has already expired.',
        'Completely optional: turn it on in Settings, then switch it on for the products that need it. Stores that do not use it (like a laptop shop) see nothing change.',
      ],
    },
    ar: {
      title: 'تتبّع تواريخ الصلاحية وبيع الأقدم أولاً',
      points: [
        'مثالية للصيدليات وكل ما له مدة صلاحية: تُحفظ كل دفعة واردة من المنتج كدفعة مستقلة بتاريخ انتهائها الخاص.',
        'عند البيع، يأخذ النظام تلقائياً من الدفعة الأقرب انتهاءً — فيخرج المخزون الأقدم أولاً ويقل الهدر.',
        'تقرير جديد «الصلاحية والدفعات» يعرض المنتهي والقريب من الانتهاء مع قيمته بالمال، وزر «فحص الآن» ينبّهك عند الطلب.',
        'يمكنك تحذير الكاشير — أو منع البيع تماماً — عندما يكون المخزون منتهي الصلاحية.',
        'اختيارية بالكامل: فعّلها من الإعدادات ثم شغّلها للمنتجات التي تحتاجها. المتاجر التي لا تستخدمها (كمحل لابتوبات) لن يتغير لديها شيء.',
      ],
    },
  },
  {
    version: '1.1.0',
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
