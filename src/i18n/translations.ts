export type Locale = 'ar' | 'en'

export type TranslationParams = Record<string, string | number>

type TranslationDictionary = Record<string, string>

const translations: Record<Locale, TranslationDictionary> = {
  ar: {
    'common.siteName': 'أخبار 24',
    'common.brandText': 'أخبار',
    'common.dotSeparator': '•',
    'common.page': 'صفحة',
    'nav.home': 'الرئيسية',
    'nav.latestNews': 'آخر الأخبار',
    'nav.articles': 'المقالات',
    'nav.authors': 'الكتاب',
    'nav.quickLinks': 'روابط سريعة',
    'nav.aboutSite': 'عن الموقع',
    'nav.sections': 'الأقسام',
    'header.lastUpdated': 'آخر تحديث',
    'home.latestNews': 'آخر الأخبار',
    'home.viewAll': 'عرض الكل',
    'home.categories': 'التصنيفات',
    'home.mostRead': 'الأكثر قراءة',
    'home.breaking': 'عاجل',
    'article.noImage': 'لا توجد صورة',
    'article.source': 'المصدر',
    'article.watchOriginalVideo': 'مشاهدة الفيديو الأصلي',
    'article.watchSourceVideo': 'شاهد الفيديو الأصلي',
    'article.tags': 'الوسوم',
    'article.noteLabel': 'ملاحظة',
    'article.generatedFromVideo': 'تم إنشاء هذا المقال بناءً على محتوى فيديو من قناة',
    'article.relatedArticles': 'مقالات ذات صلة',
    'article.backToHome': 'العودة للرئيسية',
    'article.backToHomeWithArrow': '← العودة للرئيسية',
    'breadcrumb.home': 'الرئيسية',
    'breadcrumb.articles': 'المقالات',
    'articles.all': 'جميع المقالات',
    'articles.byCategory': 'مقالات: {category}',
    'articles.count': '{count} مقال',
    'articles.empty': 'لا توجد مقالات بعد',
    'articles.emptyHint': 'ستظهر المقالات هنا تلقائياً بعد معالجة الفيديوهات',
    'pagination.previous': 'السابق',
    'pagination.next': 'التالي',
    'footer.description':
      'أخبار 24 - مصدرك الأول للأخبار العربية والعالمية. نقدم لك تغطية شاملة وموثوقة لأحدث الأحداث.',
    'footer.aboutDescription':
      'يعتمد أخبار 24 على تقنيات الذكاء الاصطناعي لتقديم الأخبار بشكل سريع وموثوق من مصادر موثوقة.',
    'footer.rightsReserved': '© {year} أخبار 24. جميع الحقوق محفوظة.',
    'footer.poweredBy': 'مدعوم بتقنية Payload CMS و Next.js',
    'language.arabic': 'العربية',
    'language.english': 'English',
    'language.switchLabel': 'اللغة',
    'meta.homeTitle': 'أخبار 24 - آخر الأخبار العربية والعالمية',
    'meta.homeDescription':
      'موقع أخبار 24 - مصدرك الأول للأخبار العربية والعالمية. تغطية شاملة لأحدث الأخبار السياسية والاقتصادية والرياضية والتقنية.',
    'meta.articlesTitle': 'جميع المقالات | أخبار 24',
    'meta.articlesDescription': 'تصفح جميع المقالات الإخبارية على موقع أخبار 24',
    'meta.authorsTitle': 'الكتاب | أخبار 24',
    'meta.authorsDescription': 'تصفح جميع كتاب ومحرري أخبار 24',
  },
  en: {
    'common.siteName': 'News 24',
    'common.brandText': 'News',
    'common.dotSeparator': '•',
    'common.page': 'Page',
    'nav.home': 'Home',
    'nav.latestNews': 'Latest News',
    'nav.articles': 'Articles',
    'nav.authors': 'Authors',
    'nav.quickLinks': 'Quick Links',
    'nav.aboutSite': 'About',
    'nav.sections': 'Sections',
    'header.lastUpdated': 'Last updated',
    'home.latestNews': 'Latest News',
    'home.viewAll': 'View All',
    'home.categories': 'Categories',
    'home.mostRead': 'Most Read',
    'home.breaking': 'Breaking',
    'article.noImage': 'No image',
    'article.source': 'Source',
    'article.watchOriginalVideo': 'Watch original video',
    'article.watchSourceVideo': 'Watch source video',
    'article.tags': 'Tags',
    'article.noteLabel': 'Note',
    'article.generatedFromVideo': 'This article was generated based on video content from channel',
    'article.relatedArticles': 'Related Articles',
    'article.backToHome': 'Back to home',
    'article.backToHomeWithArrow': '\u2190 Back to home',
    'breadcrumb.home': 'Home',
    'breadcrumb.articles': 'Articles',
    'articles.all': 'All Articles',
    'articles.byCategory': 'Articles: {category}',
    'articles.count': '{count} articles',
    'articles.empty': 'No articles yet',
    'articles.emptyHint': 'Articles will appear here automatically after videos are processed',
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'footer.description':
      'News 24 is your trusted source for Arabic and global news. We provide comprehensive, reliable coverage of the latest events.',
    'footer.aboutDescription':
      'News 24 uses AI technologies to deliver fast and reliable news from trusted sources.',
    'footer.rightsReserved': '© {year} News 24. All rights reserved.',
    'footer.poweredBy': 'Powered by Payload CMS and Next.js',
    'language.arabic': 'Arabic',
    'language.english': 'English',
    'language.switchLabel': 'Language',
    'meta.homeTitle': 'News 24 - Latest Arabic and Global News',
    'meta.homeDescription':
      'News 24 is your source for Arabic and global news with comprehensive coverage of politics, economy, sports, and technology.',
    'meta.articlesTitle': 'All Articles | News 24',
    'meta.articlesDescription': 'Browse all news articles on News 24',
    'meta.authorsTitle': 'Authors | News 24',
    'meta.authorsDescription': 'Browse all authors and editors of News 24',
  },
}

export const locales: Locale[] = ['ar', 'en']

export const isLocale = (value: string | undefined | null): value is Locale => {
  return value === 'ar' || value === 'en'
}

export const getDirection = (locale: Locale): 'rtl' | 'ltr' => {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export const createTranslator =
  (locale: Locale) =>
  (key: string, params?: TranslationParams): string => {
    const dictionary = translations[locale]
    const otherLocale: Locale = locale === 'ar' ? 'en' : 'ar'
    const fallbackDictionary = translations[otherLocale]
    // Try current locale first, then other locale, then key itself
    let text = dictionary[key] ?? fallbackDictionary[key] ?? key

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replaceAll(`{${paramKey}}`, String(paramValue))
      })
    }

    return text
  }
