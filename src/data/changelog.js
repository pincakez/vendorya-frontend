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
    version: '1.37.1',
    date: '2026-10-07',
    tag: 'Fixed',
    en: {
      title: 'Product names are back in the product list',
      points: [
        'In some column layouts the product list squeezed the product name column to nothing. The name now always shows, at its full width.',
        'You can now edit a supplier whose code has 2 digits from the product page’s supplier list — before, it only accepted 3-digit codes.',
      ],
    },
    ar: {
      title: 'أسماء الأصناف رجعت في قائمة الأصناف',
      points: [
        'في بعض ترتيبات الأعمدة كانت قائمة الأصناف تضغط عمود اسم الصنف حتى يختفي. الآن يظهر الاسم دائمًا بعرضه الكامل.',
        'يمكنك الآن تعديل مورّد كوده رقمين من قائمة الموردين في صفحة الأصناف — كانت تقبل الأكواد المكونة من 3 أرقام فقط.',
      ],
    },
  },
  {
    version: '1.37.0',
    date: '2026-10-07',
    tag: 'New',
    en: {
      title: 'A full description on every product page',
      points: [
        'The product page now has its own Description section under the photos — with headings, bold words and bullet lists, so a long text about a device reads like a real product page.',
        'Arabic paragraphs line up on the right by themselves, English ones on the left — in the same description.',
        'The description box in Edit Product is bigger, so long texts are easier to write.',
      ],
    },
    ar: {
      title: 'وصف كامل في صفحة كل صنف',
      points: [
        'صفحة الصنف فيها الآن قسم خاص بالوصف تحت الصور — بعناوين وكلمات بخط عريض ونقاط، فالنص الطويل عن أي جهاز يُقرأ كصفحة منتج حقيقية.',
        'الفقرات العربية تصطف على اليمين تلقائيًا والإنجليزية على اليسار — في نفس الوصف.',
        'خانة الوصف في تعديل الصنف أصبحت أكبر، فكتابة النصوص الطويلة أسهل.',
      ],
    },
  },
  {
    version: '1.36.1',
    date: '2026-10-07',
    tag: 'Improved',
    en: {
      title: 'Scanning finds the exact item first',
      points: [
        'When you scan or type a code, the item with exactly that code now always comes first — a short code like 12077 no longer lands on a longer code that merely contains it.',
        'Codes with dashes (like 123-45-67) are found whether you type the dashes or not.',
        'When you add a new supplier, Vendorya now suggests the next free supplier code for you.',
      ],
    },
    ar: {
      title: 'المسح يجد الصنف المطابق أولًا',
      points: [
        'عند مسح أو كتابة كود، يظهر الآن الصنف الذي له نفس الكود بالضبط أولًا دائمًا — فالكود القصير مثل 12077 لم يعد يذهب إلى كود أطول يحتويه فقط.',
        'الأكواد التي بها شرطات (مثل 123-45-67) تُوجد سواء كتبت الشرطات أم لا.',
        'عند إضافة مورّد جديد، يقترح Vendorya عليك الآن أول كود مورّد متاح.',
      ],
    },
  },
  {
    version: '1.36.0',
    date: '2026-10-07',
    tag: 'New',
    en: {
      title: 'Your own product codes — and a second code (SKU2)',
      points: [
        'Each shop can now have its own product code style: how many digits for the product, the supplier and the shop, with or without dashes. The platform team sets it up with you before your first product.',
        'When a part of the code runs out of numbers, it simply grows by one digit — and codes you already printed on stickers never change.',
        'New: SKU2, a second code on every product — for example the code from your old system that is already printed on your stickers. Scan it or type it and the product is found.',
        'SKU2 can show in your product list, on the product page, in the POS search, on price stickers, and in the product file import/export.',
      ],
    },
    ar: {
      title: 'أكواد أصناف على مقاسك — وكود ثاني (SKU2)',
      points: [
        'كل متجر يمكنه الآن أن يكون له شكل أكواد خاص به: عدد أرقام الصنف والمورّد والمتجر، مع شرطات أو بدونها. يجهّزه معك فريق المنصة قبل أول صنف.',
        'عندما تنفد أرقام جزء من الكود، يزيد رقمًا واحدًا تلقائيًا — والأكواد المطبوعة على الملصقات لا تتغير أبدًا.',
        'جديد: SKU2، كود ثاني لكل صنف — مثل كود نظامك القديم المطبوع على ملصقاتك. امسحه أو اكتبه ويظهر الصنف.',
        'يمكن أن يظهر SKU2 في قائمة الأصناف، وصفحة الصنف، وبحث نقطة البيع، وملصقات الأسعار، وملف استيراد وتصدير الأصناف.',
      ],
    },
  },
  {
    version: '1.35.1',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'Safer sales, transfers and settings',
      points: [
        'A sale can no longer be completed twice — even with a double click or a weak connection. If the connection drops after the sale went through, pressing Confirm again simply shows the finished sale.',
        'Moving stock between branches now moves its expiry dates too, earliest-expiring first — so each branch knows exactly what it holds and when it expires.',
        'Moving stock to a branch that never had that item before works again.',
        '"Items are called" in Settings now accepts any word you type (letters, numbers and "-", up to 10 characters).',
        'Cashiers can now use the shop\'s label sizes when printing labels.',
        'Empty lists now show their message across the whole table.',
      ],
    },
    ar: {
      title: 'مبيعات وتحويلات وإعدادات أكثر أمانًا',
      points: [
        'لم يعد ممكنًا إتمام نفس البيع مرتين — حتى مع الضغط مرتين أو ضعف الاتصال. وإذا انقطع الاتصال بعد إتمام البيع، فالضغط على "تأكيد" مرة أخرى يعرض البيع المكتمل فقط.',
        'تحويل المخزون بين الفروع ينقل تواريخ الصلاحية معه الآن، بدءًا بالأقرب انتهاءً — فيعرف كل فرع بالضبط ما لديه ومتى تنتهي صلاحيته.',
        'تحويل المخزون إلى فرع لم يكن لديه هذا الصنف من قبل يعمل مرة أخرى.',
        'خانة "اسم الأصناف" في الإعدادات تقبل الآن أي كلمة تكتبها (حروف وأرقام و"-"، حتى 10 أحرف).',
        'يمكن للكاشير الآن استخدام مقاسات الملصقات الخاصة بالمتجر عند طباعة الملصقات.',
        'القوائم الفارغة تعرض رسالتها الآن على عرض الجدول كله.',
      ],
    },
  },
  {
    version: '1.35.0',
    date: '2026-10-06',
    tag: 'Improved',
    en: {
      title: 'The Cash Drawer now matches your shift',
      points: [
        'Cash refunds now come out of the drawer: when a customer gets cash back, the shift\'s expected cash goes down by that amount — so closing the shift no longer shows a false "over".',
        'Only cash really paid out counts: a refund on a card sale goes back to the card, and a refund on a credit (Ajel) sale just lowers the customer\'s debt.',
        'The Cash Drawer page shows your open shift: cash in from sales, cash out for refunds, the expected balance, and every cash move — the same numbers used when you close the shift.',
        'A cashier can only close their own shift; managers can close any shift.',
      ],
    },
    ar: {
      title: 'درج النقد يطابق ورديتك الآن',
      points: [
        'المرتجعات النقدية تُخصم الآن من الدرج: عندما يسترد العميل نقدًا، ينخفض النقد المتوقع في الوردية بنفس المبلغ — فلم يعد إغلاق الوردية يُظهر "زيادة" غير حقيقية.',
        'يُحسب فقط النقد المدفوع فعلًا: مرتجع بيع بالبطاقة يعود إلى البطاقة، ومرتجع بيع آجل يخفض دين العميل فقط.',
        'صفحة درج النقد تعرض ورديتك المفتوحة: النقد الوارد من المبيعات، والنقد الصادر للمرتجعات، والرصيد المتوقع، وكل حركة نقدية — بنفس الأرقام المستخدمة عند إغلاق الوردية.',
        'الكاشير يغلق ورديته فقط؛ والمدير يمكنه إغلاق أي وردية.',
      ],
    },
  },
  {
    version: '1.34.5',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'Small fixes: language, service edits, and the medicine finder',
      points: [
        'Choosing Arabic in My Profile is now remembered — it no longer switches back to English.',
        'Changing a service job\'s cost or diagnosis no longer shows an error after it saves.',
        'Cashiers can now use the "same ingredient / same trade name" finder at the Point of Sale.',
      ],
    },
    ar: {
      title: 'إصلاحات صغيرة: اللغة وتعديل الصيانة والبحث عن البدائل',
      points: [
        'اختيار اللغة العربية من ملفك الشخصي أصبح محفوظًا — ولم يعد يرجع إلى الإنجليزية.',
        'تعديل تكلفة أو تشخيص طلب الصيانة لم يعد يُظهر رسالة خطأ بعد الحفظ.',
        'يمكن للكاشير الآن استخدام البحث عن "نفس المادة الفعالة / نفس الاسم التجاري" في نقطة البيع.',
      ],
    },
  },
  {
    version: '1.34.4',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'Staff accounts are better protected',
      points: [
        'Only someone with a higher role can add, change or deactivate a staff member — an Admin can no longer create an Owner or change the Owner\'s account.',
        'Nobody can change their own role or deactivate themselves.',
        'Adding a staff member with just a name (no password) works again — a password is created for them.',
      ],
    },
    ar: {
      title: 'حماية أفضل لحسابات الموظفين',
      points: [
        'فقط صاحب الدور الأعلى يمكنه إضافة موظف أو تعديله أو إيقافه — لم يعد بإمكان المسؤول إنشاء مالك أو تعديل حساب المالك.',
        'لا يمكن لأحد تغيير دوره بنفسه أو إيقاف حسابه بنفسه.',
        'إضافة موظف بالاسم فقط (بدون كلمة مرور) تعمل مرة أخرى — ويتم إنشاء كلمة مرور له تلقائيًا.',
      ],
    },
  },
  {
    version: '1.34.3',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'The lock screen PIN is now properly protected',
      points: [
        'Only the shop owner can set, change or remove the lock-screen PIN.',
        'After 5 wrong PIN tries, the lock screen waits 5 minutes before trying again.',
        'The lock screen now always asks for the PIN on every account, including cashiers.',
      ],
    },
    ar: {
      title: 'رمز شاشة القفل أصبح محميًا بشكل صحيح',
      points: [
        'فقط مالك المتجر يمكنه تعيين رمز شاشة القفل أو تغييره أو إزالته.',
        'بعد 5 محاولات خاطئة، تنتظر شاشة القفل 5 دقائق قبل المحاولة مرة أخرى.',
        'شاشة القفل تطلب الرمز الآن دائمًا على كل الحسابات، بما فيها حسابات الكاشير.',
      ],
    },
  },
  {
    version: '1.34.2',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'Cashier sales always include every item in the cart',
      points: [
        'When a cashier changed the cart (added items, changed quantities), some changes could be missed when the sale was completed. Every change is now saved.',
        'Putting a cart on hold no longer leaves unfinished invoices behind.',
      ],
    },
    ar: {
      title: 'مبيعات الكاشير تشمل دائمًا كل الأصناف في السلة',
      points: [
        'عندما كان الكاشير يغيّر السلة (يضيف أصنافًا أو يغيّر الكميات)، كان من الممكن ألا تُحفظ بعض التغييرات عند إتمام البيع. الآن يتم حفظ كل تغيير.',
        'تعليق السلة لم يعد يترك فواتير غير مكتملة.',
      ],
    },
  },
  {
    version: '1.34.1',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'Credit (Ajel) sales at the register now add to the customer\'s balance',
      points: [
        'A sale paid with Ajel now stays unpaid and is added to the customer\'s balance — before, it was saved as fully paid.',
        'Completing the sale and taking the payment now happen in one step.',
        'If you turn off credit selling, cash and card sales at the register still work normally.',
        'Ajel needs a named customer — the payment window tells you right away if Walk-in is selected.',
        'The payment window shows the total including VAT when your store charges tax.',
      ],
    },
    ar: {
      title: 'البيع الآجل في نقطة البيع يُضاف الآن إلى رصيد العميل',
      points: [
        'البيع بالآجل يبقى الآن غير مدفوع ويُضاف إلى رصيد العميل — من قبل كان يُسجَّل كمدفوع بالكامل.',
        'إتمام البيع واستلام الدفع يتمان الآن في خطوة واحدة.',
        'إذا أوقفت البيع الآجل، يظل البيع نقدًا أو بالبطاقة في نقطة البيع يعمل بشكل طبيعي.',
        'البيع الآجل يحتاج عميلاً باسمه — نافذة الدفع تنبهك فورًا إذا كان العميل "عميل نقدي".',
        'نافذة الدفع تعرض الإجمالي شاملاً ضريبة القيمة المضافة عندما يطبّق متجرك الضريبة.',
      ],
    },
  },
  {
    version: '1.34.0',
    date: '2026-10-06',
    tag: 'New',
    en: {
      title: 'Finishing a service job now asks how the customer paid',
      points: [
        'When you mark a service job as Done, choose how the customer paid — cash, card, or any of your payment methods.',
        'Choose Ajel to add the cost to the customer\'s balance (the job needs a named customer).',
        'Free jobs (cost 0) are finished without asking.',
      ],
    },
    ar: {
      title: 'إنهاء طلب الصيانة يسألك الآن كيف دفع العميل',
      points: [
        'عند تحديد طلب الصيانة كمكتمل، اختر طريقة دفع العميل — نقدًا أو بالبطاقة أو أي طريقة دفع لديك.',
        'اختر "آجل" لإضافة التكلفة إلى رصيد العميل (يحتاج الطلب إلى عميل باسمه).',
        'الطلبات المجانية (التكلفة 0) تكتمل دون سؤال.',
      ],
    },
  },
  {
    version: '1.33.3',
    date: '2026-10-06',
    tag: 'Fixed',
    en: {
      title: 'POS Settings and product selling units are now fully in Arabic',
      points: [
        'The POS Settings page — its title, description and the Top Selling, Favorites, Cart Display and Keyboard tabs — now shows in Arabic when Arabic is selected.',
        'The "Selling Units" section on a product page (add unit, unit name, how many, barcode) is now in Arabic too.',
      ],
    },
    ar: {
      title: 'إعدادات نقطة البيع ووحدات بيع المنتج أصبحت بالعربية بالكامل',
      points: [
        'صفحة إعدادات نقطة البيع — عنوانها ووصفها وتبويبات الأكثر مبيعاً والمفضلة وعرض السلة ولوحة المفاتيح — تظهر الآن بالعربية عند اختيار اللغة العربية.',
        'قسم "وحدات البيع" في صفحة المنتج (إضافة وحدة، اسم الوحدة، كم، الباركود) أصبح بالعربية أيضًا.',
      ],
    },
  },
  {
    version: '1.33.2',
    date: '2026-07-12',
    tag: 'Fixed',
    en: {
      title: 'The register now opens offline without getting stuck on branch selection',
      points: [
        'If your internet drops while you\'re working, switching to the Point of Sale no longer gets stuck on a "Select Branch" screen it can\'t finish.',
        'The register now remembers the branch you last sold from and opens straight to it, even with no connection.',
        'On the rare first-ever open of a device that\'s already offline, you\'ll now see a clear message instead of an empty screen — just connect once to set it up.',
      ],
    },
    ar: {
      title: 'نقطة البيع تفتح الآن دون اتصال دون التوقف عند اختيار الفرع',
      points: [
        'إذا انقطع الإنترنت أثناء عملك، لم يعد التبديل إلى نقطة البيع يتوقف عند شاشة "اختر الفرع" التي يتعذّر إكمالها.',
        'تتذكر نقطة البيع الآن الفرع الذي بعت منه آخر مرة وتفتح عليه مباشرة، حتى بدون اتصال.',
        'في الحالة النادرة لأول فتح على جهاز غير متصل أصلاً، سترى الآن رسالة واضحة بدلاً من شاشة فارغة — فقط اتصل مرة واحدة لإعداده.',
      ],
    },
  },
  {
    version: '1.33.1',
    date: '2026-07-06',
    tag: 'Improved',
    en: {
      title: 'Adding a product now fills in pack & strip sizes automatically',
      points: [
        'When you add a product and pick a known medicine from the suggestions, its pack and strip sizes are now filled in for you — no manual typing. (This already worked while editing a product; now it works while adding one too.)',
        'A simple checkbox lets you choose whether single units are also sold, matching your 2- or 3-tier choice in Settings → Capabilities.',
        'New medicines received on a purchase get their pack and strip sizes set automatically too — nothing extra to fill in.',
        'The related setting is now clearly labeled: "Auto-fill pack & strip sizes from the drug reference when adding or editing a product."',
      ],
    },
    ar: {
      title: 'إضافة منتج تملأ الآن مقاسات العبوة والشريط تلقائيًا',
      points: [
        'عند إضافة منتج واختيار دواء معروف من الاقتراحات، تُملأ الآن مقاسات العبوة والشريط تلقائيًا — دون إدخال يدوي. (كان هذا يعمل عند تعديل منتج؛ وأصبح يعمل الآن عند الإضافة أيضًا.)',
        'يتيح لك مربع اختيار بسيط تحديد ما إذا كانت الوحدات المفردة تُباع أيضًا، بما يطابق اختيارك للمستويين أو الثلاثة في الإعدادات ← الإمكانيات.',
        'الأدوية الجديدة المستلمة عبر فاتورة شراء تحصل على مقاسات العبوة والشريط تلقائيًا كذلك — لا شيء إضافي لملئه.',
        'أصبح الإعداد المرتبط موضحًا بعنوان صريح: "املأ مقاسات العبوة والشريط تلقائيًا من مرجع الأدوية عند إضافة أو تعديل منتج".',
      ],
    },
  },
  {
    version: '1.33.0',
    date: '2026-07-05',
    tag: 'New',
    en: {
      title: 'Find alternative brands with the same active ingredient',
      points: [
        'In the register search and in the Memory Base, type /sametrade followed by an active ingredient (for example: Paracetamol) to see every product that contains it.',
        'Or type /sameing followed by a brand name (for example: Panadol) — the system finds that brand\'s active ingredient and shows you all the alternatives.',
        'Press Enter and a window lists the matching brands. At the register it shows only what you have in stock, with the price and quantity — ideal for offering a substitute when something is out of stock.',
        'A small tag next to the search box shows the mode is on. Type /clear, or click the tag\'s ✕, to go back to normal search.',
      ],
    },
    ar: {
      title: 'ابحث عن أصناف بديلة بنفس المادة الفعالة',
      points: [
        'في بحث نقطة البيع وفي بنك الذاكرة، اكتب /sametrade متبوعًا بمادة فعالة (مثل: Paracetamol) لعرض كل صنف يحتوي عليها.',
        'أو اكتب /sameing متبوعًا باسم صنف تجاري (مثل: Panadol) — يجد النظام المادة الفعالة لذلك الصنف ويعرض لك كل البدائل.',
        'اضغط Enter لتظهر نافذة بالأصناف المطابقة. عند نقطة البيع تعرض فقط ما هو متوفر لديك في المخزون، مع السعر والكمية — مثالية لتقديم بديل عند نفاد صنف.',
        'تظهر علامة صغيرة بجوار مربع البحث توضح أن الوضع مُفعّل. اكتب /clear، أو اضغط ✕ على العلامة، للعودة إلى البحث العادي.',
      ],
    },
  },
  {
    version: '1.32.2',
    date: '2026-07-05',
    tag: 'Fixed',
    en: {
      title: 'Search results no longer jump to the wrong list',
      points: [
        'Fixed an issue where typing quickly in a search box could suddenly show results that had nothing to do with what you typed — most noticeable after four or more letters.',
        'Search now always shows the results for exactly what is in the box. This affects product search, the Memory Base, adding a product, and the purchases search.',
      ],
    },
    ar: {
      title: 'نتائج البحث لم تعد تقفز إلى قائمة خاطئة',
      points: [
        'تم إصلاح مشكلة كانت تجعل الكتابة السريعة في مربع البحث تعرض فجأة نتائج لا علاقة لها بما كتبته — وكانت أوضح بعد أربعة أحرف أو أكثر.',
        'أصبح البحث يعرض دائمًا نتائج ما هو مكتوب في المربع تمامًا. يشمل ذلك بحث المنتجات، بنك الذاكرة، إضافة منتج، وبحث المشتريات.',
      ],
    },
  },
  {
    version: '1.32.1',
    date: '2026-07-05',
    tag: 'Improved',
    en: {
      title: 'Lock screen messages — now your own, from a simple spreadsheet',
      points: [
        'The lock screen messages are now yours to write. Go to Settings → Lock Screen → Facts Bank, download the template, type one message per line under the "lockinfo" column, and upload the CSV.',
        'Your messages rotate at the bottom of the lock screen, one per session. Arabic and English both display correctly.',
        'When you have not added any messages, the lock screen simply shows nothing — clean, with no placeholder.',
      ],
    },
    ar: {
      title: 'رسائل شاشة القفل — أصبحت من عندك عبر ملف بسيط',
      points: [
        'أصبحت رسائل شاشة القفل من كتابتك. من الإعدادات ← شاشة القفل ← بنك المعلومات، نزّل القالب، اكتب رسالة في كل سطر تحت عمود "lockinfo"، ثم ارفع ملف CSV.',
        'تظهر رسائلك في أسفل شاشة القفل بالتناوب، واحدة في كل جلسة. تظهر العربية والإنجليزية بشكل صحيح.',
        'عندما لا تضيف أي رسائل، لا تعرض شاشة القفل شيئًا — نظيفة بلا حشو.',
      ],
    },
  },
  {
    version: '1.32.0',
    date: '2026-07-05',
    tag: 'New',
    en: {
      title: 'Sell by pack, strip, or single unit — powered by the drug reference',
      points: [
        'When you add a pharmacy product that the drug reference knows, the register can now offer it as a full pack, a single strip, or a single unit — with the pack and strip sizes filled in for you automatically.',
        'New in Settings → Capabilities: name your three tiers (Pack, Strip, Unit) and choose whether the store shows 2 or 3 tiers by default. The biggest tier is always available.',
        'Turn on "Make the register respect the drug reference packaging" and the strip/pack sizes are read from the reference — no manual typing.',
        'Each product can override the store default from its edit panel: two simple checkboxes decide whether the register sells single strips and single units.',
        'The Memory Base table gained two optional columns — strips per pack and units per strip — so you can see a drug\'s packaging at a glance (turn them on under Customize).',
      ],
    },
    ar: {
      title: 'البيع بالعبوة أو الشريط أو الوحدة المفردة — مدعوم بمرجع الأدوية',
      points: [
        'عند إضافة منتج صيدلية معروف في مرجع الأدوية، يمكن لنقطة البيع الآن عرضه كعبوة كاملة أو شريط مفرد أو وحدة مفردة — مع تعبئة مقاسات العبوة والشريط تلقائيًا.',
        'جديد في الإعدادات → الإمكانات: سمِّ الوحدات الثلاث (العبوة، الشريط، الوحدة) واختر هل يعرض المتجر وحدتين أو ثلاثًا افتراضيًا. الوحدة الأكبر متاحة دائمًا.',
        'فعّل «اجعل نقطة البيع تلتزم بتعبئة مرجع الأدوية» فتُقرأ مقاسات الشريط والعبوة من المرجع — دون إدخال يدوي.',
        'يمكن لكل منتج تجاوز الإعداد الافتراضي من لوحة تعديله: خانتان بسيطتان تحددان هل تبيع نقطة البيع الشرائط والوحدات المفردة.',
        'اكتسب جدول مرجع الأدوية عمودين اختياريين — عدد الشرائط في العبوة وعدد الوحدات في الشريط — لرؤية تعبئة الدواء بنظرة (فعّلهما من التخصيص).',
      ],
    },
  },
  {
    version: '1.31.0',
    date: '2026-06-29',
    tag: 'New',
    en: {
      title: 'Auto-Lock Screen — protect your store when you step away',
      points: [
        'The app now locks itself automatically after a period of inactivity (choose 5, 10, 20, 30 minutes, 1 h, 2 h, or 4 h — or turn it off).',
        'A full-screen lock card appears with your store logo, and you can unlock it with a 4-to-6-digit PIN you set yourself.',
        'Wrong PIN gives you a visual shake and resets automatically. Correct PIN zooms the card away smoothly.',
        'The lock screen shows rotating "did you know" facts tailored to your store type (pharmacy, grocery, etc.) — generated by AI, different every day.',
        'Set everything up under Settings → Lock Screen: timer, PIN, logo, store type, and the facts bank.',
      ],
    },
    ar: {
      title: 'شاشة القفل التلقائي — احمِ متجرك عند ابتعادك',
      points: [
        'التطبيق يقفل نفسه تلقائيًا بعد فترة خمول تختارها: 5 أو 10 أو 20 أو 30 دقيقة، أو ساعة، أو ساعتين، أو 4 ساعات — أو عطّل الميزة.',
        'تظهر شاشة قفل كاملة بشعار متجرك، وتفتحها برمز PIN من 4 إلى 6 أرقام تضعه أنت.',
        'الرمز الخاطئ يعطيك اهتزازًا مرئيًا ويعيد الضبط تلقائيًا. الرمز الصحيح يُغلق الشاشة بانسيابية.',
        'تعرض شاشة القفل معلومات ممتعة تتغير يوميًا ومصممة لنوع متجرك (صيدلية، بقالة، إلخ) — مولّدة بالذكاء الاصطناعي.',
        'اضبط كل شيء من الإعدادات → شاشة القفل: المؤقت، الرمز، الشعار، نوع المتجر، وبنك المعلومات.',
      ],
    },
  },
  {
    version: '1.30.0',
    date: '2026-06-29',
    tag: 'Improved',
    en: {
      title: 'Global search — finds settings options and works in Arabic',
      points: [
        'Searching for any setting (like "lock", "PIN", or "timer") now shows the exact option and its parent page (e.g. Lock Screen › PIN Code) — just like Android settings search.',
        'The search now works in Arabic: type "قفل" or "رمز سر" and find the right page instantly.',
        'Typo-tolerance is on — a misspelling still finds the right result.',
        'Keyboard navigation improved: use Tab, arrow keys, or Enter to move through results and go straight to a page.',
        'The search index rebuilds automatically every 12 hours in the background.',
      ],
    },
    ar: {
      title: 'البحث الشامل — يجد خيارات الإعدادات ويعمل بالعربية',
      points: [
        'البحث عن أي إعداد (مثل "قفل" أو "رمز سر" أو "مؤقت") يظهر الخيار المحدد مع صفحته الأم (مثلاً شاشة القفل › رمز PIN) — تمامًا كبحث إعدادات أندرويد.',
        'البحث يعمل الآن بالعربية الكاملة.',
        'الأخطاء الإملائية لا تمنعك — تحمّل التطبيق الأخطاء ويجد النتيجة الصحيحة.',
        'تنقّل بلوحة المفاتيح: Tab والأسهم وEnter للتنقل بين النتائج والانتقال للصفحة مباشرة.',
        'فهرس البحث يتجدد تلقائيًا كل 12 ساعة في الخلفية.',
      ],
    },
  },
  {
    version: '1.29.1',
    date: '2026-06-29',
    tag: 'New',
    en: {
      title: 'Admin: API Stats page — drug enrichment progress tracker',
      points: [
        'A new page under the AI section in the admin panel shows live progress on the drug-profile enrichment job (§DE).',
        'See how many drug profiles have been created, how many still need attention, and the completion percentage across all solid-dose drugs.',
        'Includes the shell command to run the enrichment, the last run timestamp, and a breakdown by which AI model was used.',
      ],
    },
    ar: {
      title: 'المشرف: صفحة إحصائيات API — متتبع تقدم إثراء بيانات الأدوية',
      points: [
        'صفحة جديدة ضمن قسم الذكاء الاصطناعي في لوحة الإدارة تعرض التقدم الفعلي لعملية إثراء بيانات الأدوية.',
        'اعرف كم ملفًا دوائيًا تم إنشاؤه، وكم يحتاج مراجعة، ونسبة الاكتمال على جميع الأدوية الصلبة.',
        'تتضمن أمر تشغيل الإثراء، وتاريخ آخر تشغيل، وتوزيعًا حسب نموذج الذكاء الاصطناعي المستخدم.',
      ],
    },
  },
  {
    version: '1.29.0',
    date: '2026-06-29',
    tag: 'Improved',
    en: {
      title: 'Memory Base — resizable columns, search, and filters',
      points: [
        'The Memory Base drug list now uses the same powerful table engine as the Products page: drag columns left and right to reorder them, resize any column by pulling its edge, and hide columns you don\'t need.',
        'You can save your preferred layout as a named preset and switch between layouts instantly — useful if you want different views for browsing vs. checking prices.',
        'Search now uses typo-tolerant matching (the same engine as the POS and New Purchase screens), so a small spelling mistake still finds the right drug.',
        'A category filter lets you narrow the list to one drug bucket at a time.',
      ],
    },
    ar: {
      title: 'قاعدة المعلومات — أعمدة قابلة للتغيير والبحث والتصفية',
      points: [
        'قائمة الأدوية في قاعدة المعلومات تستخدم الآن نفس محرك الجدول القوي الموجود في صفحة المنتجات: اسحب الأعمدة يمينًا ويسارًا لإعادة ترتيبها، وغيّر عرض أي عمود بسحب حافته، وأخفِ الأعمدة التي لا تحتاجها.',
        'يمكنك حفظ تخطيطك المفضل كإعداد مسمى والتبديل بين التخطيطات فورًا.',
        'يدعم البحث الآن التسامح مع الأخطاء الإملائية، فخطأ بسيط في الكتابة لن يمنعك من إيجاد الدواء الصحيح.',
        'يتيح لك تصفية الفئات تضييق القائمة إلى مجموعة دوائية واحدة في كل مرة.',
      ],
    },
  },
  {
    version: '1.28.0',
    date: '2026-06-28',
    tag: 'New',
    en: {
      title: 'Product showcase — photos and a video for each product',
      points: [
        'Each product can now hold up to 5 photos plus one short video, shown in a clean gallery on the product page.',
        'Any photo you upload is automatically tidied up and made web-light: it is centered (never stretched) and saved in an efficient format that loads fast.',
        'Videos are automatically converted to a light, instantly-playing format and start muted on a loop when you open the page — tap the speaker to turn the sound on. A tall (portrait) video shows taller and a wide video shows wider, using the space well.',
        'You choose what each product opens with — the video or a photo slideshow — and whether it plays on its own or waits for a tap.',
        'A note under the gallery always shows the current upload limits (sizes, length and how many photos).',
      ],
    },
    ar: {
      title: 'عرض المنتج — صور وفيديو لكل منتج',
      points: [
        'يمكن لكل منتج الآن أن يحتوي على حتى 5 صور بالإضافة إلى فيديو قصير واحد، تُعرض في معرض أنيق على صفحة المنتج.',
        'أي صورة ترفعها تُحسَّن تلقائيًا لتصبح خفيفة وسريعة التحميل: تُوسَّط (دون أي تمديد) وتُحفظ بصيغة فعّالة.',
        'يُحوَّل الفيديو تلقائيًا إلى صيغة خفيفة تعمل فورًا، ويبدأ صامتًا ويتكرر عند فتح الصفحة — اضغط على رمز الصوت لتشغيله. الفيديو الطولي يظهر أطول والعرضي يظهر أعرض لاستغلال المساحة.',
        'أنت تختار بماذا يبدأ كل منتج — الفيديو أو عرض شرائح الصور — وهل يعمل تلقائيًا أم ينتظر الضغط.',
        'تظهر ملاحظة أسفل المعرض دائمًا توضح حدود الرفع الحالية (الأحجام والمدة وعدد الصور).',
      ],
    },
  },
  {
    version: '1.27.2',
    date: '2026-06-28',
    tag: 'Fixed',
    en: {
      title: 'Edit selling units directly from the products list',
      points: [
        'The edit button on the products list now shows the Selling Units section for existing products — you no longer have to open the full product page just to add or change units like Strip or Pack.',
        'Changes save immediately alongside the rest of the product details.',
      ],
    },
    ar: {
      title: 'تعديل وحدات البيع مباشرة من قائمة المنتجات',
      points: [
        'أصبح زر التعديل في قائمة المنتجات يعرض قسم وحدات البيع للمنتجات الموجودة — لم تعد بحاجة لفتح صفحة المنتج الكاملة فقط لإضافة وحدة مثل شريط أو علبة أو تعديلها.',
        'التغييرات تُحفظ فورًا مع بقية تفاصيل المنتج.',
      ],
    },
  },
  {
    version: '1.27.1',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'Side menu opens one section at a time',
      points: [
        'Opening a section in the side menu now automatically closes the one that was open before, keeping the menu tidy and easy to scan.',
      ],
    },
    ar: {
      title: 'القائمة الجانبية تفتح قسمًا واحدًا في كل مرة',
      points: [
        'فتح قسم في القائمة الجانبية يُغلق الآن القسم الذي كان مفتوحًا تلقائيًا، مما يجعل القائمة منظمة وسهلة القراءة.',
      ],
    },
  },
  {
    version: '1.27.0',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'Search bar now finds any page or setting',
      points: [
        'The search bar at the top now covers every page in the app — inventory, finance, reports, settings sub-pages like Capabilities or POS Settings, and more.',
        'Keywords work too: typing "clock" finds POS Settings, "drug" finds Memory Base, "fefo" finds Capabilities.',
        'If you make a typo the search still finds the closest match and shows a "Did you mean…" hint instead of leaving you with nothing.',
      ],
    },
    ar: {
      title: 'شريط البحث يجد الآن أي صفحة أو إعداد',
      points: [
        'شريط البحث في الأعلى يغطي الآن كل صفحة في التطبيق — المخزون والمالية والتقارير وصفحات الإعدادات الفرعية مثل الإمكانيات أو إعدادات نقطة البيع وأكثر.',
        'الكلمات المفتاحية تعمل أيضًا: كتابة "ساعة" تجد إعدادات نقطة البيع، و"دواء" يجد قاعدة الأدوية.',
        'إذا أخطأت في الكتابة يجد البحث أقرب نتيجة ويعرض تلميح "هل تقصد…" بدلًا من ترك الصفحة فارغة.',
      ],
    },
  },
  {
    version: '1.26.0',
    date: '2026-06-28',
    tag: 'New',
    en: {
      title: 'A status bar at the bottom of the register',
      points: [
        'The POS screen now has a slim bar along the bottom showing how many lines and units are in the cart and the current total at a glance.',
        'It also shows whether you are online or offline, and quick reminders of the handy keyboard shortcuts.',
      ],
    },
    ar: {
      title: 'شريط حالة أسفل شاشة البيع',
      points: [
        'أصبح في شاشة نقطة البيع شريط رفيع بالأسفل يعرض عدد الأسطر والوحدات في السلة والإجمالي الحالي بنظرة واحدة.',
        'كما يعرض ما إذا كنت متصلًا بالإنترنت أم لا، مع تذكير سريع باختصارات لوحة المفاتيح المفيدة.',
      ],
    },
  },
  {
    version: '1.25.0',
    date: '2026-06-28',
    tag: 'New',
    en: {
      title: 'Choose a 12-hour or 24-hour clock',
      points: [
        'You can now pick how the time shows on the POS screen — 24-hour (13:05) or 12-hour with AM/PM (1:05 PM).',
        'Set it under Settings → POS → Cart Display. It applies to the clock in the register topbar.',
      ],
    },
    ar: {
      title: 'اختر ساعة 12 أو 24',
      points: [
        'يمكنك الآن اختيار طريقة عرض الوقت في شاشة نقطة البيع — 24 ساعة (13:05) أو 12 ساعة مع AM/PM (1:05 PM).',
        'تجده في الإعدادات ← نقطة البيع ← عرض السلة. يُطبَّق على الساعة في الشريط العلوي للبيع.',
      ],
    },
  },
  {
    version: '1.24.1',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'A reminder when a sale is still open',
      points: [
        'If you leave the register with items still in the cart, the POS button in the side menu now gently shimmers.',
        'It is just a reminder to go back and finish the sale — leaving the register never cancels or loses it.',
      ],
    },
    ar: {
      title: 'تنبيه عندما تكون هناك فاتورة مفتوحة',
      points: [
        'إذا غادرت شاشة البيع وما زالت هناك أصناف في السلة، يلمع زر نقطة البيع في القائمة الجانبية بلطف.',
        'إنه مجرد تذكير بالعودة لإتمام البيع — مغادرة الشاشة لا تُلغي الفاتورة ولا تفقدها أبدًا.',
      ],
    },
  },
  {
    version: '1.24.0',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'A cleaner register toolbar',
      points: [
        'The POS topbar got a tidy-up: a shorter search box, a bigger bolder clock and cashier name, and a clear "Exit" button to return to the dashboard.',
        'Leaving with the Exit button keeps any open sale exactly as it was — it just takes you back, like opening another page.',
        'Dark-mode and Arabic/English switches are now right in the register, so you don\'t have to leave to change them.',
      ],
    },
    ar: {
      title: 'شريط أدوات أنظف لشاشة البيع',
      points: [
        'تم ترتيب الشريط العلوي لنقطة البيع: صندوق بحث أقصر، وساعة واسم كاشير أكبر وأوضح، وزر "خروج" واضح للعودة إلى لوحة التحكم.',
        'المغادرة بزر الخروج تُبقي أي فاتورة مفتوحة كما هي تمامًا — إنها فقط تعيدك، تمامًا كفتح صفحة أخرى.',
        'أصبح تبديل الوضع الداكن واللغة (عربي/إنجليزي) متاحًا داخل شاشة البيع مباشرة، دون الحاجة للخروج لتغييرهما.',
      ],
    },
  },
  {
    version: '1.23.0',
    date: '2026-06-28',
    tag: 'New',
    en: {
      title: 'Search in Arabic at the register',
      points: [
        'You can now type a product\'s Arabic name (or its Arabic active ingredient) in the POS search and find it instantly.',
        'The results show the Arabic name on top with the English name beneath, so it is clear which product you are picking.',
        'Searching by code, barcode and English name keeps working exactly as before.',
      ],
    },
    ar: {
      title: 'البحث بالعربية في شاشة البيع',
      points: [
        'يمكنك الآن كتابة اسم المنتج بالعربية (أو مادته الفعّالة بالعربية) في بحث نقطة البيع والعثور عليه فورًا.',
        'تعرض النتائج الاسم العربي في الأعلى والاسم الإنجليزي تحته، ليتضح أي منتج تختاره.',
        'يظل البحث بالكود والباركود والاسم الإنجليزي يعمل تمامًا كما كان.',
      ],
    },
  },
  {
    version: '1.22.0',
    date: '2026-06-28',
    tag: 'New',
    en: {
      title: 'Print a purchase invoice',
      points: [
        'When you save a purchase, you can now tick "Print purchase invoice" to get a clean printable copy.',
        'It lists the supplier, the date, your purchase number and the supplier\'s invoice number, plus every item with its cost and retail price and the totals.',
        'Great for filing your supplier paperwork or handing back a confirmation.',
      ],
    },
    ar: {
      title: 'طباعة فاتورة الشراء',
      points: [
        'عند حفظ عملية شراء، يمكنك الآن تحديد "طباعة فاتورة الشراء" للحصول على نسخة مرتبة قابلة للطباعة.',
        'تعرض المورّد والتاريخ ورقم الشراء ورقم فاتورة المورّد، مع كل صنف وتكلفته وسعر بيعه والإجماليات.',
        'مفيدة لحفظ مستندات المورّد أو تسليم نسخة تأكيد.',
      ],
    },
  },
  {
    version: '1.21.0',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'A cleaner, faster New Purchase screen',
      points: [
        'The New Purchase window now opens compact — supplier, date and notes up front, with a live running summary of total items, pieces, cost and retail value.',
        'Tap the arrow to slide out the full items list when you\'re ready to add products; tap it again to tuck it away.',
        'If you\'ve added items but hidden the list, the arrow gently blinks so you never forget there\'s work in progress.',
      ],
    },
    ar: {
      title: 'شاشة فاتورة شراء أوضح وأسرع',
      points: [
        'تفتح نافذة فاتورة الشراء الآن بشكل مُصغّر — المورّد والتاريخ والملاحظات في المقدمة، مع ملخص حيّ لإجمالي الأصناف والقطع والتكلفة وقيمة البيع.',
        'اضغط السهم لإظهار قائمة الأصناف كاملة عندما تكون جاهزًا لإضافة المنتجات، واضغطه مرة أخرى لإخفائها.',
        'إذا أضفت أصنافًا وأخفيت القائمة، يومض السهم بلطف كي لا تنسى أن هناك عملًا قيد الإنجاز.',
      ],
    },
  },
  {
    version: '1.20.1',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'Arabic drug names in the New Purchase search',
      points: [
        'When you search in Arabic on the New Purchase screen, the dropdown now shows the Arabic trade name first, with the English name underneath so you still see exactly what gets saved.',
        'The active ingredient is shown in Arabic too when you search in Arabic.',
        'Searching in English is unchanged — you get the English name and ingredient as before.',
      ],
    },
    ar: {
      title: 'أسماء الأدوية بالعربية في بحث فاتورة الشراء',
      points: [
        'عند البحث بالعربية في شاشة فاتورة الشراء، تعرض القائمة الآن الاسم التجاري بالعربية أولًا، مع الاسم الإنجليزي تحته لترى بالضبط ما سيُحفظ.',
        'كما تظهر المادة الفعّالة بالعربية عند البحث بالعربية.',
        'البحث بالإنجليزية كما هو — تحصل على الاسم والمادة الفعّالة بالإنجليزية كالمعتاد.',
      ],
    },
  },
  {
    version: '1.20.0',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'Search now forgives spelling mistakes',
      points: [
        'Product search now finds the right item even when the name is typed with a mistake — type "convantin" and you still get "Conventin".',
        'This works whether you type in English or in Arabic.',
        'Results are always shown in English, so the list stays quick to read no matter how you searched.',
        'If the search engine is ever unavailable, search keeps working the way it did before — nothing breaks.',
      ],
    },
    ar: {
      title: 'البحث الآن يتسامح مع الأخطاء الإملائية',
      points: [
        'أصبح بحث الأصناف يعثر على الصنف الصحيح حتى لو كُتب الاسم بخطأ — اكتب "convantin" وستظهر لك "Conventin".',
        'يعمل هذا سواء كتبت بالإنجليزية أو بالعربية.',
        'تظهر النتائج دائمًا بالإنجليزية، لتبقى القائمة سهلة القراءة مهما كانت طريقة بحثك.',
        'وإذا تعذّر عمل محرك البحث لأي سبب، يستمر البحث كما كان من قبل — لا شيء يتعطل.',
      ],
    },
  },
  {
    version: '1.19.0',
    date: '2026-06-28',
    tag: 'New',
    en: {
      title: 'Choose where the product search looks',
      points: [
        'Settings → Capabilities now has a "Search & Autocomplete" section where you can choose the source for the New Purchase search.',
        '"Memory Base" (the default) searches the full 26,000+ drug reference — perfect when your own received catalog is small.',
        '"Store History" searches only products you have actually received or added — results grow richer the more you use the system.',
        'When Store History finds nothing, a note appears in the dropdown letting you know and suggesting how to switch sources.',
        'You can also turn off the option that automatically adds new products to the shared drug reference pool — useful if you want full control over what goes in.',
      ],
    },
    ar: {
      title: 'اختر مصدر بحث الأصناف',
      points: [
        'أضفنا في الإعدادات ← الإمكانيات قسمًا جديدًا "البحث والإكمال التلقائي" لتتحكم في مصدر البحث عند إضافة فاتورة شراء.',
        '"قاعدة الذاكرة" (الافتراضي) تبحث في مرجع الأدوية الكامل (أكثر من 26,000 اسم) — مثالية حين يكون كتالوجك الخاص صغيرًا.',
        '"سجل المتجر" يبحث فقط في الأصناف التي استلمتها أو أضفتها — النتائج تتحسن كلما زاد استخدامك للنظام.',
        'حين لا يعثر سجل المتجر على شيء، تظهر ملاحظة في القائمة المنسدلة توضح كيفية تبديل المصدر.',
        'يمكنك أيضًا إيقاف الخيار الذي يضيف المنتجات الجديدة تلقائيًا لمجموعة مرجع الأدوية، إن أردت التحكم الكامل فيما يُضاف.',
      ],
    },
  },
  {
    version: '1.18.1',
    date: '2026-06-28',
    tag: 'Improved',
    en: {
      title: 'New Purchase — cleaner item entry flow',
      points: [
        'After filling in a product\'s details, press Enter twice quickly to collapse that row and keep the screen tidy — the data stays saved.',
        'A small arrow button now appears on any collapsed row so you can re-open it to make a correction without searching for the product again.',
      ],
    },
    ar: {
      title: 'فاتورة الشراء — إدخال أنظف للأصناف',
      points: [
        'بعد ملء تفاصيل المنتج، اضغط Enter مرتين بسرعة لطي السطر والإبقاء على الشاشة مرتبة — البيانات تُحفظ كما هي.',
        'يظهر الآن زر سهم صغير على أي سطر مطوي لإعادة فتحه وتصحيح أي حقل دون الحاجة للبحث عن المنتج من جديد.',
      ],
    },
  },
  {
    version: '1.18.0',
    date: '2026-06-27',
    tag: 'Improved',
    en: {
      title: 'New Purchase screen is wider, faster to fill, and fills itself in',
      points: [
        'The New Purchase window is now wider so you can see more of each item at a glance, and it scrolls neatly when you add many items.',
        'When you pick a drug, the system auto-fills its category, active ingredient, brand and manufacturer for you — the only things you type by hand are the price and the expiry date.',
        'Each field that gets filled in briefly lights up, so you can see exactly what the system added.',
        '"Track expiry & batches" is now ticked by default for a new product, so expiry dates are captured from the very first purchase.',
        'You can add a new category or a new attribute option right from the purchase screen with a + button — no need to leave and set it up somewhere else first.',
      ],
    },
    ar: {
      title: 'شاشة فاتورة الشراء أصبحت أوسع وأسرع في التعبئة وتملأ نفسها',
      points: [
        'أصبحت نافذة فاتورة الشراء أوسع لترى تفاصيل كل صنف بوضوح، وتنزلق بسلاسة عند إضافة أصناف كثيرة.',
        'عند اختيار دواء، يملأ النظام تلقائياً فئته ومادته الفعّالة وعلامته التجارية والشركة المصنّعة — ولا تكتب يدوياً سوى السعر وتاريخ الصلاحية.',
        'كل حقل يتم ملؤه يُضيء للحظة حتى ترى بالضبط ما أضافه النظام.',
        'أصبح خيار "تتبّع الصلاحية والدفعات" مفعّلاً تلقائياً للمنتج الجديد، حتى تُسجَّل تواريخ الصلاحية من أول عملية شراء.',
        'يمكنك إضافة فئة جديدة أو خيار جديد لإحدى الخصائص مباشرةً من شاشة الشراء عبر زر + — دون الحاجة للخروج وإعدادها في مكان آخر.',
      ],
    },
  },
  {
    version: '1.17.0',
    date: '2026-06-27',
    tag: 'Improved',
    en: {
      title: 'Searching for a drug in New Purchase is now fast and accurate',
      points: [
        'Type 3 characters and the system instantly shows up to 20 matching drugs — names that start with what you typed appear first, then others that contain it.',
        'If the drug\'s trade name does not match, the system also searches by active ingredient so you can find "Conventin" by typing "gabapentin".',
        'The search now also shows the active ingredient under each trade name, so you can quickly confirm you have the right drug.',
        'Speed: the previous 3–4 second lag is gone. A database index was added, and category lookups that were slowing things down were removed.',
        'Stale results are no longer possible: if you type quickly and delete a character, the list always reflects your latest input — never a previous one.',
      ],
    },
    ar: {
      title: 'البحث عن دواء في فاتورة الشراء أصبح سريعاً ودقيقاً',
      points: [
        'اكتب 3 أحرف ويعرض النظام فوراً حتى 20 دواءً مطابقاً — الأسماء التي تبدأ بما كتبته تظهر أولاً، ثم الأسماء التي تحتويه.',
        'إذا لم يتطابق الاسم التجاري، يبحث النظام أيضاً في المادة الفعّالة حتى تجد "Conventin" بكتابة "gabapentin".',
        'يظهر الآن اسم المادة الفعّالة أسفل كل اسم تجاري لتتأكد بسرعة من اختيار الدواء الصحيح.',
        'السرعة: اختفى التأخير السابق (3-4 ثوانٍ) بعد إضافة فهرس لقاعدة البيانات وإزالة بحث الفئات الذي كان يبطئ النتائج.',
        'النتائج دائماً محدّثة: إذا كتبت بسرعة أو حذفت حرفاً، تعكس القائمة آخر ما كتبته دائماً.',
      ],
    },
  },
  {
    version: '1.16.2',
    date: '2026-06-27',
    tag: 'Improved',
    en: {
      title: 'Your changes are safe when closing a form',
      points: [
        'If you have typed anything in a form and accidentally press Escape or click the X, the system now asks before discarding your work.',
        'A small card appears with two options: Cancel (which keeps the form open so you can continue) or Discard & close (which closes without saving).',
        'Cancel is highlighted by default — so pressing Enter stays in the form, and you have to deliberately choose to discard.',
      ],
    },
    ar: {
      title: 'بياناتك محفوظة عند إغلاق النموذج',
      points: [
        'إذا كتبت أي شيء في نموذج ثم ضغطت Escape أو النقر على X بالخطأ، سيسألك النظام قبل حذف ما كتبته.',
        'تظهر بطاقة صغيرة بخيارين: إلغاء (يبقي النموذج مفتوحاً لتكمل عملك) أو تجاهل وإغلاق (يغلق دون حفظ).',
        'إلغاء مُحدَّد افتراضياً — فالضغط على Enter يبقيك في النموذج، وعليك اختيار التجاهل بشكل متعمد.',
      ],
    },
  },
  {
    version: '1.16.1',
    date: '2026-06-27',
    tag: 'Fixed',
    en: {
      title: 'Dashboard now fully in Arabic',
      points: [
        'When your store is set to Arabic, the dashboard cards now show their titles in Arabic too — like Today, Recent Sales, Upcoming Services, Revenue Ring, Activity Feed, and Weekly Revenue.',
        'Before, those card titles stayed in English even when the rest of the app was Arabic.',
      ],
    },
    ar: {
      title: 'لوحة التحكم أصبحت بالعربية بالكامل',
      points: [
        'عند ضبط متجرك على العربية، أصبحت بطاقات لوحة التحكم تعرض عناوينها بالعربية أيضاً — مثل اليوم، وأحدث المبيعات، والخدمات القادمة، وحلقة الإيرادات، وسجل النشاط، والإيرادات الأسبوعية.',
        'سابقاً كانت عناوين هذه البطاقات تبقى بالإنجليزية حتى عندما يكون باقي التطبيق بالعربية.',
      ],
    },
  },
  {
    version: '1.16.0',
    date: '2026-06-27',
    tag: 'New',
    en: {
      title: 'A cleaner way to browse your categories',
      points: [
        'The Categories page now works like folders on a computer: click a category and what is inside it opens in the next column beside it — so you can walk through your whole structure from left to right.',
        'Hover over any product inside a category to see its details (like active ingredient, brand, and manufacturer) in a small pop-up — no need to open it.',
        'Add, rename, or remove categories right from each column as you browse.',
      ],
    },
    ar: {
      title: 'طريقة أوضح لتصفح فئاتك',
      points: [
        'صفحة الفئات أصبحت تعمل مثل المجلدات على الكمبيوتر: انقر على فئة فيظهر ما بداخلها في عمود جديد بجانبها — حتى تتنقل عبر هيكل فئاتك من اليسار إلى اليمين.',
        'مرّر المؤشر فوق أي منتج داخل فئة لترى تفاصيله (مثل المادة الفعّالة والعلامة التجارية والشركة المصنّعة) في نافذة صغيرة — دون الحاجة لفتحه.',
        'أضف أو أعد تسمية أو احذف الفئات مباشرة من كل عمود أثناء التصفح.',
      ],
    },
  },
  {
    version: '1.15.0',
    date: '2026-06-27',
    tag: 'New',
    en: {
      title: 'Start your store with ready-made categories',
      points: [
        'When a new store is set up, it can now come with a few broad starter categories already in place — so you are not staring at an empty list on day one.',
        'For a pharmacy, that is Drugs, Cosmetics, Kids, and Medical Tools. You can rename, add, or remove any of them anytime in Inventory → Categories.',
        'Deleting a category that has sub-categories under it now asks first: move everything up one level, or delete it all together — no more losing items by accident.',
      ],
    },
    ar: {
      title: 'ابدأ متجرك بفئات جاهزة',
      points: [
        'عند إنشاء متجر جديد، يمكن أن يأتي الآن ومعه عدد قليل من الفئات الأساسية الجاهزة — حتى لا تبدأ بقائمة فارغة من أول يوم.',
        'للصيدلية، هذه الفئات هي: أدوية، مستحضرات تجميل، أطفال، وأدوات طبية. يمكنك إعادة تسمية أي منها أو إضافة أو حذف فئات في أي وقت من المخزون ← الفئات.',
        'حذف فئة تحتوي على فئات فرعية أصبح يسألك أولاً: نقل كل ما بداخلها مستوى واحد للأعلى، أو حذفها كلها معاً — حتى لا تفقد أصنافاً عن طريق الخطأ.',
      ],
    },
  },
  {
    version: '1.14.0',
    date: '2026-06-23',
    tag: 'New',
    en: {
      title: 'A heads-up before you oversell',
      points: [
        'If a cart line is for more than you have in stock, that line now turns red so you notice right away.',
        'If your store does not allow selling below zero, the Pay button is held back until you fix the quantity — so you can’t accidentally sell stock you don’t have.',
        'If your store does allow it, you’ll just see a friendly warning and can still take the payment.',
      ],
    },
    ar: {
      title: 'تنبيه قبل البيع بأكثر من المتاح',
      points: [
        'إذا كان سطر في السلة بكمية أكبر من المتاح في المخزون، يتحول هذا السطر الآن إلى اللون الأحمر لتلاحظه فوراً.',
        'إذا كان متجرك لا يسمح بالبيع تحت الصفر، يتم تعطيل زر الدفع حتى تصحّح الكمية — حتى لا تبيع مخزوناً لا تملكه عن طريق الخطأ.',
        'إذا كان متجرك يسمح بذلك، فسترى تحذيراً فقط ويمكنك إتمام الدفع.',
      ],
    },
  },
  {
    version: '1.13.1',
    date: '2026-06-23',
    tag: 'Improved',
    en: {
      title: 'Cleaner, faster pop-ups at the register',
      points: [
        'Every register pop-up now closes with the Esc key or by clicking outside it, and has one clear close (✕) button.',
        'You can move through the choices with the keyboard — arrows, Tab, and Space or Enter to pick — handy for fast, keyboard-only selling.',
        'The selected unit (like Strip or Pack) now shows as a clear badge on the cart line.',
      ],
    },
    ar: {
      title: 'نوافذ منبثقة أوضح وأسرع في نقطة البيع',
      points: [
        'تُغلق الآن كل نافذة منبثقة في نقطة البيع بمفتاح Esc أو بالنقر خارجها، ولها زر إغلاق (✕) واضح واحد.',
        'يمكنك التنقّل بين الخيارات بلوحة المفاتيح — الأسهم وTab ومسافة أو Enter للاختيار — وهو مفيد للبيع السريع بلوحة المفاتيح فقط.',
        'تظهر الوحدة المختارة (مثل Strip أو Pack) الآن كشارة واضحة على سطر السلة.',
      ],
    },
  },
  {
    version: '1.13.0',
    date: '2026-06-23',
    tag: 'New',
    en: {
      title: 'Set quantities in a flash',
      points: [
        'Press the * key to jump straight to the last item’s quantity, type the number, and press Enter — no more clicking + over and over.',
        'You can also click a quantity and type it directly.',
        'Selling loose units that add up to a full pack? The line rolls up automatically — for example, 20 tablets becomes 1 strip.',
      ],
    },
    ar: {
      title: 'أدخل الكميات بسرعة',
      points: [
        'اضغط مفتاح * للانتقال مباشرة إلى كمية آخر صنف، اكتب الرقم ثم اضغط Enter — دون النقر على + مراراً وتكراراً.',
        'يمكنك أيضاً النقر على الكمية وكتابتها مباشرة.',
        'تبيع وحدات مفردة تُكوّن عبوة كاملة؟ يتجمّع السطر تلقائياً — مثلاً، 20 قرصاً تصبح شريطاً واحداً.',
      ],
    },
  },
  {
    version: '1.12.0',
    date: '2026-06-23',
    tag: 'New',
    en: {
      title: 'Your sale is no longer lost if the screen reloads',
      points: [
        'Your in-progress cart is now saved on the device, so if the page refreshes or you minimize and come back, your sale is still there.',
        'When a new version of Vendorya is ready, you’ll see a notice at the top to refresh when it suits you — the screen no longer reloads on its own in the middle of a sale.',
      ],
    },
    ar: {
      title: 'لن تفقد عملية البيع إذا أُعيد تحميل الشاشة',
      points: [
        'يتم الآن حفظ سلة البيع الجارية على الجهاز، فإذا أُعيد تحميل الصفحة أو صغّرت النافذة ثم عدت، تبقى عمليتك كما هي.',
        'عند توفّر إصدار جديد من Vendorya، سيظهر تنبيه في الأعلى لتحديثه في الوقت المناسب لك — لن تُعيد الشاشة تحميل نفسها أثناء عملية البيع.',
      ],
    },
  },
  {
    version: '1.11.2',
    date: '2026-06-23',
    tag: 'Improved',
    en: {
      title: 'Cleaner supplier purchase history',
      points: [
        'Each supplier’s purchase history now shows just the essentials — reference, date, total, and status.',
        'We removed the per-invoice paid/owed columns that could be misleading; your real balance with a supplier (total purchased, total paid, and outstanding) is shown clearly at the top of their page.',
      ],
    },
    ar: {
      title: 'سجل مشتريات المورد أصبح أوضح',
      points: [
        'يعرض سجل مشتريات كل مورد الآن الأساسيات فقط — المرجع والتاريخ والإجمالي والحالة.',
        'أزلنا عمودي المدفوع/المستحق لكل فاتورة لأنهما قد يكونان مضللين؛ رصيدك الفعلي مع المورد (إجمالي المشتريات والمدفوعات والمستحق) يظهر بوضوح أعلى صفحته.',
      ],
    },
  },
  {
    version: '1.11.1',
    date: '2026-06-23',
    tag: 'Improved',
    en: {
      title: 'Change a product’s unit right from the cart',
      points: [
        'Selling a product that comes in different units (like tablet, strip, or pack)? Just tap its line in the cart to switch the unit — no need to delete it and add it again.',
        'The receipt now prints the unit you sold (for example “Bi Profenid · Strip”), so it is clear exactly what the customer bought.',
      ],
    },
    ar: {
      title: 'غيّر وحدة المنتج مباشرة من سلة البيع',
      points: [
        'تبيع منتجاً يأتي بوحدات مختلفة (مثل حبة أو شريط أو عبوة)؟ اضغط على سطره في السلة لتغيير الوحدة — دون الحاجة لحذفه وإضافته من جديد.',
        'يطبع الإيصال الآن الوحدة التي بعتها (مثل «Bi Profenid · Strip») ليتضح تماماً ما اشتراه العميل.',
      ],
    },
  },
  {
    version: '1.11.0',
    date: '2026-06-22',
    tag: 'New',
    en: {
      title: 'Track what you owe each supplier',
      points: [
        'You can now record a payment to a supplier directly from their page — choose the amount, date, and payment method (cash, bank transfer, card, or other).',
        'Each supplier now shows a clear summary: total purchased, total paid, and outstanding balance.',
        'A full payment history is listed under each supplier so you can see every payment you have ever made.',
      ],
    },
    ar: {
      title: 'تتبع ما تدين به لكل مورد',
      points: [
        'يمكنك الآن تسجيل دفعة لأي مورد مباشرة من صفحته — حدد المبلغ والتاريخ وطريقة الدفع (نقداً أو تحويل بنكي أو بطاقة أو غير ذلك).',
        'يعرض كل مورد الآن ملخصاً واضحاً: إجمالي المشتريات وإجمالي المدفوعات والرصيد المستحق.',
        'يمكنك الاطلاع على كامل سجل الدفعات لكل مورد لمتابعة كل دفعة سددتها.',
      ],
    },
  },
  {
    version: '1.10.2',
    date: '2026-06-22',
    tag: 'Fixed',
    en: {
      title: 'Stock ledger now shows correct quantities for strip and pack products',
      points: [
        'When you receive products in strips or packs, the Stock Movement Ledger now shows the correct number of base units added — for example, receiving 10 strips of a 20-tablet strip now correctly shows +200 tablets.',
        'The running balance in the ledger now always matches your actual stock on hand.',
      ],
    },
    ar: {
      title: 'سجل الحركة يعرض الآن كميات صحيحة للمنتجات التي تُشترى بالشريط أو العبوة',
      points: [
        'عند استلام منتجات بالشريط أو العبوة، يعرض سجل حركة المخزون الآن العدد الصحيح من الوحدات الأساسية — مثلاً: استلام 10 أشرطة من شريط 20 حبة يُظهر الآن +200 حبة.',
        'الرصيد الجاري في السجل يتطابق الآن دائماً مع المخزون الفعلي.',
      ],
    },
  },
  {
    version: '1.10.1',
    date: '2026-06-22',
    tag: 'Improved',
    en: {
      title: 'More accurate, more honest stock records',
      points: [
        'Branch-to-branch transfers now show up in the Stock Movement Ledger, so the history of where your stock went is complete.',
        'When you add a new product with a starting count, it is now recorded as "Opening / Initial Stock" instead of a "Count Correction" — clearer in your records.',
        'If a new product is saved but its starting stock could not be set, the system now tells you plainly instead of quietly leaving it at zero.',
      ],
    },
    ar: {
      title: 'سجلات مخزون أدق وأكثر صدقاً',
      points: [
        'تظهر الآن عمليات النقل بين الفروع في سجل حركة المخزون، فيكتمل تاريخ تنقل مخزونك.',
        'عند إضافة منتج جديد برصيد بداية، يُسجَّل الآن باسم "رصيد افتتاحي" بدل "تصحيح جرد" — أوضح في سجلاتك.',
        'إذا حُفظ منتج جديد ولم يتمكن النظام من ضبط رصيد البداية، ينبهك الآن بوضوح بدل تركه صفراً بصمت.',
      ],
    },
  },
  {
    version: '1.10.0',
    date: '2026-06-22',
    tag: 'Improved',
    en: {
      title: 'A cleaner, refreshed dashboard',
      points: [
        'Your dashboard cards now share one tidy, consistent size and gently animate into place when the page opens.',
        'On smaller screens the cards reflow neatly instead of stretching, so it stays easy to read on any device.',
        'The set of cards shown is now curated centrally — more dashboard options are on the way.',
      ],
    },
    ar: {
      title: 'لوحة تحكم أنظف ومجددة',
      points: [
        'أصبحت بطاقات لوحتك بحجم واحد منسق وأنيق، وتظهر بحركة لطيفة عند فتح الصفحة.',
        'على الشاشات الأصغر تترتب البطاقات تلقائياً بدل أن تتمدد، فتبقى سهلة القراءة على أي جهاز.',
        'مجموعة البطاقات المعروضة تُدار الآن مركزياً — والمزيد من خيارات اللوحة قادم قريباً.',
      ],
    },
  },
  {
    version: '1.9.1',
    date: '2026-06-21',
    tag: 'Fixed',
    en: {
      title: 'Your dashboard now shows your real weekly revenue',
      points: [
        'The Weekly Revenue chart on your dashboard used to show sample numbers. It now shows your store\'s actual revenue for the last 7 days, day by day, in your own currency.',
        'The total and the chart line follow your real sales, so a glance tells you how the week is going.',
      ],
    },
    ar: {
      title: 'لوحتك الآن تعرض إيراداتك الأسبوعية الحقيقية',
      points: [
        'كان مخطط الإيرادات الأسبوعية في لوحتك يعرض أرقاماً تجريبية. أصبح الآن يعرض إيرادات متجرك الفعلية لآخر 7 أيام، يوماً بيوم، بعملتك الخاصة.',
        'يتبع الإجمالي وخط المخطط مبيعاتك الحقيقية، فتعرف بنظرة واحدة كيف يسير أسبوعك.',
      ],
    },
  },
  {
    version: '1.9.0',
    date: '2026-06-21',
    tag: 'New',
    en: {
      title: 'Add Pack and Strip columns to your products table',
      points: [
        'If your store sells in packs and strips, you can now add a column for each one to the products table — open Customize and tick them. Each row shows how many full packs and strips that product holds, right next to the piece count.',
        'These columns only appear when multi-unit selling is turned on. Switch it off in Settings → Capabilities and they disappear on their own, along with the pack/strip options in the Add Product window.',
        'The "In Stock" heading now lines up neatly with the rest of the table.',
      ],
    },
    ar: {
      title: 'أضف أعمدة العبوة والشريط إلى جدول منتجاتك',
      points: [
        'إذا كان متجرك يبيع بالعبوة والشريط، يمكنك الآن إضافة عمود لكل منهما إلى جدول المنتجات — افتح خيار التخصيص وفعّلها. يعرض كل صف عدد العبوات والشرائط الكاملة لذلك المنتج، بجانب عدد القطع.',
        'تظهر هذه الأعمدة فقط عند تفعيل البيع متعدد الوحدات. أوقفه من الإعدادات ← الإمكانيات وتختفي تلقائياً، مع خيارات العبوة والشريط في نافذة إضافة منتج.',
        'أصبح عنوان "في المخزون" متناسقاً الآن مع بقية الجدول.',
      ],
    },
  },
  {
    version: '1.8.0',
    date: '2026-06-21',
    tag: 'New',
    en: {
      title: 'Sort your tables by clicking a column heading',
      points: [
        'On your reports and the Stock Adjustments page, click any column heading to sort by it — click again to reverse the order, and once more to clear it. A small arrow shows you which column is sorted.',
        'The system remembers your choice, even after you refresh the page. It all happens instantly in your browser — nothing is sent to the server, so it stays fast.',
        'Tables open sorted by date, newest first, unless you choose otherwise.',
      ],
    },
    ar: {
      title: 'رتّب جداولك بالضغط على عنوان أي عمود',
      points: [
        'في تقاريرك وصفحة تسويات المخزون، اضغط على عنوان أي عمود لترتيب الجدول حسبه — اضغط مرة أخرى لعكس الترتيب، ومرة ثالثة لإلغائه. يظهر سهم صغير يوضح العمود المُرتَّب.',
        'يتذكر النظام اختيارك حتى بعد تحديث الصفحة. ويتم كل ذلك فوراً داخل متصفحك — لا يُرسَل أي شيء إلى الخادم، فيبقى سريعاً.',
        'تفتح الجداول مرتبة حسب التاريخ، الأحدث أولاً، ما لم تختر غير ذلك.',
      ],
    },
  },
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
