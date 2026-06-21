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
    version: '1.7.0',
    date: '2026-06-21',
    tag: 'New',
    en: {
      title: 'See your stock in packs and strips, not just single pieces',
      points: [
        'If a product is sold in bigger units — like a pack or a strip — your inventory now shows the count that way (for example "11 packs") instead of one big number of loose pieces. Hover over it to see the full picture: 11 packs · 1 strip · 4 pieces.',
        'Open any product to see a clear Stock Breakdown — how the units fit together ("1 pack = 2 strips = 20 pieces") and exactly what you have on the shelf right now.',
        'You can rename what a single unit is called (Pill, Tablet, Piece…) under Settings → Business Rules, and set default names for the bigger units (Strip, Pack) when you turn on multi-unit selling in Capabilities.',
        'Nothing changed for products sold as single items — they still show a plain number.',
      ],
    },
    ar: {
      title: 'شاهد مخزونك بالعبوات والشرائط، لا بالقطع المفردة فقط',
      points: [
        'إذا كان المنتج يُباع بوحدات أكبر — مثل عبوة أو شريط — أصبح المخزون يعرض العدد بهذه الطريقة (مثلاً "11 عبوة") بدلاً من رقم كبير من القطع المفردة. مرّر فوقه لترى الصورة الكاملة: 11 عبوة · 1 شريط · 4 قطع.',
        'افتح أي منتج لترى تفصيل المخزون بوضوح — كيف تتركب الوحدات ("1 عبوة = 2 شريط = 20 قطعة") وما لديك على الرف الآن بالضبط.',
        'يمكنك تغيير اسم الوحدة المفردة (قرص، حبة، قطعة…) من الإعدادات ← قواعد العمل، وضبط الأسماء الافتراضية للوحدات الأكبر (شريط، عبوة) عند تفعيل البيع متعدد الوحدات في القدرات.',
        'لم يتغير شيء للمنتجات التي تُباع كقطعة واحدة — تظل تعرض رقماً عادياً.',
      ],
    },
  },
  {
    version: '1.6.1',
    date: '2026-06-20',
    tag: 'Improved',
    en: {
      title: 'POS search now finds products by category',
      points: [
        'Type any part of a category name in the POS search bar and it will show all matching products — for example, typing "ele" will bring up every product under Electronics.',
        'Search still works as before for product name and SKU.',
      ],
    },
    ar: {
      title: 'بحث نقطة البيع يجد المنتجات بالتصنيف أيضاً',
      points: [
        'اكتب أي جزء من اسم تصنيف في شريط البحث وستظهر جميع المنتجات التابعة له — مثلاً، كتابة "إلك" ستعرض كل منتجات الإلكترونيات.',
        'البحث بالاسم والرمز (SKU) يعمل كما كان.',
      ],
    },
  },
  {
    version: '1.6.0',
    date: '2026-06-20',
    tag: 'New',
    en: {
      title: 'Notification sounds — choose, preview, and play',
      points: [
        'Your notifications now actually make a sound. Go to Settings → Sounds & Notifications, pick a sound for each alert type, and press the ▶ button to hear it before you choose.',
        'Every person on your team can set their own sounds — what the cashier hears is up to them.',
        'Store owners and admins can set the default sounds new staff start with, all from the same page.',
      ],
    },
    ar: {
      title: 'أصوات الإشعارات — اختر، جرّب، وشغّل',
      points: [
        'أصبحت إشعاراتك تصدر صوتاً فعلاً. من الإعدادات ← الأصوات والإشعارات، اختر صوتاً لكل نوع تنبيه، واضغط زر ▶ لتسمعه قبل أن تختاره.',
        'كل فرد في فريقك يستطيع ضبط أصواته الخاصة — ما يسمعه الكاشير من اختياره هو.',
        'يستطيع مالك المتجر والمدير ضبط الأصوات الافتراضية التي يبدأ بها الموظفون الجدد، من الصفحة نفسها.',
      ],
    },
  },
  {
    version: '1.5.3',
    date: '2026-06-20',
    tag: 'Improved',
    en: {
      title: "Color-coded What's New page",
      points: [
        "Every update on this page is now color-tagged at a glance: new features in green, fixes in red, and improvements in grey — so you can quickly see what kind of change each one is.",
      ],
    },
    ar: {
      title: 'صفحة "ما الجديد" بألوان حسب النوع',
      points: [
        'كل تحديث في هذه الصفحة أصبح ملوّناً بحسب نوعه: الميزات الجديدة بالأخضر، الإصلاحات بالأحمر، والتحسينات بالرمادي — لتعرف بنظرة سريعة نوع كل تغيير.',
      ],
    },
  },
  {
    version: '1.5.2',
    date: '2026-06-20',
    tag: 'Improved',
    en: {
      title: 'A cleaner, more compact Add Customer form',
      points: [
        'The Add Customer form now lays its fields out side by side instead of one long stacked column — so it fits the screen better and you do less scrolling.',
        'Same information, same fields — just a tidier, faster layout that matches the rest of the app.',
      ],
    },
    ar: {
      title: 'نموذج إضافة عميل أنظف وأكثر تنظيماً',
      points: [
        'أصبح نموذج إضافة عميل يعرض الحقول جنباً إلى جنب بدلاً من عمود واحد طويل — فيتناسب مع الشاشة بشكل أفضل ويقلّل التمرير.',
        'نفس المعلومات ونفس الحقول — فقط تنسيق أنظف وأسرع يتماشى مع باقي التطبيق.',
      ],
    },
  },
  {
    version: '1.5.1',
    date: '2026-06-20',
    tag: 'Fixed',
    en: {
      title: 'Add Customer and Add Staff buttons now work',
      points: [
        'Clicking "Add" on the Customers and Staff pages now opens the form as it should — previously the button did nothing on the live site.',
        'The cause was a small formatting issue in the email example text inside those forms. It is fixed, and we added a safeguard so this kind of slip can never reach the live site again.',
      ],
    },
    ar: {
      title: 'زرّا إضافة عميل وإضافة موظف يعملان الآن',
      points: [
        'الضغط على "إضافة" في صفحتي العملاء والموظفين يفتح النموذج كما ينبغي — في السابق لم يكن الزر يستجيب على الموقع المباشر.',
        'كان السبب مشكلة تنسيق بسيطة في نص مثال البريد الإلكتروني داخل النموذجين. تم إصلاحها، وأضفنا حماية تمنع وصول هذا النوع من الأخطاء إلى الموقع المباشر مرة أخرى.',
      ],
    },
  },
  {
    version: '1.5.0',
    date: '2026-06-20',
    tag: 'New',
    en: {
      title: 'Diagnosis notes on service jobs — with instant notifications',
      points: [
        'Engineers can now write a free-text diagnosis on any service job (e.g. "cracked screen backlight, battery at 40%"). It saves whether you mark the job Done or leave it open.',
        'Every time a diagnosis or a cost estimate is added or updated, the whole team gets an orange notification right away — no one is left out of the loop.',
        'Cost changes trigger the same notification, so the cashier always knows what to quote the customer.',
      ],
    },
    ar: {
      title: 'ملاحظات التشخيص في الخدمات — مع إشعارات فورية',
      points: [
        'يستطيع الفنيون الآن كتابة ملاحظة تشخيص حرة على أي طلب خدمة (مثلاً: "شاشة مكسورة، البطارية 40%"). تُحفظ سواء تمّ تسليم الجهاز أم لا.',
        'في كل مرة تُضاف تشخيص أو يُعدَّل تقدير التكلفة، يصل إشعار برتقالي للفريق كله فوراً — لا أحد يبقى خارج الصورة.',
        'تغييرات التكلفة تُطلق الإشعار ذاته، حتى يعرف الكاشير دائماً ما يُبلّغ به العميل.',
      ],
    },
  },
  {
    version: '1.4.1',
    date: '2026-06-20',
    tag: 'Improved',
    en: {
      title: 'Cleaner header, simpler people forms, and a few small fixes',
      points: [
        'Logout button and Settings icon moved to the top header for quicker access. Logging out now shows a confirmation step so you never do it by accident.',
        'The forms for adding a Customer, Supplier, or Staff member now start simple — just name, phone, and email. Click "More details" to expand the full form (WhatsApp, Instagram, website, country, city, notes). You can save with a name alone.',
        'Suppliers now store company name, all contact info, and social links — fill in as much or as little as you need.',
        'Staff can be added with just a name — a username is created automatically, and a password is generated if you leave it blank.',
        'Category level names in Settings now show placeholder text. Empty levels are hidden from the column picker in the Products table.',
        'The "Items are called" field in Settings is now free-text — type any word you like (letters, numbers, hyphens, max 10 characters).',
        'POS attribute/category display raised from 4 to 6 slots.',
      ],
    },
    ar: {
      title: 'رأس الصفحة أكثر نظافة، نماذج أشخاص أبسط، وإصلاحات صغيرة',
      points: [
        'زر تسجيل الخروج وأيقونة الإعدادات انتقلا إلى شريط العنوان العلوي للوصول السريع. تسجيل الخروج يطلب الآن تأكيداً حتى لا يحدث بالخطأ.',
        'نماذج إضافة العميل والمورّد وعضو الفريق أصبحت بسيطة في البداية — الاسم والهاتف والبريد فقط. اضغط "تفاصيل إضافية" لعرض الحقول الكاملة (واتساب، إنستجرام، موقع، دولة، مدينة، ملاحظات). يمكنك الحفظ بالاسم وحده.',
        'يخزّن المورّد الآن اسم الشركة وبيانات التواصل الكاملة والروابط — أضف ما تشاء.',
        'يمكن إضافة الموظف بالاسم فقط — اسم المستخدم يُنشأ تلقائيًا، وكذلك كلمة المرور إن تركتها فارغة.',
        'أسماء مستويات الفئات في الإعدادات تُظهر الآن نص إرشادي. المستويات الفارغة مخفية من قائمة الأعمدة في جدول المنتجات.',
        'حقل "المنتجات تُسمّى" في الإعدادات أصبح نصًا حرًا — اكتب أي كلمة تريدها (حروف وأرقام وشرطات، 10 أحرف كحد أقصى).',
        'رفعنا عدد الفئات والخصائص في إعدادات نقطة البيع من 4 إلى 6.',
      ],
    },
  },
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
        "New Settings → Capabilities page gathers your store’s big optional features in one spot: Multi-Unit Selling, Expiry / Batch Tracking, and Weight-Based Selling.",
        'Each switch has a plain-language “?” explaining exactly what it does before you flip it.',
        'Turning a feature off never deletes anything — it just hides it, and a clear confirmation tells you what will be affected. Switch it back on and your data returns.',
        'New stores now pick a Store Type (Pharmacy, Grocery, and more) that sensibly pre-selects these switches — always adjustable afterwards.',
      ],
    },
    ar: {
      title: 'مكان واحد لتفعيل الميزات وإيقافها',
      points: [
        'صفحة جديدة: الإعدادات ← الإمكانيات تجمع ميزات متجرك الاختيارية الكبيرة في مكان واحد: البيع بوحدات متعددة، وتتبّع الصلاحية والدفعات، والبيع بالوزن.',
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
