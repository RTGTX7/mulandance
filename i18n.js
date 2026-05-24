// Grace Dance Academy — i18n System
// Usage: data-i18n="key" on elements, or i18n('key') in JS

const translations = {
  en: {
    appName: 'Grace Dance Academy',
    nav: {
      about: 'About',
      programs: 'Programs',
      performances: 'Performances',
      events: 'Events',
      classes: 'Classes',
      media: 'Media',
      support: 'Support',
      alumni: 'Alumni',
      resources: 'Resources',
      portal: 'Portal',
    },
    buttons: {
      learnMore: 'Learn More',
      register: 'Register Now',
      donate: 'Donate',
      subscribe: 'Subscribe',
      viewAll: 'View All',
      apply: 'Apply',
      download: 'Download',
      submit: 'Submit',
      cancel: 'Cancel',
      back: 'Back',
      next: 'Next',
      close: 'Close',
      openMenu: 'Open Menu',
      closeMenu: 'Close Menu',
      send: 'Send Message',
      login: 'Login',
      logout: 'Logout',
      search: 'Search',
    },
    hero: {
      slides: [
        {
          badge: 'Grace Dance Academy',
          title: 'Where Movement Becomes Art',
          subtitle: 'Nurturing dancers from first steps to professional stages since 1985',
          cta1: 'Explore Programs',
          cta2: 'Watch Our Story',
        },
        {
          badge: '2025/2026 Season',
          title: 'Five Productions, One Unforgettable Season',
          subtitle: 'Get your tickets now for Swan Lake, The Nutcracker, and more',
          cta1: 'Get Tickets',
          cta2: 'View Season',
        },
        {
          badge: 'Summer 2026',
          title: 'Summer Camps 2026',
          subtitle: 'Two weeks of dance, fun, and creativity for ages 5-17',
          cta1: 'Register Now',
          cta2: 'Learn More',
        },
      ],
    },
    stats: {
      students: 'Students',
      years: 'Years of Excellence',
      performances: 'Annual Performances',
      faculty: 'Professional Faculty',
    },
    programs: {
      title: 'Our Programs',
      subtitle: 'Comprehensive dance training for every age and level',
      ballet: 'Ballet',
      balletDesc: 'Classical technique from early years to pre-professional training',
      contemporary: 'Contemporary',
      contemporaryDesc: 'Modern movement and improvisation techniques',
      chinese: 'Chinese Dance',
      chineseDesc: 'Traditional and folk dance heritage preservation',
      jazz: 'Jazz',
      jazzDesc: 'Commercial and theatrical jazz technique',
      hiphop: 'Hip-Hop',
      hiphopDesc: 'Urban dance styles and choreography',
      summer: 'Summer Camps',
      summerDesc: 'Intensive programs during school holidays',
    },
    events: {
      title: 'Upcoming Events',
      subtitle: 'Join us for performances, workshops, and community events',
      springShowcase: 'Spring Showcase 2026',
      springShowcaseDesc: 'Annual student performance featuring all dance programs.',
      contemporaryWorkshop: 'Contemporary Workshop',
      contemporaryWorkshopDesc: 'Open workshop with guest choreographer Maria Chen.',
      annualGala: 'Annual Gala Dinner',
      annualGalaDesc: 'Fundraising gala celebrating our 40th anniversary.',
      performance: 'Performance',
      workshop: 'Workshop',
      gala: 'Gala',
    },
    testimonials: {
      title: 'What Our Students Say',
      subtitle: 'Hear from our dance community',
      items: [
        {
          quote: "Grace Dance Academy transformed my daughter's confidence. The faculty is world-class and the community feels like family.",
          name: 'Sarah Mitchell',
          affiliation: 'Parent, RAD Level 5 Student',
        },
        {
          quote: "The contemporary program pushed me to discover movement I never knew I was capable of. The training here is truly exceptional.",
          name: 'James Park',
          affiliation: 'Pre-Professional Program, Class of 2024',
        },
        {
          quote: "Learning Chinese dance at Grace Academy connected me to my cultural heritage in the most beautiful way. Every class is a celebration.",
          name: 'Li Mei',
          affiliation: 'Chinese Dance, Advanced Level',
        },
        {
          quote: "As an adult beginner, I was nervous about starting dance. The supportive environment and patient instructors made all the difference.",
          name: 'Emma Rodriguez',
          affiliation: 'Adult Beginner Ballet',
        },
      ],
    },
    news: {
      title: 'Latest News',
      subtitle: 'Updates from the academy',
      springShowcaseNews: 'Spring Showcase 2026 Announced',
      springShowcaseNewsDesc: 'Join us for our annual student performance featuring over 200 dancers across all programs.',
      radCentre: 'New RAD Examination Centre',
      radCentreDesc: 'Grace Dance Academy is now an approved RAD examination centre for the 2026-2027 session.',
      summerCamp: 'Summer Camp Registration Open',
      summerCampDesc: 'Early bird pricing available for our 2026 summer dance camps. Register before May 31.',
      events: 'Events',
      announcements: 'Announcements',
      programs: 'Programs',
    },
    about: {
      title: 'About Us',
      subtitle: 'Nurturing dancers from first steps to professional stages since 1985',
      mission: 'Mission & Values',
      missionDesc: 'To inspire and empower individuals through the art of dance.',
      history: 'Our History',
      historyDesc: 'Founded in 1985 with a dream to share the beauty of dance.',
      leadership: 'Leadership',
      leadershipDesc: 'Meet our board, artistic staff, and faculty team.',
      edi: 'Equity, Diversity & Inclusion',
      ediDesc: 'Creating an environment where every dancer feels valued.',
      careers: 'Careers',
      careersDesc: 'Join our team.',
      contact: 'Contact Us',
      missionFull: 'To inspire and empower individuals through the art of dance, fostering creativity, discipline, and community.',
      values: {
        excellence: 'Excellence',
        excellenceDesc: 'We uphold the highest standards in dance education.',
        inclusivity: 'Inclusivity',
        inclusivityDesc: 'Dance is for everyone.',
        community: 'Community',
        communityDesc: 'Lasting connections through shared art.',
        innovation: 'Innovation',
        innovationDesc: 'New approaches honoring traditions.',
      },
      ediFull: 'We are committed to creating an environment where every dancer feels valued, respected, and empowered to reach their full potential.',
      historyFull: 'Grace Dance Academy began as a small studio with a big dream. Our founder, Principal Dancer Li Wei, envisioned a space where dancers of all ages could discover the transformative power of movement. From those humble beginnings, we have grown into one of the region\'s most respected dance institutions, training over 2,000 students annually across all dance disciplines.',
      contactTitle: 'Contact Us',
      contactSubtitle: 'We\'d love to hear from you.',
      yourName: 'Your Name',
      email: 'Email Address',
      subject: 'Subject',
      message: 'Message',
      sendMsg: 'Send Message',
      hours: 'Hours',
      weekdays: 'Monday - Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      weekdaysHours: '9:00 AM - 9:00 PM',
      saturdayHours: '9:00 AM - 6:00 PM',
      sundayHours: '10:00 AM - 4:00 PM',
      address: '123 Dance Avenue, Arts District',
      phone: '+1 (555) 123-4567',
      emailAddr: 'info@gracedanceacademy.org',
    },
    ballet: {
      title: 'Ballet',
      desc: 'Our ballet program follows the Royal Academy of Dance syllabus, providing a structured pathway from early years to pre-professional training.',
      radSyllabus: 'RAD Syllabus-Based',
      radSyllabusDesc: 'Our ballet program follows the Royal Academy of Dance syllabus, providing a structured pathway from early years to pre-professional training.',
      exams: 'Examination Preparation',
      examsDesc: 'Preparation for RAD graded examinations at all levels, from Pre-Primary to Advanced.',
      showcase: 'Annual Showcase',
      showcaseDesc: 'Annual showcase performance giving students valuable stage experience.',
      crossTraining: 'Cross-Training Included',
      crossTrainingDesc: 'Pilates, conditioning, and anatomy classes included for comprehensive training.',
      levels: 'Program Levels',
      children: 'Children (Ages 3-12)',
      childrenDesc: 'Pre-Primary through Grade 3. Focus on foundational technique, musicality, and creativity.',
      teens: 'Teens (Ages 13-17)',
      teensDesc: 'Grade 4 through Advanced. Intensive technique training with performance opportunities.',
      adults: 'Adults (Ages 18+)',
      adultsDesc: 'All adult levels from beginner to intermediate. Enjoy ballet at your own pace.',
      prePro: 'Pre-Professional',
      preProDesc: 'Pre-professional track for serious students pursuing professional dance careers.',
    },
    portal: {
      login: 'Login',
      register: 'Register',
      welcome: 'Welcome back',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      studentParent: 'Student / Parent',
      faculty: 'Faculty',
      dashboard: 'Dashboard',
      upcomingClasses: 'Upcoming Classes',
      payments: 'Payments',
      messages: 'Messages',
      announcements: 'Announcements',
    },
    support: {
      title: 'Support Us',
      subtitle: 'Your generosity helps us continue providing world-class dance education',
      supporter: 'Supporter',
      supporterDesc: 'Annual donation from $50',
      patron: 'Patron',
      patronDesc: 'Annual donation from $250',
      benefactor: 'Benefactor',
      benefactorDesc: 'Annual donation from $1,000',
      visionary: 'Visionary',
      visionaryDesc: 'Annual donation from $5,000',
      donateNow: 'Donate Now',
      secure: 'Secure payment via Stripe',
    },
    footer: {
      quickLinks: 'Quick Links',
      followUs: 'Follow Us',
      newsletter: 'Newsletter',
      newsletterText: 'Stay updated with our latest news and events.',
      newsletterPlaceholder: 'Enter your email',
      copyright: 'All rights reserved.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      accessibility: 'Accessibility',
    },
    breadcrumbs: {
      home: 'Home',
    },
    pageTitles: {
      home: 'Grace Dance Academy — Where Movement Becomes Art',
      about: 'About Us — Grace Dance Academy',
      aboutMission: 'Mission & Values — Grace Dance Academy',
      aboutHistory: 'Our History — Grace Dance Academy',
      aboutContact: 'Contact Us — Grace Dance Academy',
      programs: 'Programs — Grace Dance Academy',
      ballet: 'Ballet — Grace Dance Academy',
      contemporary: 'Contemporary — Grace Dance Academy',
      chinese: 'Chinese Dance — Grace Dance Academy',
      performances: 'Performances — Grace Dance Academy',
      events: 'Events — Grace Dance Academy',
      classes: 'Classes — Grace Dance Academy',
      support: 'Support Us — Grace Dance Academy',
      portalLogin: 'Login — Grace Dance Academy',
      portalRegister: 'Register — Grace Dance Academy',
      portalDashboard: 'Dashboard — Grace Dance Academy',
      media: 'Media — Grace Dance Academy',
      alumni: 'Alumni — Grace Dance Academy',
      resources: 'Resources — Grace Dance Academy',
    },
  },
  zh: {
    appName: '优雅舞蹈学院',
    nav: {
      about: '关于我们',
      programs: '课程',
      performances: '演出',
      events: '活动',
      classes: '课堂',
      media: '媒体',
      support: '支持我们',
      alumni: '校友',
      resources: '资源',
      portal: '门户',
    },
    buttons: {
      learnMore: '了解更多',
      register: '立即报名',
      donate: '捐款',
      subscribe: '订阅',
      viewAll: '查看全部',
      apply: '申请',
      download: '下载',
      submit: '提交',
      cancel: '取消',
      back: '返回',
      next: '下一步',
      close: '关闭',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
      send: '发送消息',
      login: '登录',
      logout: '退出登录',
      search: '搜索',
    },
    hero: {
      slides: [
        {
          badge: '优雅舞蹈学院',
          title: '让舞动成为艺术',
          subtitle: '自1985年以来，培养从第一步到专业舞台的舞者',
          cta1: '探索课程',
          cta2: '观看我们的故事',
        },
        {
          badge: '2025/2026演出季',
          title: '五部制作，一个难忘的演出季',
          subtitle: '现在获取天鹅湖、胡桃夹子等门票',
          cta1: '获取门票',
          cta2: '查看演出季',
        },
        {
          badge: '2026年夏季',
          title: '2026年夏令营',
          subtitle: '5-17岁两周的舞蹈、乐趣和创意',
          cta1: '立即报名',
          cta2: '了解更多',
        },
      ],
    },
    stats: {
      students: '学员',
      years: '年卓越历程',
      performances: '年度演出',
      faculty: '专业师资',
    },
    programs: {
      title: '我们的课程',
      subtitle: '为每个年龄和级别提供全面的舞蹈培训',
      ballet: '芭蕾',
      balletDesc: '从幼儿到准专业的古典技巧训练',
      contemporary: '现代舞',
      contemporaryDesc: '现代舞步和即兴创作技巧',
      chinese: '中国舞',
      chineseDesc: '保护和弘扬中国舞蹈遗产',
      jazz: '爵士舞',
      jazzDesc: '商业和戏剧爵士技巧',
      hiphop: '嘻哈舞',
      hiphopDesc: '城市舞蹈风格和编舞',
      summer: '夏令营',
      summerDesc: '学校假期期间的强化课程',
    },
    events: {
      title: '即将举行的活动',
      subtitle: '加入我们参加演出、工作坊和社区活动',
      springShowcase: '2026年春季展示',
      springShowcaseDesc: '年度学员表演，涵盖所有舞蹈课程。',
      contemporaryWorkshop: '现代舞工作坊',
      contemporaryWorkshopDesc: '特邀编舞家陈玛利亚的公开工作坊。',
      annualGala: '年度晚宴',
      annualGalaDesc: '庆祝我们40周年的筹款晚宴。',
      performance: '演出',
      workshop: '工作坊',
      gala: '晚宴',
    },
    testimonials: {
      title: '学员评价',
      subtitle: '听听我们的舞蹈社区',
      items: [
        {
          quote: '优雅舞蹈学院改变了我女儿的自信心。师资是世界级的，社区感觉像家人一样。',
          name: 'Sarah Mitchell',
          affiliation: '家长，RAD 5级学员',
        },
        {
          quote: '现代舞课程让我发现了自己从未意识到的舞动能力。这里的训练确实非常出色。',
          name: 'James Park',
          affiliation: '准专业课程，2024届',
        },
        {
          quote: '在优雅学院学习中国舞以最美的方式让我与文化遗产相连。每节课都是一场庆典。',
          name: '李梅',
          affiliation: '中国舞，高级班',
        },
        {
          quote: '作为成人初学者，我开始学舞时很紧张。支持性的环境和耐心的教练起到了关键作用。',
          name: 'Emma Rodriguez',
          affiliation: '成人初级芭蕾',
        },
      ],
    },
    news: {
      title: '最新资讯',
      subtitle: '学院动态',
      springShowcaseNews: '2026年春季展示公布',
      springShowcaseNewsDesc: '加入我们年度学员表演，涵盖所有课程超过200名舞者。',
      radCentre: '新RAD考试中心',
      radCentreDesc: '优雅舞蹈学院现为2026-2027学年批准RAD考试中心。',
      summerCamp: '夏令营报名开放',
      summerCampDesc: '2026年夏季舞蹈夏令营早鸟价。5月31日前报名。',
      events: '活动',
      announcements: '公告',
      programs: '课程',
    },
    about: {
      title: '关于我们',
      subtitle: '自1985年以来，培养从第一步到专业舞台的舞者',
      mission: '使命与价值观',
      missionDesc: '通过舞蹈艺术激发和赋权个人。',
      history: '我们的历史',
      historyDesc: '1985年成立，怀着分享舞蹈之美的梦想。',
      leadership: '领导层',
      leadershipDesc: '认识我们的董事会、艺术团队和师资。',
      edi: '公平、多元与包容',
      ediDesc: '创造让每位舞者都感到被重视的环境。',
      careers: '职业机会',
      careersDesc: '加入我们的团队。',
      contact: '联系我们',
      missionFull: '通过舞蹈艺术激发和赋权个人，培养创造力、纪律和社区精神。',
      values: {
        excellence: '卓越',
        excellenceDesc: '我们在舞蹈教育方面坚持最高标准。',
        inclusivity: '包容性',
        inclusivityDesc: '舞蹈属于每个人。',
        community: '社区',
        communityDesc: '通过共享艺术建立持久联系。',
        innovation: '创新',
        innovationDesc: '在尊重传统的同时拥抱新方法。',
      },
      ediFull: '我们致力于创造一个让每位舞者都感到被重视、被尊重并有权发挥全部潜力的环境。',
      historyFull: '优雅舞蹈学院始于一个小小的梦想。我们的创始人、首席舞者李伟设想了一个空间，让各个年龄段的舞者都能发现舞蹈的变革力量。从这些朴素的起步，我们已经发展成为该地区最受尊敬的舞蹈机构之一，每年培训超过2000名学员。',
      contactTitle: '联系我们',
      contactSubtitle: '我们期待收到您的来信。',
      yourName: '您的姓名',
      email: '邮箱地址',
      subject: '主题',
      message: '留言',
      sendMsg: '发送消息',
      hours: '营业时间',
      weekdays: '周一至周五',
      saturday: '周六',
      sunday: '周日',
      weekdaysHours: '上午9:00 - 晚上9:00',
      saturdayHours: '上午9:00 - 下午6:00',
      sundayHours: '上午10:00 - 下午4:00',
      address: '舞蹈大道123号，艺术区',
      phone: '+1 (555) 123-4567',
      emailAddr: 'info@gracedanceacademy.org',
    },
    ballet: {
      title: '芭蕾',
      desc: '我们的芭蕾课程遵循英国皇家舞蹈学院教学大纲，提供从幼儿到准专业的结构化学习路径。',
      radSyllabus: 'RAD教学大纲',
      radSyllabusDesc: '我们的芭蕾课程遵循英国皇家舞蹈学院教学大纲，提供从幼儿到准专业的结构化学习路径。',
      exams: '考试准备',
      examsDesc: '为RAD各级考试做准备，从预备级到高级。',
      showcase: '年度展示',
      showcaseDesc: '年度展示表演，为学员提供宝贵的舞台经验。',
      crossTraining: '包含交叉训练',
      crossTrainingDesc: '包含普拉提、体能和解剖学课程，提供全面训练。',
      levels: '课程级别',
      children: '儿童（3-12岁）',
      childrenDesc: '预备级至3级。注重基础技巧、音乐性和创造力。',
      teens: '青少年（13-17岁）',
      teensDesc: '4级至高级。高强度技巧训练，提供表演机会。',
      adults: '成人（18岁以上）',
      adultsDesc: '从初级到中级所有成人级别。按自己的节奏享受芭蕾。',
      prePro: '准专业',
      preProDesc: '为追求职业舞蹈生涯的严肃学员提供准专业轨道。',
    },
    portal: {
      login: '登录',
      register: '注册',
      welcome: '欢迎回来',
      email: '邮箱',
      password: '密码',
      forgotPassword: '忘记密码？',
      noAccount: '还没有账户？',
      haveAccount: '已有账户？',
      studentParent: '学员/家长',
      faculty: '教师',
      dashboard: '仪表板',
      upcomingClasses: '即将开始的课程',
      payments: '付款',
      messages: '消息',
      announcements: '公告',
    },
    support: {
      title: '支持我们',
      subtitle: '您的慷慨帮助我们继续提供世界级的舞蹈教育',
      supporter: '支持者',
      supporterDesc: '年度捐款50美元起',
      patron: '赞助人',
      patronDesc: '年度捐款250美元起',
      benefactor: '恩人',
      benefactorDesc: '年度捐款1000美元起',
      visionary: '远见者',
      visionaryDesc: '年度捐款5000美元起',
      donateNow: '立即捐款',
      secure: '通过Stripe安全支付',
    },
    footer: {
      quickLinks: '快速链接',
      followUs: '关注我们',
      newsletter: '通讯',
      newsletterText: '获取我们的最新动态和活动信息。',
      newsletterPlaceholder: '输入您的邮箱',
      copyright: '版权所有。',
      privacyPolicy: '隐私政策',
      termsOfService: '服务条款',
      accessibility: '无障碍',
    },
    breadcrumbs: {
      home: '首页',
    },
    pageTitles: {
      home: '优雅舞蹈学院 — 让舞动成为艺术',
      about: '关于我们 — 优雅舞蹈学院',
      aboutMission: '使命与价值观 — 优雅舞蹈学院',
      aboutHistory: '我们的历史 — 优雅舞蹈学院',
      aboutContact: '联系我们 — 优雅舞蹈学院',
      programs: '课程 — 优雅舞蹈学院',
      ballet: '芭蕾 — 优雅舞蹈学院',
      contemporary: '现代舞 — 优雅舞蹈学院',
      chinese: '中国舞 — 优雅舞蹈学院',
      performances: '演出 — 优雅舞蹈学院',
      events: '活动 — 优雅舞蹈学院',
      classes: '课堂 — 优雅舞蹈学院',
      support: '支持我们 — 优雅舞蹈学院',
      portalLogin: '登录 — 优雅舞蹈学院',
      portalRegister: '注册 — 优雅舞蹈学院',
      portalDashboard: '仪表板 — 优雅舞蹈学院',
      media: '媒体 — 优雅舞蹈学院',
      alumni: '校友 — 优雅舞蹈学院',
      resources: '资源 — 优雅舞蹈学院',
    },
  },
};

