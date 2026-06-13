(function () {
  const STORAGE_KEY = "body-palette-checkin-pack-state-v2";
  const SETTINGS_STORAGE_KEY = "body-palette-lottery-settings-v3";
  const RULE_FIELDS = ["code", "type", "lead"];

  const tagProfiles = {
    general: {
      label: "通常",
      message: "来場者限定のBODY PALETTE ギフトパックです。画面のパックを開いてください。",
      packType: "GIFT PACK",
    },
    interested: {
      label: "相談希望",
      message: "ご相談ありがとうございます。導入検討に使える特典が入っています。",
      packType: "CONSULT PACK",
    },
    demo: {
      label: "デモ後",
      message: "デモをご覧いただきありがとうございます。次の検討に使える特典が入っています。",
      packType: "DEMO PACK",
    },
    seminar: {
      label: "セミナー参加",
      message: "セミナー参加ありがとうございます。健康経営の整理に使える特典が入っています。",
      packType: "SEMINAR PACK",
    },
    vip: {
      label: "VIP",
      message: "特別なご案内用のパックです。画面のパックを開いてください。",
      packType: "VIP PACK",
    },
  };

  const coupons = [
    {
      id: "onsite-session-present",
      category: "SESSION",
      rarity: "rare",
      weight: 15,
      points: 150,
      name: "オンサイトセッションプレゼント",
      partner: "BODY PALETTE",
      summary: "職場やイベント会場で受けられる対面セッションをプレゼント。",
      terms: "ブーススタッフに提示。日程調整後に実施。30日間有効。",
      image: "./assets/onsite.webp",
      expiresInDays: 30,
    },
    {
      id: "princess-carry",
      category: "EVENT",
      rarity: "super-rare",
      weight: 10,
      points: 200,
      name: "お姫様抱っこ",
      partner: "BODY PALETTE",
      summary: "展示会ブース限定の記念体験。スタッフ確認後に実施します。",
      terms: "安全に実施できる場合のみ。当日限り有効。",
      image: "./assets/session.webp",
      expiresInDays: 1,
    },
    {
      id: "protein-present",
      category: "GIFT",
      rarity: "standard",
      weight: 30,
      points: 60,
      name: "プロテインプレゼント",
      partner: "BODY PALETTE",
      summary: "来場特典としてプロテインをプレゼントします。",
      terms: "ブーススタッフに提示。在庫がなくなり次第終了。当日限り有効。",
      image: "./assets/all-in-one.webp",
      expiresInDays: 1,
    },
    {
      id: "online-session-ticket-present",
      category: "SESSION",
      rarity: "standard",
      weight: 25,
      points: 90,
      name: "オンラインセッション体験チケットプレゼント",
      partner: "BODY PALETTE",
      summary: "オンラインで参加できる運動セッションの体験チケットをプレゼント。",
      terms: "1名1回まで。日程調整後に実施。30日間有効。",
      image: "./assets/service-online.webp",
      expiresInDays: 30,
    },
    {
      id: "lite-health-monitoring-present",
      category: "DX",
      rarity: "rare",
      weight: 20,
      points: 160,
      name: "簡易版健康動態モニタリング プレゼント",
      partner: "BODY PALETTE",
      summary: "従業員の健康状態を見える化する簡易版モニタリングをプレゼント。",
      terms: "法人担当者様向け。事前説明後に提供。30日間有効。",
      image: "./assets/mockup.webp",
      expiresInDays: 30,
    },
  ];

  function createDefaultLotterySettings() {
    return {
      version: 3,
      prizeSettings: coupons.reduce((settings, coupon) => {
        settings[coupon.id] = {
          enabled: true,
          chance: coupon.weight,
        };
        return settings;
      }, {}),
      tagRules: {
        general: {
          categoryBoosts: { SESSION: 0, EVENT: 0, GIFT: 0, DX: 0 },
          couponBoosts: {},
        },
        interested: {
          categoryBoosts: { SESSION: 0, EVENT: 0, GIFT: 0, DX: 0 },
          couponBoosts: {},
        },
        demo: {
          categoryBoosts: { SESSION: 0, EVENT: 0, GIFT: 0, DX: 0 },
          couponBoosts: {},
        },
        seminar: {
          categoryBoosts: { SESSION: 0, EVENT: 0, GIFT: 0, DX: 0 },
          couponBoosts: {},
        },
        vip: {
          categoryBoosts: { SESSION: 0, EVENT: 0, GIFT: 0, DX: 0 },
          couponBoosts: {},
        },
      },
      audienceRules: [
        {
          id: "type-vip-onsite",
          name: "VIPはオンサイトセッションを当たりやすく",
          enabled: true,
          field: "type",
          value: "vip",
          mode: "boost",
          couponId: "onsite-session-present",
          boost: 80,
        },
        {
          id: "lead-hot-monitoring",
          name: "見込み高は簡易モニタリングを当たりやすく",
          enabled: true,
          field: "lead",
          value: "hot",
          mode: "boost",
          couponId: "lite-health-monitoring-present",
          boost: 60,
        },
        {
          id: "code-demo-vip-force",
          name: "demo-vipは簡易モニタリングを確定",
          enabled: true,
          field: "code",
          value: "demo-vip",
          mode: "force",
          couponId: "lite-health-monitoring-present",
          boost: 0,
        },
        {
          id: "code-consult-force",
          name: "consultはオンサイトセッションを確定",
          enabled: true,
          field: "code",
          value: "consult",
          mode: "force",
          couponId: "onsite-session-present",
          boost: 0,
        },
      ],
      updatedAt: "",
    };
  }

  function getCurrentTag() {
    const params = new URLSearchParams(window.location.search);
    return params.get("type") || params.get("tag") || "general";
  }

  function getTagProfile(tag) {
    return tagProfiles[tag] || {
      label: tag,
      message: "来場者限定のBODY PALETTE ギフトパックです。画面のパックを開いてください。",
      packType: "GIFT PACK",
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (!parsed || !Array.isArray(parsed.wallet)) return createInitialState();
      return {
        ...createInitialState(),
        ...parsed,
      };
    } catch (_error) {
      return createInitialState();
    }
  }

  function saveState(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function createInitialState() {
    return {
      wallet: [],
      draws: {},
      points: 0,
      streak: 0,
      lastVisitDate: "",
    };
  }

  function resetState() {
    const state = createInitialState();
    saveState(state);
    return state;
  }

  function loadLotterySettings() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY));
      return normalizeLotterySettings(parsed);
    } catch (_error) {
      return createDefaultLotterySettings();
    }
  }

  function saveLotterySettings(settings) {
    const next = {
      ...normalizeLotterySettings(settings),
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function resetLotterySettings() {
    const settings = createDefaultLotterySettings();
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return settings;
  }

  function normalizeLotterySettings(settings) {
    const defaults = createDefaultLotterySettings();
    const source = settings && typeof settings === "object" ? settings : {};
    const keepTypeRules = Number(source.version) >= 2;

    const prizeSettings = coupons.reduce((acc, coupon) => {
      const defaultPrize = defaults.prizeSettings[coupon.id];
      const sourcePrize = source.prizeSettings && source.prizeSettings[coupon.id];
      acc[coupon.id] = {
        enabled: typeof sourcePrize?.enabled === "boolean" ? sourcePrize.enabled : defaultPrize.enabled,
        chance: toSafeNumber(sourcePrize?.chance ?? sourcePrize?.percent ?? sourcePrize?.weight, defaultPrize.chance),
      };
      return acc;
    }, {});

    const tagRules = Object.keys(defaults.tagRules).reduce((acc, tag) => {
      const defaultRule = defaults.tagRules[tag];
      const sourceRule = keepTypeRules && source.tagRules && source.tagRules[tag];
      acc[tag] = {
        categoryBoosts: normalizeCategoryBoosts(sourceRule?.categoryBoosts, defaultRule.categoryBoosts),
        couponBoosts: normalizeCouponBoosts(sourceRule?.couponBoosts, defaultRule.couponBoosts),
      };
      return acc;
    }, {});

    const audienceRules = Array.isArray(source.audienceRules)
      ? source.audienceRules.map(normalizeAudienceRule).filter(Boolean)
      : defaults.audienceRules.map(normalizeAudienceRule);

    return {
      version: 3,
      prizeSettings,
      tagRules,
      audienceRules,
      updatedAt: source.updatedAt || "",
    };
  }

  function normalizeCategoryBoosts(source, fallback) {
    return getCategories().reduce((acc, category) => {
      acc[category] = toSafeNumber(source?.[category], fallback?.[category] || 0);
      return acc;
    }, {});
  }

  function normalizeCouponBoosts(source, fallback = {}) {
    return coupons.reduce((acc, coupon) => {
      const value = source?.[coupon.id] ?? fallback[coupon.id];
      if (value !== undefined) {
        acc[coupon.id] = toSafeNumber(value, 0);
      }
      return acc;
    }, {});
  }

  function normalizeAudienceRule(rule) {
    if (!rule || typeof rule !== "object") return null;
    const couponExists = coupons.some((coupon) => coupon.id === rule.couponId);
    const field = rule.field === "person"
      ? "code"
      : rule.field === "segment"
        ? "type"
        : rule.field;
    return {
      id: String(rule.id || `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      name: String(rule.name || "個別ルール"),
      enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
      field: RULE_FIELDS.includes(field) ? field : "type",
      value: String(rule.value || "").trim(),
      mode: rule.mode === "force" ? "force" : "boost",
      couponId: couponExists ? rule.couponId : coupons[0].id,
      boost: toSafeNumber(rule.boost, 0),
    };
  }

  function recordVisit(state) {
    const today = getToday();
    if (state.lastVisitDate !== today) {
      state.streak = isYesterday(state.lastVisitDate) ? state.streak + 1 : 1;
      state.lastVisitDate = today;
      saveState(state);
    }
    return state;
  }

  function drawCoupon(tag, options = {}) {
    const context = normalizeVisitorContext({ ...getVisitorContext(), ...options.context, tag });
    const settings = normalizeLotterySettings(options.settings || loadLotterySettings());
    const preview = getDrawPreview(tag, context, settings);

    if (preview.forcedCoupon) {
      return {
        coupon: preview.forcedCoupon,
        rule: preview.forceRule,
        preview,
      };
    }

    let cursor = Math.random() * preview.totalWeight;

    for (const item of preview.items) {
      cursor -= item.weight;
      if (cursor <= 0 && item.weight > 0) {
        return {
          coupon: item.coupon,
          rule: null,
          preview,
        };
      }
    }

    return {
      coupon: preview.items.find((item) => item.weight > 0)?.coupon || coupons[0],
      rule: null,
      preview,
    };
  }

  function pickCoupon(tag, options = {}) {
    return drawCoupon(tag, options).coupon;
  }

  function getDrawPreview(tag, context = {}, settings = loadLotterySettings()) {
    const normalizedSettings = normalizeLotterySettings(settings);
    const normalizedContext = normalizeVisitorContext({ ...context, tag });
    const tagRule = normalizedSettings.tagRules[tag] || { categoryBoosts: {}, couponBoosts: {} };
    const matchedRules = normalizedSettings.audienceRules.filter((rule) => isAudienceRuleMatch(rule, normalizedContext));
    const forceRule = matchedRules.find((rule) => (
      rule.mode === "force" && isCouponEnabled(rule.couponId, normalizedSettings)
    ));
    const forcedCoupon = forceRule
      ? coupons.find((coupon) => coupon.id === forceRule.couponId)
      : null;

    const items = coupons.map((coupon) => {
      const prizeSetting = normalizedSettings.prizeSettings[coupon.id] || {
        enabled: true,
        chance: coupon.weight,
      };
      if (!prizeSetting.enabled) {
        return {
          coupon,
          weight: 0,
          chance: 0,
          probability: 0,
          disabled: true,
        };
      }

      const audienceBoost = matchedRules.reduce((sum, rule) => {
        if (rule.mode !== "boost" || rule.couponId !== coupon.id) return sum;
        return sum + toSafeNumber(rule.boost, 0);
      }, 0);
      const weight = Math.max(
        0,
        toSafeNumber(prizeSetting.chance, coupon.weight)
          + toSafeNumber(tagRule.categoryBoosts?.[coupon.category], 0)
          + toSafeNumber(tagRule.couponBoosts?.[coupon.id], 0)
          + audienceBoost
      );

      return {
        coupon,
        weight,
        chance: toSafeNumber(prizeSetting.chance, coupon.weight),
        probability: 0,
        disabled: false,
      };
    });

    const totalWeight = forcedCoupon ? 1 : items.reduce((sum, item) => sum + item.weight, 0);
    const itemsWithProbability = items.map((item) => ({
      ...item,
      probability: forcedCoupon
        ? Number(item.coupon.id === forcedCoupon.id)
        : totalWeight > 0
          ? item.weight / totalWeight
          : 0,
    }));

    return {
      tag,
      context: normalizedContext,
      items: itemsWithProbability,
      totalWeight,
      matchedRules,
      forceRule,
      forcedCoupon,
    };
  }

  function issueCoupon(coupon, tag, options = {}) {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    const context = normalizeVisitorContext(options.context || {});
    expiresAt.setDate(expiresAt.getDate() + coupon.expiresInDays);

    return {
      ...coupon,
      instanceId: `${coupon.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      code: createCouponCode(coupon.category, tag),
      tag,
      visitorCode: context.code,
      visitorType: context.type,
      lead: context.lead,
      drawRule: options.drawRule || "",
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      usedAt: "",
    };
  }

  function isAudienceRuleMatch(rule, context) {
    if (!rule.enabled || !rule.value) return false;
    const actual = String(context[rule.field] || "").trim().toLowerCase();
    const expected = String(rule.value || "").trim().toLowerCase();
    return Boolean(actual && expected && actual === expected);
  }

  function isCouponEnabled(couponId, settings) {
    const coupon = coupons.find((item) => item.id === couponId);
    if (!coupon) return false;
    const prizeSetting = settings.prizeSettings[couponId];
    return prizeSetting ? prizeSetting.enabled : true;
  }

  function createCouponCode(category, tagName) {
    const date = getToday().replaceAll("-", "").slice(2);
    const tag = tagName.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4).padEnd(4, "X");
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `BP-${category}-${date}-${tag}-${random}`;
  }

  function getTodayCoupon(state, tag) {
    const couponId = state.draws[getDrawKey(tag)];
    return state.wallet.find((coupon) => coupon.instanceId === couponId);
  }

  function hasDrawnToday(state, tag) {
    return Boolean(state.draws[getDrawKey(tag)]);
  }

  function getDrawKey(tag) {
    return `${getToday()}:${tag}`;
  }

  function markCouponUsed(state, instanceId) {
    const next = {
      ...state,
      wallet: state.wallet.map((coupon) => (
        coupon.instanceId === instanceId
          ? { ...coupon, usedAt: new Date().toISOString() }
          : coupon
      )),
    };
    saveState(next);
    return next;
  }

  function reviveCoupon(state, instanceId) {
    const next = {
      ...state,
      wallet: state.wallet.map((coupon) => (
        coupon.instanceId === instanceId ? { ...coupon, usedAt: "" } : coupon
      )),
    };
    saveState(next);
    return next;
  }

  function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getVisitorContext() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") || params.get("segment") || params.get("tag") || "general";
    return normalizeVisitorContext({
      tag: type,
      type,
      source: params.get("source") || "",
      code: params.get("code") || params.get("person") || "",
      lead: params.get("lead") || "",
    });
  }

  function normalizeVisitorContext(context = {}) {
    const type = String(context.type || context.segment || context.tag || "general").trim();
    const code = String(context.code || context.person || "").trim();
    return {
      tag: type,
      type,
      source: String(context.source || "").trim(),
      code,
      lead: String(context.lead || "").trim(),
    };
  }

  function getCategories() {
    return Array.from(new Set(coupons.map((coupon) => coupon.category)));
  }

  function toSafeNumber(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(0, Math.round(number));
  }

  function isYesterday(dateString) {
    if (!dateString) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    return dateString === `${year}-${month}-${day}`;
  }

  function formatDate(dateString, options = { month: "numeric", day: "numeric" }) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString || "-";
    return new Intl.DateTimeFormat("ja-JP", options).format(date);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.PowersLoop = {
    STORAGE_KEY,
    SETTINGS_STORAGE_KEY,
    coupons,
    tagProfiles,
    RULE_FIELDS,
    getCurrentTag,
    getTagProfile,
    getVisitorContext,
    loadState,
    saveState,
    resetState,
    createDefaultLotterySettings,
    loadLotterySettings,
    saveLotterySettings,
    resetLotterySettings,
    normalizeLotterySettings,
    recordVisit,
    drawCoupon,
    pickCoupon,
    getDrawPreview,
    issueCoupon,
    getTodayCoupon,
    hasDrawnToday,
    getDrawKey,
    markCouponUsed,
    reviveCoupon,
    getCategories,
    getToday,
    formatDate,
    escapeHtml,
  };
})();
