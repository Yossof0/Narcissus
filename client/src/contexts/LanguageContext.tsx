import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ar";

const translations = {
  en: {
    // Brand
    brandName: "NARCISSUS",
    brandTagline: "HANDMADE WITH DEVOTION",
    footerCopy: "© 2025 NARCISSUS · Handmade with devotion · Cairo, Egypt",
    craftedBy: "Crafted by",

    // Nav
    home: "HOME",
    shop: "SHOP",
    signIn: "SIGN IN",
    signOut: "Sign out",
    profile: "Profile",
    adminPanel: "Admin Panel",
    ownerPanel: "Owner Panel",
    orderHistory: "Order History",

    // Home
    discoverCollection: "DISCOVER COLLECTION",
    featuredCollection: "FEATURED COLLECTION",
    viewAllProducts: "VIEW ALL PRODUCTS",
    ourStory: "OUR STORY",
    storyP1: "Narcissus was born from a passion for handcrafted excellence. Each piece in our collection is meticulously created by skilled artisans who believe in the power of slow, intentional making.",
    storyP2: "We celebrate the beauty of imperfection, the warmth of natural materials, and the timeless elegance that comes from true craftsmanship.",
    shopNow: "SHOP NOW",
    exploreTitle: "EXPLORE HANDMADE LUXURY",
    exploreDesc: "Discover our complete collection of premium handcrafted products",

    // Products
    searchLabel: "SEARCH",
    searchPlaceholder: "Search products...",
    categoryLabel: "CATEGORY",
    allProducts: "All Products",
    sortByLabel: "SORT BY",
    newest: "Newest",
    priceLow: "Price: Low to High",
    priceHigh: "Price: High to Low",
    topRated: "Top Rated",
    noProducts: "No products found.",
    noImage: "No image",
    showing: "Showing",
    productsText: "products",
    onDiscount: "on discount",
    discountedFirst: "Place discounted products first",
    recommended: "RECOMMENDED FOR YOU",

    // Product Detail
    addToCart: "ADD TO CART",
    quantity: "QUANTITY",
    delivery: "DELIVERY",
    deliveryValue: "All over Egypt",
    craftsmanship: "CRAFTSMANSHIP",
    craftsmanshipValue: "Handmade with care",
    relatedProducts: "RELATED PRODUCTS",
    resetRating: "Reset rating",
    signInToRate: "Sign in to rate",
    editRating: "Edit rating",
    rateThis: "Rate this",
    noRatings: "No ratings",
    rateProduct: "RATE THIS PRODUCT",
    hoverToRate: "Hover and click to rate",
    submit: "Submit",
    submitting: "Submitting...",
    backToProducts: "Back to Products",

    // Cart
    cart: "CART",
    cartEmpty: "Your cart is empty",
    proceedToCheckout: "PROCEED TO CHECKOUT",

    // Checkout
    checkout: "CHECKOUT",
    deliveryNotice: "We deliver all over Egypt",
    customerInfo: "CUSTOMER INFORMATION",
    fullNameLabel: "Full Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    addressLabel: "Delivery Address",
    addressPlaceholder: "Enter your full delivery address",
    completeOrder: "COMPLETE ORDER",
    processing: "PROCESSING...",
    orderSummary: "ORDER SUMMARY",
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "Free",
    total: "Total",
    backToShopping: "Back to Shopping",

    // Order Confirmation
    orderConfirmed: "ORDER CONFIRMED",
    orderDetails: "ORDER DETAILS",
    deliveryInfo: "DELIVERY INFORMATION",
    orderStatus: "ORDER STATUS",
    continueShopping: "CONTINUE SHOPPING",
    thankYouName: "Thank you",

    // Order History
    orderHistoryTitle: "ORDER HISTORY",
    noOrdersYet: "You haven't placed any orders yet.",
    startShopping: "Start Shopping",

    // Profile
    myProfile: "MY PROFILE",
    accountSettings: "ACCOUNT",
    editProfile: "EDIT PROFILE",
    changePassword: "REQUEST PASSWORD CHANGE",
    changePasswordDesc: "Click the button below to receive a password reset link.",
    requestResetLink: "REQUEST RESET LINK",
    language: "LANGUAGE",
    saveChanges: "SAVE CHANGES",
    usernameLabel: "Username",
    passwordUpdated: "Password updated successfully!",
    passwordMismatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 6 characters.",
    profileIncomplete: "Your profile is incomplete.",
    missingFields: "Missing",
    completeProfile: "Complete your profile →",

    // Auth
    signInTitle: "SIGN IN",
    noAccount: "No account?",
    signUpLink: "Sign Up!",
    forgotPassword: "Forgot your password?",
    resetIt: "Reset it",
    backToStore: "Back to store",
    guestNote: "You don't need an account to shop.",
    guestNote2: "Yet you still need an account to access Order History, Track Your Orders, and other features.",
    browseAsGuest: "Browse & checkout as guest →",

    // Password Reset Popup
    requestPasswordChange: "REQUEST PASSWORD CHANGE",
    resetPopupDesc: "Choose how you'd like to receive your password reset link.",
    viaEmail: "Via Email",
    cancel: "Cancel",

    // Discount
    off: "OFF",
    discountEnds: "Ends",
    originalPrice: "Original",
  },
  ar: {
    brandName: "نرجس",
    brandTagline: "مصنوع بعناية وإخلاص",
    footerCopy: "© 2025 نرجس · مصنوع بإخلاص · القاهرة، مصر",
    craftedBy: "صُنع بواسطة",

    home: "الرئيسية",
    shop: "المتجر",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    profile: "الملف الشخصي",
    adminPanel: "لوحة التحكم",
    ownerPanel: "لوحة المالك",
    orderHistory: "سجل الطلبات",

    discoverCollection: "اكتشف المجموعة",
    featuredCollection: "المجموعة المميزة",
    viewAllProducts: "عرض جميع المنتجات",
    ourStory: "قصتنا",
    storyP1: "وُلدت نرجس من شغف بالتميز اليدوي. كل قطعة في مجموعتنا تُصنع بعناية فائقة من قبل حرفيين مهرة.",
    storyP2: "نحتفي بجمال النقص ودفء المواد الطبيعية والأناقة الخالدة التي تنبع من الحرفية الحقيقية.",
    shopNow: "تسوق الآن",
    exploreTitle: "استكشف الفخامة اليدوية",
    exploreDesc: "اكتشف مجموعتنا الكاملة من المنتجات اليدوية الفاخرة",

    searchLabel: "بحث",
    searchPlaceholder: "ابحث عن منتجات...",
    categoryLabel: "الفئة",
    allProducts: "جميع المنتجات",
    sortByLabel: "ترتيب حسب",
    newest: "الأحدث",
    priceLow: "السعر: من الأقل إلى الأعلى",
    priceHigh: "السعر: من الأعلى إلى الأقل",
    topRated: "الأعلى تقييماً",
    noProducts: "لا توجد منتجات.",
    noImage: "لا توجد صورة",
    showing: "عرض",
    productsText: "منتجات",
    onDiscount: "بتخفيض",
    discountedFirst: "عرض المنتجات المخفضة أولاً",
    recommended: "موصى به لك",

    addToCart: "أضف للسلة",
    quantity: "الكمية",
    delivery: "التوصيل",
    deliveryValue: "جميع أنحاء مصر",
    craftsmanship: "الحرفية",
    craftsmanshipValue: "مصنوع يدوياً بعناية",
    relatedProducts: "منتجات ذات صلة",
    resetRating: "إعادة تعيين التقييم",
    signInToRate: "سجل دخول للتقييم",
    editRating: "تعديل التقييم",
    rateThis: "قيّم هذا",
    noRatings: "لا توجد تقييمات",
    rateProduct: "قيّم هذا المنتج",
    hoverToRate: "حرك الفأرة واضغط للتقييم",
    submit: "إرسال",
    submitting: "جارٍ الإرسال...",
    backToProducts: "العودة للمنتجات",

    cart: "السلة",
    cartEmpty: "سلتك فارغة",
    proceedToCheckout: "إتمام الشراء",

    checkout: "الدفع",
    deliveryNotice: "نوصل لجميع أنحاء مصر",
    customerInfo: "معلومات العميل",
    fullNameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    phoneLabel: "رقم الهاتف",
    addressLabel: "عنوان التوصيل",
    addressPlaceholder: "أدخل عنوان التوصيل الكامل",
    completeOrder: "إتمام الطلب",
    processing: "جارٍ المعالجة...",
    orderSummary: "ملخص الطلب",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    free: "مجاني",
    total: "الإجمالي",
    backToShopping: "العودة للتسوق",

    orderConfirmed: "تم تأكيد الطلب",
    orderDetails: "تفاصيل الطلب",
    deliveryInfo: "معلومات التوصيل",
    orderStatus: "حالة الطلب",
    continueShopping: "متابعة التسوق",
    thankYouName: "شكراً",

    orderHistoryTitle: "سجل الطلبات",
    noOrdersYet: "لم تقم بأي طلبات بعد.",
    startShopping: "ابدأ التسوق",

    myProfile: "ملفي الشخصي",
    accountSettings: "الحساب",
    editProfile: "تعديل الملف",
    changePassword: "طلب تغيير كلمة المرور",
    changePasswordDesc: "اضغط الزر أدناه لاستلام رابط إعادة تعيين كلمة المرور.",
    requestResetLink: "طلب رابط الإعادة",
    language: "اللغة",
    saveChanges: "حفظ التغييرات",
    usernameLabel: "اسم المستخدم",
    passwordUpdated: "تم تحديث كلمة المرور!",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل.",
    profileIncomplete: "ملفك الشخصي غير مكتمل.",
    missingFields: "مفقود",
    completeProfile: "أكمل ملفك الشخصي ←",

    signInTitle: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    signUpLink: "سجل الآن!",
    forgotPassword: "نسيت كلمة المرور؟",
    resetIt: "استعدها",
    backToStore: "العودة للمتجر",
    guestNote: "لا تحتاج لحساب للتسوق.",
    guestNote2: "لكنك تحتاج حساباً للوصول لسجل الطلبات وتتبعها وميزات أخرى.",
    browseAsGuest: "تصفح وأتمم طلبك كضيف ←",

    requestPasswordChange: "طلب تغيير كلمة المرور",
    resetPopupDesc: "اختر كيف تريد استلام رابط إعادة التعيين.",
    viaEmail: "عبر البريد الإلكتروني",
    cancel: "إلغاء",

    off: "خصم",
    discountEnds: "ينتهي",
    originalPrice: "الأصلي",
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("narcissus-language") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("narcissus-language", lang);
  };

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", language);
  }, [language, isRTL]);

  const t = (key: TranslationKey): string =>
    translations[language][key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}