// i18n system
let currentLang = localStorage.getItem('dance-lang') || 'en';

function t(key) {
  const keys = key.split('.');
  let obj = translations[currentLang];
  for (const k of keys) {
    if (obj && obj[k] !== undefined) {
      obj = obj[k];
    } else {
      // fallback to English
      obj = translations.en;
      for (const ek of keys) {
        if (obj && obj[ek] !== undefined) obj = obj[ek];
        else return key;
      }
      return obj;
    }
  }
  return obj;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('dance-lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = value;
    } else if (el.tagName === 'OPTION') {
      el.textContent = value;
    } else {
      el.textContent = value;
    }
  });

  // Update data-i18n-html elements
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  // Update page title
  const titleKey = window.location.pathname.split('/').pop();
  const pageTitle = t(`pageTitles.${titleKey}`) || t('pageTitles.home');
  document.title = pageTitle;

  // Update lang switcher display
  document.querySelectorAll('[data-lang-display]').forEach(el => {
    el.textContent = lang === 'en' ? 'EN' : '中文';
  });

  // Update lang switcher aria-label
  document.querySelectorAll('[data-lang-switch]').forEach(el => {
    el.setAttribute('data-lang', lang === 'en' ? 'zh' : 'en');
  });

  // Re-render dynamic content
  if (window.onLanguageChange) window.onLanguageChange(lang);
}

function initLanguageSwitcher() {
  // Set initial language
  setLanguage(currentLang);

  // Bind switcher buttons
  document.querySelectorAll('[data-lang-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.getAttribute('data-lang');
      setLanguage(newLang);
    });
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
} else {
  initLanguageSwitcher();
}
