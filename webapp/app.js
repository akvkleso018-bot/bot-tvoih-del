/* ============================================================
   Бот твоих дел · Mini App
   React 18 (UMD) + htm — работает без сборки, из /static/app.js
   ============================================================ */
(function () {
  "use strict";

  var useState = React.useState;
  var useEffect = React.useEffect;
  var useRef = React.useRef;
  var useCallback = React.useCallback;
  var html = htm.bind(React.createElement);

  /* ---------------- Telegram SDK ---------------- */

  var tg = (window.Telegram && window.Telegram.WebApp) || {
    ready: function () {}, expand: function () {},
    initData: "", initDataUnsafe: {},
    onEvent: function () {}, offEvent: function () {},
    openInvoice: function () {},
    HapticFeedback: null,
    setHeaderColor: function () {}, setBackgroundColor: function () {}
  };

  try {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor("#f4f0fa");
    if (tg.setBackgroundColor) tg.setBackgroundColor("#f4f0fa");
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  } catch (e) { /* старые клиенты */ }

  var tgUser = (tg.initDataUnsafe && tg.initDataUnsafe.user) || null;

  /* ============================================================
     НАСТРОЙКИ (localStorage) + i18n RU/EN
     ============================================================ */

  var FONTS = {
    system: { css: '"SF Pro Display", "SF Pro Text", Manrope, Inter, -apple-system, "Segoe UI", system-ui, Roboto, Helvetica, Arial, sans-serif' },
    manrope: { css: 'Manrope, "Segoe UI", sans-serif' },
    inter: { css: 'Inter, "Segoe UI", sans-serif' },
    nunito: { css: 'Nunito, "Segoe UI", sans-serif' },
    georgia: { css: 'Georgia, "Times New Roman", serif' },
    mono: { css: '"JetBrains Mono", Consolas, monospace' }
  };

  var ACCENTS = {
    violet: { a: "#8b5cf6", b: "#6d28d9" },
    pink:   { a: "#ec4899", b: "#be185d" },
    blue:   { a: "#3b82f6", b: "#1d4ed8" },
    cyan:   { a: "#06b6d4", b: "#0e7490" },
    green:  { a: "#22c55e", b: "#15803d" },
    orange: { a: "#f97316", b: "#c2410c" },
    red:    { a: "#ef4444", b: "#b91c1c" },
    gold:   { a: "#d97706", b: "#92400e" }
  };

  var THEME_META = {
    light:    { header: "#f4f0fa", bg: "#f4f0fa", prev: "linear-gradient(135deg,#c7b6f5,#f3b8e3 60%,#a9dcf5)" },
    dark:     { header: "#0b0817", bg: "#0b0817", prev: "linear-gradient(135deg,#3d2a6b,#7a2f8f 60%,#1d1440)" },
    midnight: { header: "#04060f", bg: "#04060f", prev: "linear-gradient(135deg,#1c2f6e,#155e9e 60%,#101736)" },
    neon:     { header: "#050508", bg: "#050508", prev: "linear-gradient(135deg,#b06bff,#ff2d95 60%,#00f0ff)" },
    ocean:    { header: "#eef7fb", bg: "#eef7fb", prev: "linear-gradient(135deg,#7dd3fc,#22d3ee 60%,#3b82f6)" },
    sunset:   { header: "#fdf3ec", bg: "#fdf3ec", prev: "linear-gradient(135deg,#fbbf24,#f97316 60%,#ec4899)" },
    forest:   { header: "#f0f7f1", bg: "#f0f7f1", prev: "linear-gradient(135deg,#86efac,#22c55e 60%,#14b8a6)" },
    sakura:   { header: "#fdf1f5", bg: "#fdf1f5", prev: "linear-gradient(135deg,#f9a8d4,#ec4899 60%,#c4b5fd)" },
    matrix:   { header: "#030704", bg: "#030704", prev: "linear-gradient(135deg,#10b981,#065f46 60%,#030704)" },
    coffee:   { header: "#f7f2ec", bg: "#f7f2ec", prev: "linear-gradient(135deg,#d6a46f,#b45309 60%,#78553c)" }
  };

  var THEME_NAMES = {
    ru: { light: "Светлое", dark: "Тёмное", midnight: "Полночь", neon: "Неон", ocean: "Океан", sunset: "Закат", forest: "Лес", sakura: "Сакура", matrix: "Матрица", coffee: "Кофе" },
    en: { light: "Light", dark: "Dark", midnight: "Midnight", neon: "Neon", ocean: "Ocean", sunset: "Sunset", forest: "Forest", sakura: "Sakura", matrix: "Matrix", coffee: "Coffee" }
  };

  var FONT_NAMES = {
    ru: { system: "Системный", manrope: "Manrope", inter: "Inter", nunito: "Nunito (скруглённый)", georgia: "Georgia (с засечками)", mono: "JetBrains Mono" },
    en: { system: "System", manrope: "Manrope", inter: "Inter", nunito: "Nunito (rounded)", georgia: "Georgia (serif)", mono: "JetBrains Mono" }
  };

  var STR = {
    ru: {
      appName: "Бот твоих дел",
      gNight: "Доброй ночи", gMorning: "Доброе утро", gDay: "Добрый день", gEvening: "Добрый вечер",
      of: "из", doneWord: "выполнено",
      panicTitle: "Режим паники",
      panicSub1: "задача горит", panicSub2: "задачи горят", panicSub5: "задач горят", panicTail: " — день заканчивается",
      btnDone: "Сделано!", aDone: "Сделано",
      overdue: "просрочено", minsLeft: "осталось {m}",
      tomorrow: "завтра",
      emptyTitle: "На сегодня всё чисто", emptySub: "Добавь первую задачу — текстом или голосом",
      doneSection: "Выполнено", upcoming: "Предстоящие",
      addPlaceholder: "Что нужно сделать?", listening: "Слушаю…",
      voiceUnsupported: "Голосовой ввод не поддерживается на этом устройстве", voiceError: "Не удалось распознать речь",
      deadlineTitle: "Дедлайн", deadlineSummary: "Дедлайн: ", today: "сегодня",
      dpHours: "Часы", dpMinutes: "Минуты",
      deadlinePast: "Это время уже прошло — выбери другой день или время", setDeadline: "Поставить дедлайн",
      subTitle: "Подписка", subPick: "Выбери тариф и период",
      planRegular: "Обычная", planElite: "Elite",
      ben6Title: "6 задач в день", ben6Desc: "Втрое больше, чем без подписки",
      benUnlTitle: "Безлимит задач", benUnlDesc: "Добавляй столько дел, сколько нужно — никаких ограничений",
      benPanicTitle: "Режим паники", benPanicDesc: "Вечером бот будет настойчиво и эмоционально напоминать о невыполненных задачах, пока день не будет закрыт",
      benRemTitle: "Жёсткие напоминания", benRemDesc: "Уведомления за час до каждого горящего дедлайна — никаких шансов забыть",
      pWeek: "Неделя", pWeekNote: "7 дней", pMonth: "Месяц", pMonthNote: "30 дней", pYear: "Год", pYearNote: "365 дней", pForever: "Навсегда", pForeverNote: "без продлений",
      pay: "Оплатить", subNote: "Оплата через Telegram Stars. Доступ откроется сразу после оплаты.",
      activeSub: "Активна: ", foreverShort: "навсегда", until: "до",
      profileTitle: "Профиль", playerProfile: "Профиль игрока",
      memberSince: "В игре с", pointsWord1: "очко", pointsWord2: "очка", pointsWord5: "очков",
      nextLevel: "До «{l}»: {n} очков", maxLevel: "Максимальный уровень",
      stCompleted: "Выполнено", stOnTime: "В срок", stLate: "С опозданием", stMissed: "Просрочено", stActive: "Активно",
      subscription: "Подписка", friends: "Друзей", noSub: "Без подписки · 2 задачи в день",
      privacyNote: "Другие игроки видят твоё имя и статистику — без возможности написать в Telegram.",
      topTitle: "Топ недели", all: "Все", friendsTab: "Друзья",
      winnersTitle: "Победители прошлой недели", you: "Ты", friendTag: "· друг",
      youLine: "Ты: {p} место · {n} очков на этой неделе", youNoPlace: "Ты: {n} очков на этой неделе", youNoPoints: "Ты пока без очков на этой неделе",
      topEmpty: "Очков пока нет — выполни задачи в срок и попади в топ",
      myProfile: "Мой профиль",
      topNoteAll: "Топ честный: очки только за задачи, сделанные в срок (среди всех)",
      topNoteFriends: "Топ честный: очки только за задачи, сделанные в срок (среди друзей)",
      dayWord1: "день", dayWord2: "дня", dayWord5: "дней",
      addFriend: "Добавить в друзья", removeFriend: "Удалить из друзей",
      friendAdded: "Добавлен в друзья", friendRemoved: "Удалён из друзей", failed: "Не получилось",
      frListTitle: "Друзья", frIncomingTitle: "Заявки в друзья", frOutgoingTitle: "Отправленные заявки",
      btnCancelReq: "Отменить", btnAcceptReq: "Принять", btnDeclineReq: "Отклонить",
      reqSentToast: "Заявка отправлена", acceptedToast: "Теперь вы друзья",
      cancelledToast: "Заявка отменена", declinedToast: "Заявка отклонена",
      noFriendsYet: "Пока нет друзей — добавь игроков из топа",
      notFound: "Профиль не найден", close: "Закрыть",
      adminTitle: "Статистика бота",
      aUsers: "Пользователей", aPremium: "С Премиумом", aTasks: "Задач всего", aActive: "Активных сегодня", aDoneToday: "Выполнено сегодня", aStars: "Заработано Stars",
      sugsActive: "Активные предложения", noSugs: "Активных предложений нет", lastPays: "Последние покупки", noPays: "Покупок пока не было",
      accept: "Принято", decline: "Отклонить", statsError: "Не удалось загрузить статистику",
      ideaTitle: "Предложить идею", ideaSub: "Какую функцию добавить в «Бот твоих дел»?",
      ideaPlaceholder: "Твоя идея…", send: "Отправить", ideaNote: "Идея прилетит разработчику напрямую.",
      ideaSent: "Идея отправлена! Спасибо", ideaLimit: "У тебя уже 3 идеи на рассмотрении — дождись ответа", ideaFail: "Не удалось отправить идею",
      ideaTooLong: "Максимум 500 символов — сократи идею", timeFree: "Любое время",
      settings: "Настройки", lang: "Язык", theme: "Тема", accent: "Акцентный цвет", font: "Шрифт",
      fontSize: "Размер текста", glassStrength: "Стекло (блюр)",
      animations: "Анимации", haptic: "Виброотклик", timeFormat: "12-часовой формат", weekStart: "Неделя начинается с воскресенья",
      accentAuto: "Авто",
      on: "Вкл", off: "Выкл", resetSettings: "Сбросить настройки", resetDone: "Настройки сброшены",
      openInTg: "Открой через Telegram", openInTgSub: "Запусти бота командой /start и открой приложение оттуда",
      broken: "Что-то сломалось", retry: "Повторить",
      subBtn: "Подписка", admin: "Админ", idea: "Идея",
      profileBtn: "Профиль", topBtn: "Топ недели",
      payFail: "Не удалось открыть оплату", taskFail: "Не получилось добавить задачу",
      payNowBtn: "Выбрать подписку"
    },
    en: {
      appName: "Your Deals Bot",
      gNight: "Good night", gMorning: "Good morning", gDay: "Good afternoon", gEvening: "Good evening",
      of: "of", doneWord: "completed",
      panicTitle: "Panic mode",
      panicSub1: "task burning", panicSub2: "tasks burning", panicSub5: "tasks burning", panicTail: " — the day is ending",
      btnDone: "Done!", aDone: "Done",
      overdue: "overdue", minsLeft: "{m} left",
      tomorrow: "tomorrow",
      emptyTitle: "All clear for today", emptySub: "Add your first task — by text or voice",
      doneSection: "Completed", upcoming: "Upcoming",
      addPlaceholder: "What needs to be done?", listening: "Listening…",
      voiceUnsupported: "Voice input is not supported on this device", voiceError: "Could not recognize speech",
      deadlineTitle: "Deadline", deadlineSummary: "Deadline: ", today: "today",
      dpHours: "Hours", dpMinutes: "Minutes",
      deadlinePast: "That time has passed — pick another day or time", setDeadline: "Set deadline",
      subTitle: "Subscription", subPick: "Pick a plan and period",
      planRegular: "Standard", planElite: "Elite",
      ben6Title: "6 tasks a day", ben6Desc: "Triple the free limit",
      benUnlTitle: "Unlimited tasks", benUnlDesc: "Add as many deals as you need — no limits",
      benPanicTitle: "Panic mode", benPanicDesc: "In the evening the bot will persistently remind you about unfinished tasks until the day is closed",
      benRemTitle: "Hard reminders", benRemDesc: "Notifications an hour before each burning deadline — no chance to forget",
      pWeek: "Week", pWeekNote: "7 days", pMonth: "Month", pMonthNote: "30 days", pYear: "Year", pYearNote: "365 days", pForever: "Forever", pForeverNote: "no renewals",
      pay: "Pay", subNote: "Paid with Telegram Stars. Access opens right after payment.",
      activeSub: "Active: ", foreverShort: "forever", until: "until",
      profileTitle: "Profile", playerProfile: "Player profile",
      memberSince: "Playing since", pointsWord1: "point", pointsWord2: "points", pointsWord5: "points",
      nextLevel: "To “{l}”: {n} points", maxLevel: "Max level",
      stCompleted: "Completed", stOnTime: "On time", stLate: "Late", stMissed: "Missed", stActive: "Active",
      subscription: "Subscription", friends: "Friends", noSub: "No subscription · 2 tasks a day",
      privacyNote: "Other players see your name and stats — with no way to message you on Telegram.",
      topTitle: "Weekly top", all: "All", friendsTab: "Friends",
      winnersTitle: "Last week's winners", you: "You", friendTag: "· friend",
      youLine: "You: place {p} · {n} points this week", youNoPlace: "You: {n} points this week", youNoPoints: "No points this week yet",
      topEmpty: "No points yet — complete tasks on time to reach the top",
      myProfile: "My profile",
      topNoteAll: "Honest top: points only for tasks completed on time (among all)",
      topNoteFriends: "Honest top: points only for tasks completed on time (among friends)",
      dayWord1: "day", dayWord2: "days", dayWord5: "days",
      addFriend: "Add friend", removeFriend: "Remove friend",
      friendAdded: "Added to friends", friendRemoved: "Removed from friends", failed: "Something went wrong",
      frListTitle: "Friends", frIncomingTitle: "Friend requests", frOutgoingTitle: "Sent requests",
      btnCancelReq: "Cancel", btnAcceptReq: "Accept", btnDeclineReq: "Decline",
      reqSentToast: "Request sent", acceptedToast: "You are friends now",
      cancelledToast: "Request cancelled", declinedToast: "Request declined",
      noFriendsYet: "No friends yet — add players from the top",
      notFound: "Profile not found", close: "Close",
      adminTitle: "Bot stats",
      aUsers: "Users", aPremium: "Premium", aTasks: "Total tasks", aActive: "Active today", aDoneToday: "Done today", aStars: "Stars earned",
      sugsActive: "Open suggestions", noSugs: "No open suggestions", lastPays: "Recent purchases", noPays: "No purchases yet",
      accept: "Accept", decline: "Decline", statsError: "Could not load stats",
      ideaTitle: "Suggest an idea", ideaSub: "What feature should we add to Your Deals Bot?",
      ideaPlaceholder: "Your idea…", send: "Send", ideaNote: "Your idea goes straight to the developer.",
      ideaSent: "Idea sent! Thanks", ideaLimit: "You already have 3 ideas pending — wait for a reply", ideaFail: "Could not send the idea",
      ideaTooLong: "Max 500 characters — shorten your idea", timeFree: "Any time",
      settings: "Settings", lang: "Language", theme: "Theme", accent: "Accent color", font: "Font",
      fontSize: "Text size", glassStrength: "Glass blur",
      animations: "Animations", haptic: "Haptic feedback", timeFormat: "12-hour time", weekStart: "Week starts on Sunday",
      accentAuto: "Auto",
      on: "On", off: "Off", resetSettings: "Reset settings", resetDone: "Settings reset",
      openInTg: "Open via Telegram", openInTgSub: "Start the bot with /start and open the app from there",
      broken: "Something broke", retry: "Retry",
      subBtn: "Plan", admin: "Admin", idea: "Idea",
      profileBtn: "Profile", topBtn: "Weekly top",
      payFail: "Could not open payment", taskFail: "Could not add the task",
      payNowBtn: "Choose a plan"
    }
  };

  var SETTINGS_KEY = "btd_settings_v1";
  var SETTINGS_DEFAULTS = {
    theme: "light", accent: "auto", font: "system", fs: "m", lang: "ru",
    blur: "on", anim: "on", haptic: "on", time12: false, weekSun: false
  };

  function loadSettings() {
    try {
      return Object.assign({}, SETTINGS_DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
    } catch (e) {
      return Object.assign({}, SETTINGS_DEFAULTS);
    }
  }

  var S = loadSettings();

  function hexA(hex, a) {
    var n = parseInt(hex.replace("#", ""), 16);
    return "rgba(" + ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + a + ")";
  }

  /* тумблеры могут хранить и "on"/"off", и true/false — приводим к одному ответу */
  function isOn(v) {
    return v !== false && v !== "off";
  }

  function applySettings(s) {
    var r = document.documentElement;
    r.setAttribute("data-theme", s.theme);
    r.setAttribute("data-fs", s.fs);
    r.setAttribute("data-blur", "on"); /* стекло всегда включено */
    r.setAttribute("data-anim", isOn(s.anim) ? "on" : "off");
    if (s.accent !== "auto" && ACCENTS[s.accent]) {
      var a = ACCENTS[s.accent];
      r.style.setProperty("--accent", a.a);
      r.style.setProperty("--accent-2", a.b);
      r.style.setProperty("--accent-soft", hexA(a.a, .12));
      r.style.setProperty("--accent-glow", "0 0 26px " + hexA(a.a, .38));
    } else {
      ["--accent", "--accent-2", "--accent-soft", "--accent-glow"].forEach(function (p) {
        r.style.removeProperty(p);
      });
    }
    r.style.setProperty("--font", FONTS[s.font] ? FONTS[s.font].css : FONTS.system.css);
    var meta = THEME_META[s.theme] || THEME_META.light;
    try { if (tg.setHeaderColor) tg.setHeaderColor(meta.header); } catch (e) {}
    try { if (tg.setBackgroundColor) tg.setBackgroundColor(meta.bg); } catch (e) {}
  }

  function saveSettings(patch) {
    S = Object.assign({}, S, patch);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(S)); } catch (e) {}
    applySettings(S);
  }

  function t(key) {
    var d = STR[S.lang] || STR.ru;
    return d[key] || STR.ru[key] || key;
  }
  function defineProperty(key, value) {
    var o = {};
    o[key] = value;
    return o;
  }
  function tpl(key, vars) {
    var s = t(key);
    Object.keys(vars || {}).forEach(function (k) {
      s = s.replace("{" + k + "}", vars[k]);
    });
    return s;
  }
  function locale() { return S.lang === "en" ? "en-US" : "ru-RU"; }

  applySettings(S);

  /* ---- клавиатура на мобильных: поднимаем нижнюю панель над ней ---- */

  (function () {
    var kbHeight = function () {
      if (tg.viewportStableHeight && window.innerHeight - tg.viewportStableHeight > 120) {
        return window.innerHeight - tg.viewportStableHeight;
      }
      var vv = window.visualViewport;
      if (vv && window.innerHeight - vv.height > 120) return window.innerHeight - vv.height;
      return 0;
    };
    var update = function () {
      var h = kbHeight();
      document.body.classList.toggle("kb-open", h > 0);
      if (h > 0) document.documentElement.style.setProperty("--kb", h + "px");
      else document.documentElement.style.removeProperty("--kb");
    };
    try { tg.onEvent("viewportChanged", update); } catch (e) {}
    try { tg.onEvent("contentSafeAreaChanged", update); } catch (e) {}
    if (window.visualViewport) window.visualViewport.addEventListener("resize", update);
    window.addEventListener("resize", update);
  })();

  /* ---------------- API ---------------- */

  function req(url, opts) {
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var e = new Error(d.error || "HTTP " + r.status);
          e.code = d.error;
          e.status = r.status;
          throw e;
        }
        return d;
      });
    });
  }

  var api = {
    headers: function () { return { "X-Init-Data": tg.initData || "" }; },
    get: function (url) { return req(url, { headers: api.headers() }); },
    post: function (url, body) {
      return req(url, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, api.headers()),
        body: JSON.stringify(body || {})
      });
    },
    del: function (url) { return req(url, { method: "DELETE", headers: api.headers() }); }
  };

  var haptic = function (style) {
    if (!isOn(S.haptic)) return;
    try { if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred(style || "light"); } catch (e) {}
  };
  var notif = function (type) {
    if (!isOn(S.haptic)) return;
    try { if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred(type || "success"); } catch (e) {}
  };

  /* ---------------- утилиты ---------------- */

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function fmtTime(ts) {
    return new Date(ts * 1000).toLocaleTimeString(locale(), {
      hour: "2-digit", minute: "2-digit", hour12: !!S.time12
    });
  }

  function fmt12(hhmm) {
    var p = hhmm.split(":");
    var h = Number(p[0]);
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ":" + p[1] + " " + ap;
  }

  function fmtDeadline(ts) {
    var d = new Date(ts * 1000);
    var now = new Date();
    var tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    if (d.toDateString() === now.toDateString()) return fmtTime(ts);
    if (d.toDateString() === tmr.toDateString()) return t("tomorrow") + ", " + fmtTime(ts);
    return d.toLocaleDateString(locale(), { day: "numeric", month: "short" }) + ", " + fmtTime(ts);
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return t("gNight");
    if (h < 12) return t("gMorning");
    if (h < 18) return t("gDay");
    return t("gEvening");
  }

  function tasksBurning(n) {
    if (S.lang === "en") return n + " " + (n === 1 ? "task burning" : "tasks burning") + t("panicTail");
    var word = plural(n, t("panicSub1"), t("panicSub2"), t("panicSub5"));
    return n + " " + word + t("panicTail");
  }

  function daysWord(n) {
    if (S.lang === "en") return n + " " + (n === 1 ? "day" : "days");
    return n + " " + plural(n, t("dayWord1"), t("dayWord2"), t("dayWord5"));
  }

  function pointsWord(n) {
    if (S.lang === "en") return n + " " + (n === 1 ? "point" : "points");
    return n + " " + plural(n, t("pointsWord1"), t("pointsWord2"), t("pointsWord5"));
  }

  /* ---------------- иконки (SVG) ---------------- */

  var svg = {
    width: 20, height: 20, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round"
  };

  var I = {
    mic: function () { return html`<svg ...${svg}><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/></svg>`; },
    list: function () { return html`<svg ...${svg}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>`; },
    stop: function () { return html`<svg ...${svg} fill="currentColor" stroke="none"><rect x="7" y="7" width="10" height="10" rx="2.5"/></svg>`; },
    send: function () { return html`<svg ...${svg}><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>`; },
    clock: function (size) { return html`<svg ...${svg} width=${size || 14} height=${size || 14}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`; },
    check: function (size) { return html`<svg ...${svg} width=${size || 16} height=${size || 16} strokeWidth="2.6"><path d="M20 6 9 17l-5-5"/></svg>`; },
    x: function () { return html`<svg ...${svg} width="16" height="16"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>`; },
    lock: function () { return html`<svg ...${svg} width="14" height="14"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`; },
    chev: function () { return html`<svg ...${svg} width="14" height="14"><path d="M6 9l6 6 6-6"/></svg>`; },
    chevL: function () { return html`<svg ...${svg} width="18" height="18"><path d="M15 18l-6-6 6-6"/></svg>`; },
    chevR: function () { return html`<svg ...${svg} width="18" height="18"><path d="M9 18l6-6-6-6"/></svg>`; },
    bolt: function () { return html`<svg ...${svg}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>`; },
    boltFill: function (size) { return html`<svg width=${size || 20} height=${size || 20} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>`; },
    flame: function () { return html`<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c4.4 0 7.5-2.9 7.5-7.2 0-3-1.9-5.4-3.4-7-1.3-1.4-2.4-3-2.6-4.8-2.4 1.5-4.5 4-4.5 6 0 1-.6 1.5-1.3.8-.5-.5-.9-1.3-1-2.2C4.6 9.3 4.5 11.6 4.5 14.8 4.5 19.1 7.6 22 12 22z"/></svg>`; },
    star: function () { return html`<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd60a"><path d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 16.9 6.1 20.2l1.3-6.6L2.5 9l6.6-.8L12 2z"/></svg>`; },
    bulb: function () { return html`<svg ...${svg} width="14" height="14"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>`; },
    gear: function () { return html`<svg ...${svg} width="14" height="14"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`; },
    trophy: function (size) { return html`<svg ...${svg} width=${size || 16} height=${size || 16}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`; },
    user: function (size) { return html`<svg ...${svg} width=${size || 16} height=${size || 16}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`; },
    userPlus: function (size) { return html`<svg ...${svg} width=${size || 16} height=${size || 16}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>`; },
    userX: function (size) { return html`<svg ...${svg} width=${size || 16} height=${size || 16}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="8" y2="13"/><line x1="22" x2="17" y1="13" y2="8"/></svg>`; }
  };

  /* ---------------- компоненты ---------------- */

  function fmtDate(ts) {
    return new Date(ts * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  function Header(props) {
    return html`
      <header className="header">
        <div className="logo">
          <span className="logo-badge">${I.boltFill()}</span>
          <span className="logo-name">${t("appName")}</span>
        </div>
        <div className="header-right">
          ${props.tier === "elite"
            ? html`<div className="badge badge--elite">${I.boltFill(14)}<span>Elite</span></div>`
            : props.tier === "regular"
              ? html`<div className="badge badge--on">${I.boltFill(14)}<span>${t("planRegular")}</span></div>`
              : html`<button className="badge badge--lock pressable" onClick=${props.onOpenPremium}>${I.lock()}<span>${t("subBtn")}</span></button>`}
          <button className="badge badge--lock pressable gear-btn" aria-label=${t("settings")}
            onClick=${props.onOpenSettings}>${I.gear()}</button>
          ${props.isAdmin
            ? html`<button className="badge badge--admin pressable" onClick=${props.onOpenAdmin}>${I.star()}<span>${t("admin")}</span></button>`
            : html`<button className="badge badge--idea pressable" onClick=${props.onOpenIdea}>${I.bulb()}<span>${t("idea")}</span></button>`}
        </div>
      </header>`;
  }

  /* ---------------- предложения идей ---------------- */

  function IdeaSheet(props) {
    var text = useState("");
    var busy = useState(false);
    if (!props.open) return null;

    var submit = function () {
      var t = text[0].trim();
      if (t.length < 3 || busy[0]) return;
      if (t.length > 500) { props.onToast(t("ideaTooLong")); return; }
      haptic("medium");
      busy[1](true);
      api.post("/api/suggest", { text: t })
        .then(function () {
          busy[1](false);
          text[1]("");
          props.onClose();
          props.onSent();
        })
        .catch(function (e) {
          busy[1](false);
          props.onToast(e.code === "too_long" ? t("ideaTooLong") : e.code === "too_many_pending" ? t("ideaLimit") : t("ideaFail"));
        });
    };

    var over = text[0].length > 500;

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-glow"></div>
          <div className="sheet-title">${t("ideaTitle")}</div>
          <div className="sheet-sub">${t("ideaSub")}</div>
          <textarea className="glass-input" rows="4" maxLength="500"
            placeholder=${t("ideaPlaceholder")}
            value=${text[0]}
            onInput=${function (e) {
              var v = String(e.target.value || "");
              if (v.length > 500) v = v.slice(0, 500); /* жёсткий срез: paste/автозаполнение обходят maxLength */
              text[1](v);
            }}></textarea>
          <div className=${"input-cap" + (over ? " input-cap--over" : "")}>${text[0].length}/500</div>
          <button className=${"btn-gradient pressable" + (text[0].trim().length < 3 || over || busy[0] ? " btn-gradient--dis" : "")}
            disabled=${text[0].trim().length < 3 || over || busy[0]}
            onClick=${submit}>${t("send")}</button>
          <div className="sheet-note">${t("ideaNote")}</div>
        </div>
      </div>`;
  }

  /* ---------------- админ-панель ---------------- */

  function AdminSheet(props) {
    var st = useState(null);
    var ver = useState(0);
    useEffect(function () {
      if (!props.open) return;
      st[1](null);
      Promise.all([api.get("/api/admin/stats"), api.get("/api/admin/suggestions")])
        .then(function (rs) {
          st[1]({ stats: rs[0].stats, payments: rs[0].payments, suggestions: rs[1].suggestions });
        })
        .catch(function () { st[1]({ error: true }); });
    }, [props.open, ver[0]]);
    if (!props.open) return null;

    var resolve = function (sid, status) {
      haptic("light");
      api.post("/api/admin/suggestions/" + sid + "/status", { status: status })
        .then(function () { ver[1](ver[0] + 1); })
        .catch(function () {});
    };

    var body;
    if (!st[0]) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}><div className="loader">${I.boltFill(36)}</div></div>`;
    } else if (st[0].error) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}><div className="screen-sub">${t("statsError")}</div><button className="btn-ghost pressable" onClick=${props.onClose}>${t("close")}</button></div>`;
    } else {
      var d = st[0];
      var sugs = d.suggestions || [];
      body = html`
        <div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-num">${d.stats.users}</div><div className="stat-label">${t("aUsers")}</div></div>
            <div className="stat-card"><div className="stat-num stat-num--warn">${d.stats.premium}</div><div className="stat-label">${t("aPremium")}</div></div>
            <div className="stat-card"><div className="stat-num">${d.stats.tasks_total}</div><div className="stat-label">${t("aTasks")}</div></div>
            <div className="stat-card"><div className="stat-num stat-num--bad">${d.stats.tasks_open}</div><div className="stat-label">${t("aActive")}</div></div>
            <div className="stat-card"><div className="stat-num stat-num--good">${d.stats.done_today}</div><div className="stat-label">${t("aDoneToday")}</div></div>
            <div className="stat-card"><div className="stat-num stat-num--star">${d.stats.stars}</div><div className="stat-label">${t("aStars")}</div></div>
          </div>

          <div className="sub-label" style=${{ marginBottom: "10px" }}>${t("sugsActive")}${sugs.length ? " · " + sugs.length : ""}</div>
          ${sugs.length
            ? sugs.map(function (s) {
                return html`
                  <div className="sug-card" key=${s.id}>
                    <div className="sug-text">${s.text}</div>
                    <div className="sug-meta">${s.first_name || "Пользователь"}${s.username ? " · @" + s.username : ""} · ${fmtDate(s.created_at)}</div>
                    <div className="sug-actions">
                      <button className="sug-btn sug-btn--ok pressable" onClick=${function () { resolve(s.id, "done"); }}>${t("accept")}</button>
                      <button className="sug-btn sug-btn--no pressable" onClick=${function () { resolve(s.id, "declined"); }}>${t("decline")}</button>
                    </div>
                  </div>`;
              })
            : html`<div className="sub-note" style=${{ marginBottom: "14px" }}>${t("noSugs")}</div>`}

          <div className="sub-label" style=${{ marginBottom: "10px" }}>${t("lastPays")}</div>
          ${d.payments.length
            ? d.payments.map(function (p) {
                return html`
                  <div className="pay-row" key=${p.created_at + "-" + p.user_id}>
                    <div>
                      <div className="pay-user">${p.first_name || "Пользователь"}${p.username ? " · @" + p.username : ""}</div>
                      <div className="pay-date">${fmtDate(p.created_at)} · id ${p.user_id}</div>
                    </div>
                    <div className="pay-stars">+${p.stars} ${I.star()}</div>
                  </div>`;
              })
            : html`<div className="sub-note">${t("noPays")}</div>`}
        </div>`;
    }

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-title">${t("adminTitle")}</div>
          ${body}
        </div>
      </div>`;
  }

  /* ---------------- профиль и топ ---------------- */

  function NavRow(props) {
    return html`
      <div className="nav-row">
        <button className="nav-btn pressable" onClick=${function () { haptic("light"); props.onProfile(); }}>
          ${I.user()}<span>${t("profileBtn")}</span>
          ${props.reqCount > 0 ? html`<span className="nav-badge">${props.reqCount}</span>` : null}
        </button>
        <button className="nav-btn pressable" onClick=${function () { haptic("light"); props.onTop(); }}>
          ${I.trophy()}<span>${t("topBtn")}</span>
        </button>
      </div>`;
  }

  function FriendsBlock(props) {
    var st = useState(null);
    useEffect(function () {
      if (!props.open) return;
      st[1](null);
      api.get("/api/friends")
        .then(function (d) { st[1](d); })
        .catch(function () { st[1]({ error: true }); });
    }, [props.open, props.sVer]);
    if (!props.open) return null;

    var act = function (call, toast) {
      haptic("light");
      call().then(function () { props.onToast(toast); props.onChanged(); load2(); }).catch(function () { props.onToast(t("failed")); });
    };
    var load2 = function () {
      api.get("/api/friends").then(function (d) { st[1](d); }).catch(function () {});
    };

    var d = st[0];
    if (!d) return html`<div className="screen" style=${{ minHeight: "60px" }}><div className="loader">${I.boltFill(24)}</div></div>`;
    if (d.error) return null;

    var incoming = d.incoming || [];
    var outgoing = d.outgoing || [];
    var friends = d.friends || [];

    return html`<div className="set-section">
      <div className="set-label">${t("frListTitle")}${friends.length ? " · " + friends.length : ""}</div>

      ${incoming.length ? html`<div className="set-label" style=${{ color: "var(--accent-2)" }}>${t("frIncomingTitle")}</div>` : null}
      ${incoming.map(function (f) {
        return html`<div className="fr-row" key=${f.public_id}>
          <span className="fr-name">${f.first_name || "Игрок"}</span>
          <div className="fr-actions">
            <button className="sug-btn sug-btn--ok pressable"
              onClick=${function () { act(function () { return api.post("/api/friends/" + f.public_id + "/accept", {}); }, t("acceptedToast")); }}>${t("btnAcceptReq")}</button>
            <button className="sug-btn sug-btn--no pressable"
              onClick=${function () { act(function () { return api.post("/api/friends/" + f.public_id + "/decline", {}); }, t("declinedToast")); }}>${t("btnDeclineReq")}</button>
          </div>
        </div>`;
      })}

      ${outgoing.length ? html`<div className="set-label">${t("frOutgoingTitle")}</div>` : null}
      ${outgoing.map(function (f) {
        return html`<div className="fr-row" key=${f.public_id}>
          <span className="fr-name">${f.first_name || "Игрок"}</span>
          <button className="sug-btn sug-btn--no pressable"
            onClick=${function () { act(function () { return api.del("/api/friends/" + f.public_id); }, t("cancelledToast")); }}>${t("btnCancelReq")}</button>
        </div>`;
      })}

      ${friends.length ? friends.map(function (f) {
        return html`<button className="fr-row fr-row--link pressable" key=${f.public_id}
          onClick=${function () { haptic("light"); props.onOpenProfile(f.public_id); }}>
          <span className="fr-name">${f.first_name || "Игрок"}</span>
          <span className="fr-chev">${I.chevR()}</span>
        </button>`;
      }) : (!incoming.length && !outgoing.length
        ? html`<div className="sub-note">${t("noFriendsYet")}</div>`
        : null)}
    </div>`;
  }

  function StatGrid(props) {
    var s = props.stats;
    var items = props.compact ? [
      { num: s.on_time, label: "В срок", cls: "stat-num--good" },
      { num: s.late, label: "С опозданием", cls: "stat-num--warn" },
      { num: s.missed, label: "Просрочено", cls: "stat-num--bad" },
      { num: s.active, label: "Активно", cls: "" }
    ] : [
      { num: s.completed, label: "Выполнено", cls: "" },
      { num: s.on_time, label: "В срок", cls: "stat-num--good" },
      { num: s.late, label: "С опозданием", cls: "stat-num--warn" },
      { num: s.missed, label: "Просрочено", cls: "stat-num--bad" }
    ];
    return html`<div className="stats-grid">
      ${items.map(function (it) {
        return html`<div className="stat-card" key=${it.label}>
          <div className=${"stat-num " + it.cls}>${it.num}</div>
          <div className="stat-label">${it.label}</div>
        </div>`;
      })}
    </div>`;
  }

  function LevelBlock(props) {
    var pct = props.next
      ? Math.min(100, Math.max(0, Math.round(((props.rep - props.min) / (props.next - props.min)) * 100)))
      : 100;
    return html`<div className="level-block">
      <div className="level-line">
        <span className="level-name">${props.level}</span>
        <span className="level-rep">${props.rep} очков</span>
      </div>
      <div className="progress">
        <div className="progress-bar" style=${{ width: pct + "%" }}></div>
      </div>
      ${props.next
        ? html`<div className="level-next">${tpl("nextLevel", { l: props.nextLevel, n: props.next - props.rep })}</div>`
        : html`<div className="level-next">${t("maxLevel")}</div>`}
    </div>`;
  }

  function ProfileSheet(props) {
    var st = useState(null);
    useEffect(function () {
      if (!props.open) return;
      st[1](null);
      api.get("/api/profile")
        .then(function (d) { st[1](d); })
        .catch(function () { st[1]({ error: true }); });
    }, [props.open, props.sVer]);
    if (!props.open) return null;

    var body;
    if (!st[0]) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}><div className="loader">${I.boltFill(36)}</div></div>`;
    } else if (st[0].error) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}>
        <div className="screen-sub">${t("failed")}</div>
        <button className="btn-ghost pressable" onClick=${props.onClose}>${t("close")}</button>
      </div>`;
    } else {
      var d = st[0];
      var tierLine = d.tier === "elite"
        ? "Elite · " + fmtUntil(d.premium_until)
        : d.tier === "regular"
          ? t("planRegular") + " · " + fmtUntil(d.premium_until)
          : t("noSub");
      body = html`<div>
        <div className="profile-head">
          <div className="profile-avatar">${(d.name || "И")[0].toUpperCase()}</div>
          <div>
            <div className="profile-name">${d.name}</div>
            <div className="profile-since">${t("memberSince")} ${fmtDate(d.member_since || Math.floor(Date.now() / 1000))}</div>
          </div>
        </div>
        <${LevelBlock} level=${d.level} rep=${d.rep}
          next=${d.next_rep} nextLevel=${d.next_level} />
        <${StatGrid} stats=${d.stats} />
        <div className="profile-rows">
          <div className="profile-row"><span>${t("subscription")}</span><b>${tierLine}</b></div>
        </div>
        <${FriendsBlock} open=${props.open} sVer=${props.sVer}
          onToast=${props.onToast}
          onChanged=${props.onChanged}
          onOpenProfile=${props.onOpenProfile} />
        <div className="profile-note">${t("privacyNote")}</div>
      </div>`;
    }

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-title">${t("profileTitle")}</div>
          ${body}
        </div>
      </div>`;
  }

  var MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

  function LbRow(props) {
    var r = props.row;
    return html`
      <button className="lb-row pressable" onClick=${function () { haptic("light"); props.onOpen(r.public_id); }}>
        <span className="lb-place ${r.place <= 3 ? "lb-place--top" : ""}">${r.place <= 3 ? MEDALS[r.place] : r.place}</span>
        <span className="lb-name">
          ${r.is_me ? html`<b>${t("you")}</b>` : r.name}
          ${r.is_friend && !r.is_me ? html`<span className="lb-friend">${t("friendTag")}</span>` : null}
          <span className="lb-sub">${r.on_time} ${t("stOnTime").toLowerCase()} · ${r.late} ${t("stLate").toLowerCase()}</span>
        </span>
        <span className="lb-points">${r.points}<span className="lb-star">${I.star()}</span></span>
      </button>`;
  }

  function TopSheet(props) {
    var scope = useState("all");
    var data = useState(null);

    var load = function (sc) {
      data[1](null);
      api.get("/api/leaderboard?scope=" + sc)
        .then(function (d) { data[1](d); })
        .catch(function () { data[1]({ error: true }); });
    };
    useEffect(function () {
      if (props.open) load(scope[0]);
    }, [props.open, scope[0]]);
    if (!props.open) return null;

    var d = data[0];
    var body;
    if (!d) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}><div className="loader">${I.boltFill(36)}</div></div>`;
    } else if (d.error) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}>
        <div className="screen-sub">Не удалось загрузить топ</div>
        <button className="btn-ghost pressable" onClick=${props.onClose}>Закрыть</button>
      </div>`;
    } else {
      var rows = d.rows || [];
      body = html`<div>
        <div className="sub-tabs">
          <button className=${"sub-tab pressable" + (scope[0] === "all" ? " sub-tab--on" : "")}
            onClick=${function () { scope[1]("all"); }}>${t("all")}</button>
          <button className=${"sub-tab pressable" + (scope[0] === "friends" ? " sub-tab--on" : "")}
            onClick=${function () { scope[1]("friends"); }}>${t("friendsTab")}</button>
        </div>

        ${(d.winners && d.winners.length) ? html`
          <div className="winners">
            <div className="winners-title">${t("winnersTitle")}</div>
            ${d.winners.map(function (w) {
              return html`<button className="winner-row pressable" key=${w.public_id + w.place}
                onClick=${function () { haptic("light"); props.onOpenProfile(w.public_id); }}>
                <span>${MEDALS[w.place] || w.place} <b>${w.name}</b></span>
                <span className="winner-prize">+${daysWord(w.days)}</span>
              </button>`;
            })}
          </div>` : null}

        ${d.me ? html`<div className="lb-me">
          ${d.me.place ? tpl("youLine", { p: d.me.place, n: d.me.points }) : tpl("youNoPlace", { n: d.me.points })}
        </div>` : html`<div className="lb-me">${t("youNoPoints")}</div>`}

        <div className="list">
          ${rows.length
            ? rows.map(function (r) {
                return html`<${LbRow} key=${r.public_id} row=${r} onOpen=${props.onOpenProfile} />`;
              })
            : html`<div className="sub-note">${t("topEmpty")}</div>`}
        </div>

        <button className="btn-ghost pressable lb-my" onClick=${props.onOpenMyProfile}>
          ${I.user()}<span>${t("myProfile")}</span>
        </button>
        <div className="profile-note">${scope[0] === "friends" ? t("topNoteFriends") : t("topNoteAll")}</div>
      </div>`;
    }

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-title">${t("topTitle")}</div>
          ${body}
        </div>
      </div>`;
  }

  function PublicProfileSheet(props) {
    var st = useState(null);
    var busy = useState(false);

    var load = function () {
      st[1](null);
      api.get("/api/profile/" + props.pid)
        .then(function (d) { st[1](d); })
        .catch(function () { st[1]({ error: true }); });
    };
    useEffect(function () {
      if (props.pid) load();
    }, [props.pid]);
    if (!props.pid) return null;

    var reload = function () {
      load();
      if (props.onChanged) props.onChanged();
    };

    var sendReq = function () {
      if (busy[0] || !st[0] || st[0].error) return;
      haptic("medium");
      busy[1](true);
      api.post("/api/friends/" + props.pid, {})
        .then(function (res) {
          busy[1](false);
          reload();
          props.onToast(res.status === "accepted" ? t("acceptedToast") : t("reqSentToast"));
        })
        .catch(function () { busy[1](false); props.onToast(t("failed")); });
    };

    var cancelReq = function () {
      if (busy[0] || !st[0] || st[0].error) return;
      haptic("light");
      busy[1](true);
      var wasIncoming = st[0].rel === "incoming";
      api.del("/api/friends/" + props.pid)
        .then(function () {
          busy[1](false);
          reload();
          props.onToast(wasIncoming ? t("declinedToast") : t("cancelledToast"));
        })
        .catch(function () { busy[1](false); props.onToast(t("failed")); });
    };

    var acceptReq = function () {
      if (busy[0] || !st[0] || st[0].error) return;
      haptic("medium");
      busy[1](true);
      api.post("/api/friends/" + props.pid + "/accept", {})
        .then(function () { busy[1](false); reload(); props.onToast(t("acceptedToast")); })
        .catch(function () { busy[1](false); props.onToast(t("failed")); });
    };

    var declineReq = function () {
      if (busy[0] || !st[0] || st[0].error) return;
      haptic("light");
      busy[1](true);
      api.post("/api/friends/" + props.pid + "/decline", {})
        .then(function () { busy[1](false); reload(); props.onToast(t("declinedToast")); })
        .catch(function () { busy[1](false); props.onToast(t("failed")); });
    };

    var removeFriend = function () {
      if (busy[0] || !st[0] || st[0].error) return;
      haptic("rigid");
      busy[1](true);
      api.del("/api/friends/" + props.pid)
        .then(function () { busy[1](false); reload(); props.onToast(t("friendRemoved")); })
        .catch(function () { busy[1](false); props.onToast(t("failed")); });
    };

    var body;
    if (!st[0]) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}><div className="loader">${I.boltFill(36)}</div></div>`;
    } else if (st[0].error) {
      body = html`<div className="screen" style=${{ minHeight: "40vh" }}>
        <div className="screen-sub">${t("notFound")}</div>
        <button className="btn-ghost pressable" onClick=${props.onClose}>${t("close")}</button>
      </div>`;
    } else {
      var d = st[0];
      var tierLine = d.tier === "elite" ? "Elite" : d.tier === "regular" ? t("planRegular") : t("noSub");
      body = html`<div>
        <div className="profile-head">
          <div className="profile-avatar">${(d.name || "И")[0].toUpperCase()}</div>
          <div>
            <div className="profile-name">${d.name}</div>
            <div className="profile-since">${t("memberSince")} ${fmtDate(d.member_since || Math.floor(Date.now() / 1000))}</div>
          </div>
        </div>
        <${LevelBlock} level=${d.level} rep=${d.rep}
          next=${d.next_rep} nextLevel=${d.next_level} />
        <${StatGrid} stats=${d.stats} />
        <div className="profile-rows">
          <div className="profile-row"><span>${t("subscription")}</span><b>${tierLine}</b></div>
          <div className="profile-row"><span>${t("friends")}</span><b>${d.friends_count}</b></div>
        </div>
        ${d.rel === "incoming" ? html`
          <button className=${"btn-gradient pressable" + (busy[0] ? " btn-gradient--dis" : "")} onClick=${acceptReq}>
            ${I.userPlus()}<span>${t("btnAcceptReq")}</span>
          </button>
          <button className="btn-ghost pressable" style=${{ width: "100%", marginTop: "8px" }} onClick=${declineReq}>
            ${t("btnDeclineReq")}
          </button>`
        : d.rel === "outgoing" ? html`
          <button className=${"btn-ghost pressable" + (busy[0] ? " btn-gradient--dis" : "")} style=${{ width: "100%" }} onClick=${cancelReq}>
            ${I.userX()}<span>${t("btnCancelReq")}</span>
          </button>`
        : d.rel === "friends" ? html`
          <button className=${"btn-gradient pressable" + (busy[0] ? " btn-gradient--dis" : "")} onClick=${removeFriend}>
            ${I.userX()}<span>${t("removeFriend")}</span>
          </button>`
        : html`
          <button className=${"btn-gradient pressable" + (busy[0] ? " btn-gradient--dis" : "")} onClick=${sendReq}>
            ${I.userPlus()}<span>${t("addFriend")}</span>
          </button>`}
        <div className="profile-note">${t("privacyNote")}</div>
      </div>`;
    }

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-title">${t("playerProfile")}</div>
          ${body}
        </div>
      </div>`;
  }

  function Toggle(props) {
    return html`<span className=${"tgl" + (props.on ? " tgl--on" : "")}></span>`;
  }

  function SettingsSheet(props) {
    var ls = useState(null);

    useEffect(function () {
      if (props.open) ls[1](Object.assign({}, S));
    }, [props.open]);

    if (!props.open) return null;
    var cur = ls[0] || S;
    var ch = function (patch) {
      haptic("light");
      var next = Object.assign({}, cur, patch);
      ls[1](next);
      props.onChange(patch);
    };
    var tog = function (key, now) {
      haptic("light");
      var next = Object.assign({}, cur, defineProperty(key, !now));
      ls[1](next);
      props.onChange(defineProperty(key, !now));
    };
    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-title">${t("settings")}</div>

          <div className="set-section">
            <div className="set-label">${t("lang")}</div>
            <div className="seg">
              <button type="button" className=${"seg-btn pressable" + (cur.lang === "ru" ? " seg-btn--on" : "")} onClick=${function () { ch({ lang: "ru" }); }}>Русский</button>
              <button type="button" className=${"seg-btn pressable" + (cur.lang === "en" ? " seg-btn--on" : "")} onClick=${function () { ch({ lang: "en" }); }}>English</button>
            </div>
          </div>

          <div className="set-section">
            <div className="set-label">${t("theme")}</div>
            <div className="theme-grid">
              ${Object.keys(THEME_META).map(function (id) {
                return html`<button type="button" key=${id}
                  className=${"theme-card pressable" + (cur.theme === id ? " theme-card--on" : "")}
                  onClick=${function () { ch({ theme: id }); }}>
                  <div className="theme-prev" style=${{ background: THEME_META[id].prev }}></div>
                  <div className="theme-name">${THEME_NAMES[cur.lang][id]}</div>
                </button>`;
              })}
            </div>
          </div>

          <div className="set-section">
            <div className="set-label">${t("accent")}</div>
            <div className="dot-row">
              <button type="button" key="auto"
                className=${"accent-dot accent-dot--auto pressable" + (cur.accent === "auto" ? " accent-dot--on" : "")}
                style=${{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                onClick=${function () { ch({ accent: "auto" }); }}>A</button>
              ${Object.keys(ACCENTS).map(function (id) {
                var a = ACCENTS[id];
                return html`<button type="button" key=${id}
                  className=${"accent-dot pressable" + (cur.accent === id ? " accent-dot--on" : "")}
                  style=${{ background: "linear-gradient(135deg, " + a.a + ", " + a.b + ")" }}
                  onClick=${function () { ch({ accent: id }); }}></button>`;
              })}
            </div>
          </div>

          <div className="set-section">
            <div className="set-label">${t("font")}</div>
            ${Object.keys(FONTS).map(function (id) {
              return html`<button type="button" key=${id}
                className=${"font-row pressable" + (cur.font === id ? " font-row--on" : "")}
                style=${{ fontFamily: FONTS[id].css }}
                onClick=${function () { ch({ font: id }); }}>
                <span>${FONT_NAMES[cur.lang][id]}</span>
                ${cur.font === id ? I.check() : null}
              </button>`;
            })}
          </div>

          <div className="set-section">
            <div className="set-label">${t("fontSize")}</div>
            <div className="seg">
              <button type="button" className=${"seg-btn pressable" + (cur.fs === "s" ? " seg-btn--on" : "")} onClick=${function () { ch({ fs: "s" }); }}>A−</button>
              <button type="button" className=${"seg-btn pressable" + (cur.fs === "m" ? " seg-btn--on" : "")} onClick=${function () { ch({ fs: "m" }); }}>A</button>
              <button type="button" className=${"seg-btn pressable" + (cur.fs === "l" ? " seg-btn--on" : "")} onClick=${function () { ch({ fs: "l" }); }}>A+</button>
            </div>
          </div>

          <div className="set-section">
            <button type="button" className="set-row pressable" onClick=${function () { tog("anim", isOn(cur.anim)); }}>
              <span>${t("animations")}</span>
              <${Toggle} on=${isOn(cur.anim)} />
            </button>
            <button type="button" className="set-row pressable" onClick=${function () { tog("haptic", isOn(cur.haptic)); }}>
              <span>${t("haptic")}</span>
              <${Toggle} on=${isOn(cur.haptic)} />
            </button>
            <button type="button" className="set-row pressable" onClick=${function () { tog("time12", !!cur.time12); }}>
              <span>${t("timeFormat")}</span>
              <${Toggle} on=${!!cur.time12} />
            </button>
            <button type="button" className="set-row pressable" onClick=${function () { tog("weekSun", !!cur.weekSun); }}>
              <span>${t("weekStart")}</span>
              <${Toggle} on=${!!cur.weekSun} />
            </button>
          </div>

          <button type="button" className="btn-ghost pressable" style=${{ width: "100%", marginTop: "12px" }}
            onClick=${function () { haptic("rigid"); props.onReset(); }}>${t("resetSettings")}</button>
          <div className="sheet-note">localStorage · v1</div>
        </div>
      </div>`;
  }

  function Hero(props) {
    return html`
      <section className="hero">
        <div className="hero-greet">${greeting()}${props.name ? ", " + props.name : ""}</div>
        <div className="hero-date">${new Date().toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" })}</div>
        <div className="progress"><div className="progress-bar" style=${{ width: props.pct + "%" }}></div></div>
        <div className="progress-cap">${props.done} ${t("of")} ${props.total} ${t("doneWord")} · ${props.pct}%</div>
      </section>`;
  }

  function PanicBanner(props) {
    return html`
      <div className="panic">
        <div className="panic-flame">${I.flame()}</div>
        <div>
          <div className="panic-title">${t("panicTitle")}</div>
          <div className="panic-sub">${tasksBurning(props.count)}</div>
        </div>
      </div>`;
  }

  function TaskCard(props) {
    var task = props.task;
    var tick = useState(0);
    useEffect(function () {
      var t = setInterval(function () { tick[1](function (x) { return x + 1; }); }, 30000);
      return function () { clearInterval(t); };
    }, []);

    var done = !!task.done;
    var minsLeft = Math.round((task.deadline * 1000 - Date.now()) / 60000);
    var urgent = !done && minsLeft > 0 && minsLeft <= 60;
    var overdue = !done && minsLeft <= 0;

    return html`
      <div className=${"task glass" + (done ? " task--done" : "") + (urgent ? " task--urgent" : "")}>
        <button className=${"check pressable" + (done ? " check--on" : "")}
          aria-label=${t("aDone")} onClick=${function () { if (!done) props.onDone(task.id); }}>
          ${done ? I.check() : null}
        </button>
        <div className="task-body">
          <div className="task-text">${task.text}</div>
          <div className="task-meta">
            <span className=${"chip" + (urgent ? " chip--red" : "") + (overdue ? " chip--over" : "")}>
              ${I.clock()}
              <span>${
                overdue
                  ? t("overdue") + " · " + fmtDeadline(task.deadline)
                  : urgent
                    ? tpl("minsLeft", { m: minsLeft })
                    : fmtDeadline(task.deadline)
              }</span>
            </span>
          </div>
        </div>
        ${done ? null : html`
          <div className="task-actions">
            <button className="btn-done pressable" onClick=${function () { props.onDone(task.id); }}>${t("btnDone")}</button>
            <button className="del pressable" aria-label="Удалить" onClick=${function () { props.onDel(task.id); }}>${I.x()}</button>
          </div>`}
      </div>`;
  }

  function EmptyState() {
    return html`
      <div className="empty">
        <div className="empty-ring">${I.check(30)}</div>
        <div className="empty-title">${t("emptyTitle")}</div>
        <div className="empty-sub">${t("emptySub")}</div>
      </div>`;
  }

  function DoneSection(props) {
    var open = useState(false);
    if (!props.items.length) return null;
    var shown = open[0] ? props.items : props.items.slice(0, 2);
    return html`
      <div className="section">
        <button className="section-title pressable" onClick=${function () { open[1](!open[0]); }}>
          ${t("doneSection")} · ${props.items.length}
          <span style=${{ transform: open[0] ? "rotate(180deg)" : "none", transition: "transform .25s" }}>${I.chev()}</span>
        </button>
        <div className="list">
          ${shown.map(function (t2) {
            return html`<${TaskCard} key=${t2.id} task=${t2} onDone=${function () {}} onDel=${function () {}} />`;
          })}
        </div>
      </div>`;
  }

  function AddBar(props) {
    var text = useState("");
    var dl = useState(defaultDeadline());
    var picker = useState(false);
    var listening = useState(false);
    var busy = useState(false);
    var recRef = useRef(null);

    var submit = function () {
      var t = text[0].trim();
      if (!t || busy[0]) return;
      if (props.locked) { notif("warning"); props.onLocked(); return; }
      busy[1](true);
      props.onAdd(t, dl[0]).then(function (okk) {
        busy[1](false);
        if (okk) { text[1](""); dl[1](defaultDeadline()); }
      });
    };

    var toggleMic = function () {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { props.onToast(t("voiceUnsupported")); return; }
      if (listening[0]) { try { recRef.current.stop(); } catch (e) {} return; }
      haptic("medium");
      var r = new SR();
      r.lang = S.lang === "en" ? "en-US" : "ru-RU";
      r.interimResults = true;
      r.continuous = false;
      r.onresult = function (e) {
        var s = "";
        for (var i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
        text[1](s.trim());
      };
      r.onend = function () { listening[1](false); };
      r.onerror = function () { listening[1](false); props.onToast(t("voiceError")); };
      recRef.current = r;
      try { r.start(); listening[1](true); } catch (e) { listening[1](false); }
    };

    return html`
      <div className="addbar glass">
        <button className=${"round mic pressable" + (listening[0] ? " mic--on" : "")}
          aria-label="Голосовой ввод" onClick=${toggleMic}>
          ${listening[0] ? I.stop() : I.mic()}
        </button>
        <input className="add-input" type="text"
          placeholder=${listening[0] ? t("listening") : t("addPlaceholder")}
          value=${text[0]}
          onInput=${function (e) { text[1](e.target.value); }}
          onKeyDown=${function (e) { if (e.key === "Enter") submit(); }} />
        <button className="chip-dl pressable" aria-label="Дедлайн"
          onClick=${function () { haptic("light"); picker[1](true); }}>
          ${I.clock(14)}<span>${fmtChip(dl[0])}</span>
        </button>
        <button className=${"round send" + (props.locked ? " send--lock" : "")}
          aria-label="Добавить" onClick=${submit}>
          ${props.locked ? I.lock() : I.send()}
        </button>
        <${DatePickerSheet} open=${picker[0]} ts=${dl[0]}
          onClose=${function () { picker[1](false); }}
          onPick=${function (ts) { notif("success"); dl[1](ts); }} />
      </div>`;
  }

  var PLANS = {
    regular: {
      benefits: [
        { icon: "list", title: "ben6Title", desc: "ben6Desc" },
        { icon: "flame", title: "benPanicTitle", desc: "benPanicDesc" },
        { icon: "clock", title: "benRemTitle", desc: "benRemDesc" }
      ],
      prices: { week: 150, month: 400, year: 1300, forever: 3000 }
    },
    elite: {
      benefits: [
        { icon: "boltFill", title: "benUnlTitle", desc: "benUnlDesc" },
        { icon: "flame", title: "benPanicTitle", desc: "benPanicDesc" },
        { icon: "clock", title: "benRemTitle", desc: "benRemDesc" }
      ],
      prices: { week: 350, month: 800, year: 2500, forever: 4500 }
    }
  };

  var PERIODS = [
    { id: "week", label: "pWeek", note: "pWeekNote" },
    { id: "month", label: "pMonth", note: "pMonthNote" },
    { id: "year", label: "pYear", note: "pYearNote" },
    { id: "forever", label: "pForever", note: "pForeverNote" }
  ];

  function fmtUntil(ts) {
    if (ts >= 4102444800) return t("foreverShort");
    return t("until") + " " + fmtDate(ts);
  }

  function SubscriptionSheet(props) {
    var tier = useState("regular");
    var period = useState("month");

    useEffect(function () {
      if (!props.open) return;
      tier[1](props.tier === "elite" ? "elite" : "regular");
      period[1]("month");
    }, [props.open]);

    if (!props.open) return null;
    var p = PLANS[tier[0]] || PLANS.regular;
    var price = p.prices[period[0]];

    var statusLine = null;
    if (props.tier === "regular" || props.tier === "elite") {
      var planName = props.tier === "elite" ? "Elite" : t("planRegular");
      statusLine = html`<div className="sub-status">
        ${t("activeSub")}<b>${planName}</b> · ${fmtUntil(props.premiumUntil)}
      </div>`;
    }

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-glow"></div>
          <div className="sheet-title">${t("subTitle")}</div>
          <div className="sheet-sub">${t("subPick")}</div>

          <div className="sub-tabs">
            ${["regular", "elite"].map(function (tn) {
              return html`<button key=${tn}
                className=${"sub-tab pressable" + (tier[0] === tn ? " sub-tab--on" : "") + (tn === "elite" ? " sub-tab--elite" : "")}
                onClick=${function () { haptic("light"); tier[1](tn); }}>
                ${tn === "elite" ? "Elite" : t("planRegular")}
              </button>`;
            })}
          </div>

          ${statusLine}

          <div className="benefits">
            ${p.benefits.map(function (b) {
              return html`
                <div className="benefit" key=${b.title}>
                  <div className="benefit-icon">${I[b.icon]()}</div>
                  <div className="benefit-body">
                    <div className="benefit-title">${t(b.title)}</div>
                    <div className="benefit-desc">${t(b.desc)}</div>
                  </div>
                </div>`;
            })}
          </div>

          <div className="period-list">
            ${PERIODS.map(function (per) {
              var on = period[0] === per.id;
              return html`
                <button key=${per.id}
                  className=${"period-row pressable" + (on ? " period-row--sel" : "")}
                  onClick=${function () { haptic("light"); period[1](per.id); }}>
                  <span className=${"period-radio" + (on ? " period-radio--on" : "")}>${on ? I.check(12) : null}</span>
                  <span className="period-labels">
                    <span className="period-name">${t(per.label)}</span>
                    <span className="period-note">${t(per.note)}</span>
                  </span>
                  <span className="period-price">${p.prices[per.id]} ${I.star()}</span>
                </button>`;
            })}
          </div>

          <button className="btn-gradient pressable" onClick=${function () { props.onBuy(tier[0], period[0]); }}>
            ${t("pay")} ${price} ${I.star()}
          </button>
          <div className="sheet-note">${t("subNote")}</div>
        </div>
      </div>`;
  }

  var TIME_CHIPS = ["09:00", "13:00", "18:00", "21:00", "23:59"];
  var DP_HOURS = (function () { var a = []; for (var h = 0; h < 24; h++) a.push(pad2(h)); return a; })();
  var DP_MINS5 = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function monthLong(y, m) {
    var s = new Date(y, m, 1).toLocaleDateString(locale(), { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function monthShort(d) {
    return d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
  }
  function dowLabels() {
    if (S.lang === "en") {
      return S.weekSun
        ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
        : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    }
    return S.weekSun
      ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
      : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  }

  function defaultDeadline() {
    var d = new Date();
    d.setHours(23, 59, 0, 0);
    if (d.getTime() <= Date.now() + 60000) d.setDate(d.getDate() + 1);
    return Math.floor(d.getTime() / 1000);
  }

  function fmtChip(ts) {
    var d = new Date(ts * 1000), now = new Date();
    var tmr = new Date(now);
    tmr.setDate(now.getDate() + 1);
    var tt = fmtTime(ts);
    if (d.toDateString() === now.toDateString()) return tt;
    if (d.toDateString() === tmr.toDateString()) return t("tomorrow") + " " + tt;
    return monthShort(d) + ", " + tt;
  }

  /* ---------------- календарь-пикер ---------------- */

  function DatePickerSheet(props) {
    var view = useState(null);
    var sel = useState(null);
    var time = useState("23:59");

    useEffect(function () {
      if (!props.open) return;
      var d = new Date((props.ts || Math.floor(Date.now() / 1000)) * 1000);
      sel[1]({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() });
      time[1](pad2(d.getHours()) + ":" + pad2(d.getMinutes()));
      view[1]({ y: d.getFullYear(), m: d.getMonth() });
    }, [props.open]);
    if (!props.open || !view[0] || !sel[0]) return null;

    var y = view[0].y, m = view[0].m;
    var today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    var offset = (new Date(y, m, 1).getDay() + (S.weekSun ? 0 : 6)) % 7;
    var days = new Date(y, m + 1, 0).getDate();
    var canPrev = new Date(y, m, 1).getTime() > today0.getTime();

    var move = function (delta) {
      var nm = m + delta, ny = y;
      if (nm < 0) { nm = 11; ny--; }
      if (nm > 11) { nm = 0; ny++; }
      view[1]({ y: ny, m: nm });
    };

    var cells = [];
    for (var i = 0; i < offset; i++) cells.push(null);
    for (var day = 1; day <= days; day++) cells.push(day);

    var tp = time[0].split(":");
    var setHM = function (h, m2) { time[1](pad2(h) + ":" + pad2(m2)); };
    var pickTs = function () {
      return Math.floor(new Date(sel[0].y, sel[0].m, sel[0].d, Number(tp[0]), Number(tp[1]), 0, 0).getTime() / 1000);
    };
    var tsOk = pickTs() > Math.floor(Date.now() / 1000) + 60;

    var chipDisabled = function (t) {
      var p = t.split(":");
      return new Date(sel[0].y, sel[0].m, sel[0].d, Number(p[0]), Number(p[1]), 0, 0).getTime() <= Date.now() + 5 * 60000;
    };

    var seld = new Date(sel[0].y, sel[0].m, sel[0].d);
    var dayName;
    if (seld.getTime() === today0.getTime()) dayName = t("today");
    else {
      var tm = new Date();
      tm.setDate(today0.getDate() + 1);
      dayName = seld.getTime() === tm.getTime() ? t("tomorrow") : monthShort(seld);
    }

    return html`
      <div className="overlay" onClick=${props.onClose}>
        <div className="sheet" onClick=${function (e) { e.stopPropagation(); }}>
          <div className="sheet-handle"></div>
          <div className="sheet-title">${t("deadlineTitle")}</div>

          <div className="dp-head">
            <button className=${"dp-nav pressable" + (canPrev ? "" : " dp-nav--off")}
              disabled=${!canPrev} onClick=${function () { move(-1); }}>${I.chevL()}</button>
            <div className="dp-month">${monthLong(y, m)}</div>
            <button className="dp-nav pressable" onClick=${function () { move(1); }}>${I.chevR()}</button>
          </div>

          <div className="dp-grid">
            ${dowLabels().map(function (w) { return html`<div className="dp-dow" key=${w}>${w}</div>`; })}
            ${cells.map(function (day, idx) {
              if (!day) return html`<div key=${"e" + idx}></div>`;
              var dt = new Date(y, m, day);
              var past = dt.getTime() < today0.getTime();
              var isToday = dt.getTime() === today0.getTime();
              var isSel = sel[0].y === y && sel[0].m === m && sel[0].d === day;
              return html`
                <button key=${day}
                  className=${"dp-cell pressable" + (past ? " dp-cell--past" : "") + (isToday ? " dp-cell--today" : "") + (isSel ? " dp-cell--sel" : "")}
                  disabled=${past}
                  onClick=${function () { haptic("light"); sel[1]({ y: y, m: m, d: day }); }}>${day}</button>`;
            })}
          </div>

          <div className="dp-tlabel">${t("dpHours")}</div>
          <div className="dp-tgrid">
            ${DP_HOURS.map(function (h, hIdx) {
              var on = Number(tp[0]) === hIdx;
              return html`<button key=${h} type="button"
                className=${"dp-tcell pressable" + (on ? " dp-tcell--on" : "")}
                onClick=${function () { haptic("light"); setHM(hIdx, Number(tp[1])); }}>${h}</button>`;
            })}
          </div>

          <div className="dp-tlabel">${t("dpMinutes")} · ${t("timeFree")}</div>
          <div className="dp-tgrid">
            ${DP_MINS5.map(function (mm, mIdx) {
              var mv = mIdx * 5;
              var on = Math.floor(Number(tp[1]) / 5) * 5 === mv;
              return html`<button key=${mm} type="button"
                className=${"dp-tcell pressable" + (on ? " dp-tcell--on" : "")}
                onClick=${function () { haptic("light"); setHM(Number(tp[0]), mv); }}>${mm}</button>`;
            })}
          </div>
          <div className="dp-min-adj">
            <button type="button" className="dp-min-btn pressable"
              onClick=${function () { haptic("light"); var m4 = (Number(tp[1]) + 59) % 60; setHM(Number(tp[0]), m4); }}>−1 мин</button>
            <button type="button" className="dp-min-btn pressable"
              onClick=${function () { haptic("light"); var m5 = (Number(tp[1]) + 1) % 60; setHM(Number(tp[0]), m5); }}>+1 мин</button>
            <span className="dp-time-display">${tp[0]}:${tp[1]}</span>
          </div>

          <div className="dp-chips">
            ${TIME_CHIPS.map(function (tt) {
              var off = chipDisabled(tt);
              return html`
                <button key=${tt}
                  className=${"chip-t pressable" + (time[0] === tt ? " chip-t--on" : "") + (off ? " chip-t--off" : "")}
                  disabled=${off}
                  onClick=${function () { haptic("light"); time[1](tt); }}>${tt}</button>`;
            })}
          </div>

          <div className="dp-summary">${t("deadlineSummary") + dayName + ", " + (S.time12 ? fmt12(time[0]) : time[0])}</div>
          ${tsOk
            ? html`<button className="btn-gradient pressable" onClick=${function () { props.onPick(pickTs()); props.onClose(); }}>${t("setDeadline")}</button>`
            : html`<div className="dp-warn">${t("deadlinePast")}</div>`}
        </div>
      </div>`;
  }

  function App() {
    var data = useState(null);
    var fatal = useState(null);
    var sheet = useState(false);
    var admin = useState(false);
    var idea = useState(false);
    var prof = useState(false);
    var top = useState(false);
    var publicProfile = useState(null);
    var setts = useState(false);
    var sVer = useState(0);
    var toast = useState(null);
    var toastT = useRef(null);

    var showToast = useCallback(function (msg) {
      toast[1](msg);
      clearTimeout(toastT.current);
      toastT.current = setTimeout(function () { toast[1](null); }, 2600);
    }, []);

    var changeSettings = useCallback(function (patch) {
      saveSettings(patch);
      sVer[1](function (x) { return x + 1; });
    }, []);

    var resetSettings = useCallback(function () {
      saveSettings({ theme: "light", accent: "auto", font: "system", fs: "m", blur: "on", anim: "on", haptic: "on", time12: false, weekSun: false });
      sVer[1](function (x) { return x + 1; });
      showToast(t("resetDone"));
    }, [showToast]);

    var load = useCallback(function () {
      var ds = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      return api.get("/api/tasks?day_start=" + ds)
        .then(function (d) { data[1](d); fatal[1](null); })
        .catch(function (e) { fatal[1](e.message || "Ошибка сети"); });
    }, []);

    useEffect(function () { load(); }, [load]);

    useEffect(function () {
      var onInvoice = function (e) {
        if (e.status === "paid") { notif("success"); showToast("Премиум активирован"); load(); }
        else if (e.status === "failed") showToast("Оплата не прошла");
      };
      tg.onEvent("invoiceClosed", onInvoice);
      return function () { tg.offEvent("invoiceClosed", onInvoice); };
    }, [load, showToast]);

    var buy = function (tier, period) {
      haptic("medium");
      api.post("/api/subscription/buy", { tier: tier, period: period })
        .then(function (d) { sheet[1](false); tg.openInvoice(d.invoice_link); })
        .catch(function () { showToast(t("payFail")); });
    };

    var add = function (text, ts) {
      return api.post("/api/tasks", { text: text, deadline_ts: ts })
        .then(function () { haptic("light"); return load().then(function () { return true; }); })
        .catch(function (e) {
          if (e.code === "limit_reached") { notif("warning"); sheet[1](true); }
          else showToast(t("taskFail"));
          return false;
        });
    };

    var done = function (id) {
      haptic("light");
      api.post("/api/tasks/" + id + "/done", {})
        .then(function () { notif("success"); showToast(t("aDone")); return load(); })
        .catch(function () { showToast(t("failed")); });
    };

    var del = function (id) {
      haptic("rigid");
      api.del("/api/tasks/" + id).then(load).catch(function () {});
    };

    if (fatal[0] && !data[0]) {
      var isAuth = String(fatal[0]).indexOf("unauthorized") !== -1 || fatal[0].status === 401;
      return html`
        <div className="app">
          <div className="screen">
            <div className="screen-icon">${isAuth ? I.lock() : I.bolt()}</div>
            <div className="screen-title">${isAuth ? t("openInTg") : t("broken")}</div>
            <div className="screen-sub">${isAuth ? t("openInTgSub") : String(fatal[0].message || fatal[0])}</div>
            <button className="btn-ghost pressable" onClick=${load}>${t("retry")}</button>
          </div>
        </div>`;
    }

    if (!data[0]) {
      return html`<div className="app"><div className="screen"><div className="loader">${I.boltFill(44)}</div></div></div>`;
    }

    var d = data[0];
    var pending = d.pending || [];
    var upcoming = d.upcoming || [];
    var doneList = d.done_today || [];
    var total = pending.length + doneList.length;
    var pct = total ? Math.round((doneList.length / total) * 100) : 0;
    var tier = d.tier || (d.premium ? "regular" : "none");
    var panic = pending.length > 0 && (d.panic_active || new Date().getHours() >= 20);
    var locked = d.task_limit > 0 && (d.created_today || 0) >= d.task_limit;

    return html`
      <div className="app">
        <${Header} tier=${tier} isAdmin=${!!d.is_admin}
          onOpenPremium=${function () { haptic("light"); sheet[1](true); }}
          onOpenAdmin=${function () { haptic("light"); admin[1](true); }}
          onOpenIdea=${function () { haptic("light"); idea[1](true); }}
          onOpenSettings=${function () { haptic("light"); setts[1](true); }} />
        <${NavRow}
          reqCount=${d.friend_requests || 0}
          onProfile=${function () { prof[1](true); }}
          onTop=${function () { top[1](true); }} />
        <${Hero} name=${tgUser && tgUser.first_name ? tgUser.first_name : ""} done=${doneList.length} total=${total} pct=${pct} />
        ${panic ? html`<${PanicBanner} count=${pending.length} />` : null}
        <div className="list">
          ${pending.length
            ? pending.map(function (t) { return html`<${TaskCard} key=${t.id} task=${t} onDone=${done} onDel=${del} />`; })
            : (upcoming.length ? null : html`<${EmptyState} />`)}
        </div>
        ${upcoming.length ? html`
          <div className="section">
            <div className="section-title">Предстоящие · ${upcoming.length}</div>
            <div className="list">
              ${upcoming.map(function (t) { return html`<${TaskCard} key=${t.id} task=${t} onDone=${done} onDel=${del} />`; })}
            </div>
          </div>` : null}
        <${DoneSection} items=${doneList} />
        <${AddBar} onAdd=${add} locked=${locked} onLocked=${function () { sheet[1](true); }} onToast=${showToast} />
        <${SubscriptionSheet} open=${sheet[0]} tier=${tier} premiumUntil=${d.premium_until || 0}
          onClose=${function () { sheet[1](false); }} onBuy=${buy} />
        <${ProfileSheet} open=${prof[0]} sVer=${sVer[0]}
          onClose=${function () { prof[1](false); }}
          onToast=${showToast}
          onChanged=${function () { load(); }}
          onOpenProfile=${function (pid) { prof[1](false); publicProfile[1](pid); }} />
        <${TopSheet} open=${top[0]} sVer=${sVer[0]}
          onClose=${function () { top[1](false); }}
          onOpenProfile=${function (pid) { top[1](false); publicProfile[1](pid); }}
          onOpenMyProfile=${function () { top[1](false); prof[1](true); }} />
        <${PublicProfileSheet} pid=${publicProfile[0]} sVer=${sVer[0]}
          onClose=${function () { publicProfile[1](null); }}
          onToast=${showToast}
          onChanged=${function () { load(); }} />
        <${SettingsSheet} open=${setts[0]}
          onClose=${function () { setts[1](false); }}
          onChange=${changeSettings}
          onReset=${resetSettings} />
        <${AdminSheet} open=${admin[0]} onClose=${function () { admin[1](false); }} />
        <${IdeaSheet} open=${idea[0]} onClose=${function () { idea[1](false); }}
          onSent=${function () { notif("success"); showToast(t("ideaSent")); }}
          onToast=${showToast} />
        ${toast[0] ? html`<div className="toast">${toast[0]}</div>` : null}
      </div>`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
