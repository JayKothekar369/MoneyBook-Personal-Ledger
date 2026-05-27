import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const translations = {
  en: {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    banks: 'Banks',
    analytics: 'Analytics',
    aiAssistant: 'AI Assistant',
    settings: 'Settings',
    logout: 'Logout',
    deleteProfile: 'Delete Profile',
    salaryOverview: 'Salary Overview',
    toReceive: 'To Receive',
    toPay: 'To Pay',
    totalSpent: 'Total Spent',
    savedInvested: 'Saved / Invested',
    allTime: 'All-Time',
    thisMonth: 'This Month',
    recentTransactions: 'Recent Transactions',
    viewFullHistory: 'View Full History',
    searchPlaceholder: 'Search name or reason...',
    allCategories: 'All Categories',
    allAccounts: 'All Accounts',
    newestFirst: 'Newest First',
    oldestFirst: 'Oldest First',
    amountHighLow: 'Amount: High to Low',
    amountLowHigh: 'Amount: Low to High',
    lent: 'Lent',
    borrowed: 'Borrowed',
    investment: 'Investment',
    saving: 'Saving',
    salary: 'Salary',
    expenditure: 'Expenditure',
    history: 'History',
    recentlyDeleted: 'Recently Deleted',
    theme: 'Theme',
    language: 'Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    settle: 'Settle',
    downloadPdf: 'Download PDF',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    addEntry: 'Add Entry',
    titlePlaceholder: 'Title (e.g. Dinner, Rent)',
    reasonPlaceholder: 'Reason (Optional)'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    transactions: 'लेनदेन',
    banks: 'बैंक',
    analytics: 'विश्लेषण',
    aiAssistant: 'एआई सहायक',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    deleteProfile: 'प्रोफ़ाइल हटाएं',
    salaryOverview: 'वेतन अवलोकन',
    toReceive: 'प्राप्त करना है',
    toPay: 'भुगतान करना है',
    totalSpent: 'कुल खर्च',
    savedInvested: 'बचत / निवेश',
    allTime: 'सभी समय',
    thisMonth: 'इस महीने',
    recentTransactions: 'हाल के लेनदेन',
    viewFullHistory: 'पूरा इतिहास देखें',
    searchPlaceholder: 'नाम या कारण खोजें...',
    allCategories: 'सभी श्रेणियां',
    allAccounts: 'सभी खाते',
    newestFirst: 'सबसे नया पहले',
    oldestFirst: 'सबसे पुराना पहले',
    amountHighLow: 'राशि: उच्च से निम्न',
    amountLowHigh: 'राशि: निम्न से उच्च',
    lent: 'उधार दिया',
    borrowed: 'उधार लिया',
    investment: 'निवेश',
    saving: 'बचत',
    salary: 'वेतन',
    expenditure: 'खर्च',
    history: 'इतिहास',
    recentlyDeleted: 'हाल ही में हटाया गया',
    theme: 'थीम',
    language: 'भाषा',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    settle: 'निपटारा',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    deposit: 'जमा करें',
    withdraw: 'निकालें',
    addEntry: 'एंट्री जोड़ें',
    titlePlaceholder: 'शीर्षक (जैसे डिनर, किराया)',
    reasonPlaceholder: 'कारण (वैकल्पिक)'
  },
  mr: {
    dashboard: 'डॅशबोर्ड',
    transactions: 'व्यवहार',
    banks: 'बँका',
    analytics: 'विश्लेषण',
    aiAssistant: 'एआय सहाय्यक',
    settings: 'सेटिंग्ज',
    logout: 'लॉगआउट',
    deleteProfile: 'प्रोफाइल हटवा',
    salaryOverview: 'पगार विहंगावलोकन',
    toReceive: 'मिळायचे आहे',
    toPay: 'द्यायचे आहे',
    totalSpent: 'एकूण खर्च',
    savedInvested: 'बचत / गुंतवणूक',
    allTime: 'सर्व काळ',
    thisMonth: 'या महिन्यात',
    recentTransactions: 'अलीकडील व्यवहार',
    viewFullHistory: 'संपूर्ण इतिहास पहा',
    searchPlaceholder: 'नाव किंवा कारण शोधा...',
    allCategories: 'सर्व श्रेणी',
    allAccounts: 'सर्व खाती',
    newestFirst: 'नवीनतम प्रथम',
    oldestFirst: 'जुने प्रथम',
    amountHighLow: 'रक्कम: जास्त ते कमी',
    amountLowHigh: 'रक्कम: कमी ते जास्त',
    lent: 'कर्ज दिले',
    borrowed: 'कर्ज घेतले',
    investment: 'गुंतवणूक',
    saving: 'बचत',
    salary: 'पगार',
    expenditure: 'खर्च',
    history: 'इतिहास',
    recentlyDeleted: 'नुकतेच हटवले',
    theme: 'थीम',
    language: 'भाषा',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    settle: 'निपटारा',
    downloadPdf: 'पीडीएफ डाउनलोड करा',
    deposit: 'जमा करा',
    withdraw: 'काढा',
    addEntry: 'नोंद जोडा',
    titlePlaceholder: 'शीर्षक (उदा. रात्रीचे जेवण, भाडे)',
    reasonPlaceholder: 'कारण (पर्यायी)'
  },
  gu: {
    dashboard: 'ડેશબોર્ડ',
    transactions: 'વ્યવહારો',
    banks: 'બેંકો',
    analytics: 'વિશ્લેષણ',
    aiAssistant: 'એઆઈ સહાયક',
    settings: 'સેટિંગ્સ',
    logout: 'લૉગઆઉટ',
    deleteProfile: 'પ્રોફાઇલ કાઢી નાખો',
    salaryOverview: 'પગાર ઝાંખી',
    toReceive: 'મેળવવાનું બાકી',
    toPay: 'ચૂકવવાનું બાકી',
    totalSpent: 'કુલ ખર્ચ',
    savedInvested: 'બચત / રોકાણ',
    allTime: 'બધા સમય',
    thisMonth: 'આ મહિને',
    recentTransactions: 'તાજેતરના વ્યવહારો',
    viewFullHistory: 'સંપૂર્ણ ઇતિહાસ જુઓ',
    searchPlaceholder: 'નામ અથવા કારણ શોધો...',
    allCategories: 'તમામ શ્રેણીઓ',
    allAccounts: 'બધા ખાતા',
    newestFirst: 'સૌથી નવું પ્રથમ',
    oldestFirst: 'સૌથી જૂનું પ્રથમ',
    amountHighLow: 'રકમ: વધુ થી ઓછી',
    amountLowHigh: 'રકમ: ઓછી થી વધુ',
    lent: 'ધિરાણ',
    borrowed: 'ઉધાર',
    investment: 'રોકાણ',
    saving: 'બચત',
    salary: 'પગાર',
    expenditure: 'ખર્ચ',
    history: 'ઇતિહાસ',
    recentlyDeleted: 'તાજેતરમાં કાઢી નાખેલ',
    theme: 'થીમ',
    language: 'ભાષા',
    darkMode: 'ડાર્ક મોડ',
    lightMode: 'લાઇટ મોડ',
    settle: 'પતાવટ',
    downloadPdf: 'પીડીએફ ડાઉનલોડ કરો',
    deposit: 'જમા કરો',
    withdraw: 'ઉપાડો',
    addEntry: 'એન્ટ્રી ઉમેરો',
    titlePlaceholder: 'શીર્ષક (દા.ત. રાત્રિભોજન, ભાડું)',
    reasonPlaceholder: 'કારણ (વૈકલ્પિક)'
  }
};

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedTheme = localStorage.getItem('moneybook_theme');
    const savedLang = localStorage.getItem('moneybook_lang');
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('moneybook_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('moneybook_lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
};
