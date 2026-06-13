(function () {
  const core = window.PowersLoop;
  let state = core.loadState();
  let settings = core.loadLotterySettings();
  let walletFilter = "ALL";
  let catalogFilter = "ALL";

  const elements = {
    metricIssued: document.getElementById("metricIssued"),
    metricActive: document.getElementById("metricActive"),
    metricUsed: document.getElementById("metricUsed"),
    metricPoints: document.getElementById("metricPoints"),
    walletList: document.getElementById("walletList"),
    couponCatalog: document.getElementById("couponCatalog"),
    resetDemoButton: document.getElementById("resetDemoButton"),
    prizeSettingList: document.getElementById("prizeSettingList"),
    audienceRuleList: document.getElementById("audienceRuleList"),
    addAudienceRuleButton: document.getElementById("addAudienceRuleButton"),
    saveLotterySettingsButton: document.getElementById("saveLotterySettingsButton"),
    resetLotterySettingsButton: document.getElementById("resetLotterySettingsButton"),
    normalizeChanceButton: document.getElementById("normalizeChanceButton"),
    settingsStatus: document.getElementById("settingsStatus"),
    chanceTotal: document.getElementById("chanceTotal"),
    previewTypeSelect: document.getElementById("previewTypeSelect"),
    previewCodeInput: document.getElementById("previewCodeInput"),
    previewLeadSelect: document.getElementById("previewLeadSelect"),
    drawPreviewList: document.getElementById("drawPreviewList"),
  };

  initialize();

  function initialize() {
    renderPreviewTypeOptions();
    bindEvents();
    render();
    markSettingsSaved();
  }

  function bindEvents() {
    document.querySelectorAll("[data-wallet-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        walletFilter = button.dataset.walletFilter;
        syncFilterButtons("[data-wallet-filter]", walletFilter);
        renderWallet();
      });
    });

    document.querySelectorAll("[data-catalog-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        catalogFilter = button.dataset.catalogFilter;
        syncFilterButtons("[data-catalog-filter]", catalogFilter);
        renderCatalog();
      });
    });

    elements.walletList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      if (button.dataset.action === "use") {
        state = core.markCouponUsed(state, button.dataset.couponId);
      }

      if (button.dataset.action === "revive") {
        state = core.reviveCoupon(state, button.dataset.couponId);
      }

      render();
    });

    elements.prizeSettingList.addEventListener("input", handlePrizeSettingChange);
    elements.prizeSettingList.addEventListener("change", handlePrizeSettingChange);
    elements.audienceRuleList.addEventListener("input", handleAudienceRuleChange);
    elements.audienceRuleList.addEventListener("change", handleAudienceRuleChange);
    elements.audienceRuleList.addEventListener("click", handleAudienceRuleClick);

    elements.addAudienceRuleButton.addEventListener("click", () => {
      settings.audienceRules.push(createBlankAudienceRule());
      settings = core.normalizeLotterySettings(settings);
      markSettingsDirty();
      renderAudienceRules();
      renderPreview();
    });

    elements.normalizeChanceButton.addEventListener("click", () => {
      normalizeChancesTo100();
      settings = core.normalizeLotterySettings(settings);
      markSettingsDirty();
      renderSettings();
      renderCatalog();
      renderPreview();
    });

    elements.saveLotterySettingsButton.addEventListener("click", () => {
      settings = core.saveLotterySettings(settings);
      markSettingsSaved();
      renderSettings();
      renderCatalog();
      renderPreview();
    });

    elements.resetLotterySettingsButton.addEventListener("click", () => {
      const ok = window.confirm("抽選設定を初期状態に戻しますか？");
      if (!ok) return;
      settings = core.resetLotterySettings();
      markSettingsSaved();
      renderSettings();
      renderCatalog();
      renderPreview();
    });

    elements.resetDemoButton.addEventListener("click", () => {
      const ok = window.confirm("この端末のクーポン履歴をリセットしますか？");
      if (!ok) return;
      state = core.resetState();
      render();
    });

    [
      elements.previewTypeSelect,
      elements.previewCodeInput,
      elements.previewLeadSelect,
    ].forEach((input) => {
      input.addEventListener("input", renderPreview);
      input.addEventListener("change", renderPreview);
    });
  }

  function render() {
    renderMetrics();
    renderSettings();
    renderWallet();
    renderCatalog();
    renderPreview();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function renderMetrics() {
    const issued = state.wallet.length;
    const used = state.wallet.filter((coupon) => coupon.usedAt).length;
    elements.metricIssued.textContent = String(issued);
    elements.metricActive.textContent = String(issued - used);
    elements.metricUsed.textContent = String(used);
    elements.metricPoints.textContent = String(state.points);
  }

  function renderSettings() {
    renderChanceTotal();
    renderPrizeSettings();
    renderAudienceRules();
  }

  function renderChanceTotal() {
    const total = getEnabledChanceTotal();
    elements.chanceTotal.textContent = `合計 ${total}%`;
    elements.chanceTotal.classList.toggle("is-warning", total !== 100);
  }

  function renderPrizeSettings() {
    elements.prizeSettingList.innerHTML = core.coupons.map((coupon) => {
      const prize = settings.prizeSettings[coupon.id] || { enabled: true, chance: coupon.weight };
      const chance = Number(prize.chance || 0);
      return `
        <article class="prize-setting-row ${prize.enabled ? "" : "is-disabled"}" data-prize-row="${core.escapeHtml(coupon.id)}">
          <label class="inline-check prize-check">
            <input type="checkbox" data-prize-id="${core.escapeHtml(coupon.id)}" data-prize-field="enabled" ${prize.enabled ? "checked" : ""}>
            <span>${core.escapeHtml(coupon.name)}</span>
          </label>
          <span class="setting-meta">${core.escapeHtml(getRarityLabel(coupon.rarity))}</span>
          <label class="chance-slider">
            <span>当選確率</span>
            <input type="range" min="0" max="100" step="1" value="${chance}" data-prize-id="${core.escapeHtml(coupon.id)}" data-prize-field="chance">
          </label>
          <label class="chance-number">
            <input type="number" min="0" max="100" step="1" value="${chance}" data-prize-id="${core.escapeHtml(coupon.id)}" data-prize-field="chance">
            <span>%</span>
          </label>
          <span class="probability-pill" data-probability-for="${core.escapeHtml(coupon.id)}">0%</span>
        </article>
      `;
    }).join("");
  }

  function renderAudienceRules() {
    if (!settings.audienceRules.length) {
      elements.audienceRuleList.innerHTML = '<p class="empty-wallet">特別ルールはまだありません。</p>';
      return;
    }

    elements.audienceRuleList.innerHTML = settings.audienceRules.map((rule, index) => `
      <article class="audience-rule-card ${rule.enabled ? "" : "is-disabled"}">
        <div class="rule-card-top">
          <label class="inline-check">
            <input type="checkbox" ${rule.enabled ? "checked" : ""} data-rule-index="${index}" data-rule-field="enabled">
            <span>使う</span>
          </label>
          <button class="danger-button compact-button" type="button" data-delete-rule-index="${index}">
            <i data-lucide="trash-2" aria-hidden="true"></i>
            削除
          </button>
        </div>
        <label class="full-field">
          <span>ルール名</span>
          <input type="text" value="${core.escapeHtml(rule.name)}" data-rule-index="${index}" data-rule-field="name">
        </label>
        <div class="rule-grid">
          <label>
            <span>だれに</span>
            <select data-rule-index="${index}" data-rule-field="field">
              <option value="code" ${rule.field === "code" ? "selected" : ""}>個別コード</option>
              <option value="type" ${rule.field === "type" ? "selected" : ""}>来場者タイプ</option>
              <option value="lead" ${rule.field === "lead" ? "selected" : ""}>見込み度</option>
            </select>
          </label>
          <label>
            <span>条件</span>
            ${renderRuleValueControl(rule, index)}
          </label>
          <label>
            <span>どうする</span>
            <select data-rule-index="${index}" data-rule-field="mode">
              <option value="boost" ${rule.mode === "boost" ? "selected" : ""}>当たりやすく</option>
              <option value="force" ${rule.mode === "force" ? "selected" : ""}>必ず当てる</option>
            </select>
          </label>
          <label>
            <span>どの特典</span>
            <select data-rule-index="${index}" data-rule-field="couponId">
              ${core.coupons.map((coupon) => `
                <option value="${core.escapeHtml(coupon.id)}" ${rule.couponId === coupon.id ? "selected" : ""}>${core.escapeHtml(coupon.name)}</option>
              `).join("")}
            </select>
          </label>
          <label>
            <span>強さ</span>
            <select data-rule-index="${index}" data-rule-field="boost" ${rule.mode === "force" ? "disabled" : ""}>
              <option value="25" ${rule.boost === 25 ? "selected" : ""}>少し</option>
              <option value="60" ${rule.boost === 60 ? "selected" : ""}>かなり</option>
              <option value="100" ${rule.boost === 100 ? "selected" : ""}>大きく</option>
            </select>
          </label>
        </div>
      </article>
    `).join("");

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function renderRuleValueControl(rule, index) {
    if (rule.field === "type") {
      return `
        <select data-rule-index="${index}" data-rule-field="value">
          ${Object.entries(core.tagProfiles).map(([value, profile]) => `
            <option value="${core.escapeHtml(value)}" ${rule.value === value ? "selected" : ""}>${core.escapeHtml(profile.label)}</option>
          `).join("")}
        </select>
      `;
    }

    if (rule.field === "lead") {
      return `
        <select data-rule-index="${index}" data-rule-field="value">
          <option value="hot" ${rule.value === "hot" ? "selected" : ""}>高い</option>
          <option value="normal" ${rule.value === "normal" ? "selected" : ""}>通常</option>
        </select>
      `;
    }

    return `<input type="text" value="${core.escapeHtml(rule.value)}" data-rule-index="${index}" data-rule-field="value" placeholder="demo-vip">`;
  }

  function renderWallet() {
    const visible = state.wallet.filter((coupon) => {
      if (walletFilter === "ACTIVE") return !coupon.usedAt;
      if (walletFilter === "USED") return Boolean(coupon.usedAt);
      return true;
    });

    if (!visible.length) {
      elements.walletList.innerHTML = '<p class="empty-wallet">表示するクーポンはまだありません。</p>';
      return;
    }

    elements.walletList.innerHTML = visible.map((coupon) => {
      const visitorType = coupon.visitorType || coupon.segment || coupon.tag || "general";
      const visitorCode = coupon.visitorCode || coupon.person || "";
      const audience = [
        `来場者：${getTypeLabel(visitorType)}`,
        visitorCode && `個別コード：${visitorCode}`,
        coupon.lead && `見込み度：${getLeadLabel(coupon.lead)}`,
      ].filter(Boolean).join(" / ");
      const rule = coupon.drawRule ? ` / ルール：${coupon.drawRule}` : "";
      return `
        <article class="admin-coupon-card ${coupon.usedAt ? "is-used" : ""}" data-category="${coupon.category}">
          <div class="coupon-meta">
            <span>${core.escapeHtml(getCategoryLabel(coupon.category))} / ${core.escapeHtml(coupon.partner)}</span>
            <span>${core.formatDate(coupon.expiresAt)}まで</span>
          </div>
          <h3>${core.escapeHtml(coupon.name)}</h3>
          <p>${core.escapeHtml(coupon.summary)}</p>
          <span class="coupon-code">${core.escapeHtml(coupon.code)}</span>
          <p>${core.escapeHtml(audience)}${core.escapeHtml(rule)} / 発行：${core.formatDate(coupon.issuedAt, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          <div class="coupon-actions">
            <button class="coupon-action" type="button" data-action="${coupon.usedAt ? "revive" : "use"}" data-coupon-id="${coupon.instanceId}">
              <i data-lucide="${coupon.usedAt ? "rotate-ccw" : "check"}" aria-hidden="true"></i>
              ${coupon.usedAt ? "未使用に戻す" : "使用済みにする"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderCatalog() {
    const preview = getCurrentPreview();
    const probabilityById = preview.items.reduce((acc, item) => {
      acc[item.coupon.id] = item.probability;
      return acc;
    }, {});
    const visibleCoupons = core.coupons.filter((coupon) => catalogFilter === "ALL" || coupon.category === catalogFilter);

    elements.couponCatalog.innerHTML = visibleCoupons.map((coupon) => {
      const prize = settings.prizeSettings[coupon.id] || { enabled: true, chance: coupon.weight };
      return `
        <article class="catalog-item ${prize.enabled ? "" : "is-disabled"}">
          <img class="catalog-thumb" src="${coupon.image}" alt="${core.escapeHtml(coupon.partner)}の特典イメージ" loading="lazy">
          <div class="catalog-badges">
            <span class="badge ${coupon.category.toLowerCase()}">${core.escapeHtml(getCategoryLabel(coupon.category))}</span>
            <span class="badge">${core.escapeHtml(getRarityLabel(coupon.rarity))}</span>
            <span class="badge">${prize.enabled ? `${prize.chance}%` : "OFF"}</span>
            <span class="badge">${formatPercent(probabilityById[coupon.id] || 0)}</span>
          </div>
          <h3>${core.escapeHtml(coupon.name)}</h3>
          <p>${core.escapeHtml(coupon.summary)}</p>
        </article>
      `;
    }).join("");
  }

  function renderPreviewTypeOptions() {
    elements.previewTypeSelect.innerHTML = Object.entries(core.tagProfiles).map(([type, profile]) => `
      <option value="${core.escapeHtml(type)}" ${type === "general" ? "selected" : ""}>${core.escapeHtml(profile.label)}</option>
    `).join("");
  }

  function renderPreview() {
    const preview = getCurrentPreview();
    const forceText = preview.forcedCoupon
      ? `<p class="force-preview">固定当選：${core.escapeHtml(preview.forcedCoupon.name)} / ${core.escapeHtml(preview.forceRule.name)}</p>`
      : "";
    const zeroText = !preview.forcedCoupon && preview.totalWeight <= 0
      ? '<p class="force-preview">有効な特典がありません。</p>'
      : "";
    const sortedItems = [...preview.items].sort((a, b) => b.probability - a.probability);

    elements.drawPreviewList.innerHTML = `
      ${forceText}
      ${zeroText}
      ${sortedItems.map((item) => `
        <article class="preview-row ${item.disabled ? "is-disabled" : ""}">
          <div>
            <strong>${core.escapeHtml(item.coupon.name)}</strong>
            <span>${core.escapeHtml(getCategoryLabel(item.coupon.category))} / 設定 ${item.chance}%</span>
          </div>
          <b>${formatPercent(item.probability)}</b>
        </article>
      `).join("")}
    `;

    renderPrizeProbabilities(preview);
  }

  function renderPrizeProbabilities(preview = getCurrentPreview()) {
    preview.items.forEach((item) => {
      const target = elements.prizeSettingList.querySelector(`[data-probability-for="${item.coupon.id}"]`);
      if (target) {
        target.textContent = formatPercent(item.probability);
      }
    });
  }

  function handlePrizeSettingChange(event) {
    const target = event.target;
    const prizeId = target.dataset.prizeId;
    const field = target.dataset.prizeField;
    if (!prizeId || !field) return;

    if (!settings.prizeSettings[prizeId]) {
      settings.prizeSettings[prizeId] = { enabled: true, chance: 0 };
    }

    if (field === "enabled") {
      settings.prizeSettings[prizeId].enabled = target.checked;
    }

    if (field === "chance") {
      settings.prizeSettings[prizeId].chance = toNumber(target.value);
    }

    settings = core.normalizeLotterySettings(settings);
    markSettingsDirty();
    renderSettings();
    renderCatalog();
    renderPreview();
  }

  function handleAudienceRuleChange(event) {
    const target = event.target;
    const index = Number(target.dataset.ruleIndex);
    const field = target.dataset.ruleField;
    if (!Number.isInteger(index) || !field || !settings.audienceRules[index]) return;

    const rule = settings.audienceRules[index];
    if (field === "enabled") {
      rule.enabled = target.checked;
    } else if (field === "boost") {
      rule.boost = toNumber(target.value);
    } else {
      rule[field] = target.value;
    }

    settings = core.normalizeLotterySettings(settings);
    markSettingsDirty();
    if (field === "field" || field === "mode" || field === "enabled") {
      renderAudienceRules();
    }
    renderCatalog();
    renderPreview();
  }

  function handleAudienceRuleClick(event) {
    const button = event.target.closest("button[data-delete-rule-index]");
    if (!button) return;
    const index = Number(button.dataset.deleteRuleIndex);
    if (!Number.isInteger(index)) return;
    settings.audienceRules.splice(index, 1);
    settings = core.normalizeLotterySettings(settings);
    markSettingsDirty();
    renderAudienceRules();
    renderCatalog();
    renderPreview();
  }

  function getCurrentPreview() {
    const type = elements.previewTypeSelect.value || "general";
    return core.getDrawPreview(type, getPreviewContext(), settings);
  }

  function getPreviewContext() {
    return {
      type: elements.previewTypeSelect.value,
      code: elements.previewCodeInput.value,
      lead: elements.previewLeadSelect.value,
    };
  }

  function createBlankAudienceRule() {
    return {
      id: `custom-${Date.now()}`,
      name: "新しい特別ルール",
      enabled: true,
      field: "code",
      value: "demo-vip",
      mode: "force",
      couponId: "lite-health-monitoring-present",
      boost: 60,
    };
  }

  function normalizeChancesTo100() {
    const enabledPrizes = core.coupons
      .map((coupon) => ({ coupon, prize: settings.prizeSettings[coupon.id] }))
      .filter((item) => item.prize?.enabled);
    const currentTotal = enabledPrizes.reduce((sum, item) => sum + Number(item.prize.chance || 0), 0);
    if (!enabledPrizes.length) return;

    if (currentTotal <= 0) {
      const even = Math.floor(100 / enabledPrizes.length);
      let remainder = 100 - even * enabledPrizes.length;
      enabledPrizes.forEach((item) => {
        item.prize.chance = even + (remainder > 0 ? 1 : 0);
        remainder -= 1;
      });
      return;
    }

    let allocated = 0;
    enabledPrizes.forEach((item, index) => {
      if (index === enabledPrizes.length - 1) {
        item.prize.chance = 100 - allocated;
        return;
      }
      const next = Math.round((Number(item.prize.chance || 0) / currentTotal) * 100);
      item.prize.chance = next;
      allocated += next;
    });
  }

  function getEnabledChanceTotal() {
    return core.coupons.reduce((sum, coupon) => {
      const prize = settings.prizeSettings[coupon.id];
      return prize?.enabled ? sum + Number(prize.chance || 0) : sum;
    }, 0);
  }

  function markSettingsDirty() {
    elements.settingsStatus.textContent = "未保存の変更あり";
    elements.settingsStatus.classList.add("is-dirty");
  }

  function markSettingsSaved() {
    elements.settingsStatus.textContent = settings.updatedAt
      ? `保存済み：${core.formatDate(settings.updatedAt, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
      : "保存済み";
    elements.settingsStatus.classList.remove("is-dirty");
  }

  function syncFilterButtons(selector, activeValue) {
    document.querySelectorAll(selector).forEach((button) => {
      const key = button.dataset.walletFilter || button.dataset.catalogFilter;
      const isActive = key === activeValue;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function getTypeLabel(type) {
    return core.tagProfiles[type]?.label || type || "通常来場者";
  }

  function getLeadLabel(lead) {
    if (lead === "hot") return "高い";
    if (lead === "normal") return "通常";
    return lead;
  }

  function getCategoryLabel(category) {
    if (category === "SESSION") return "体験";
    if (category === "EVENT") return "イベント";
    if (category === "GIFT") return "プレゼント";
    if (category === "DX") return "DX";
    return category;
  }

  function getRarityLabel(rarity) {
    if (rarity === "super-rare") return "激レア";
    if (rarity === "rare") return "レア";
    return "通常";
  }

  function formatPercent(value) {
    const percent = Math.round(Number(value || 0) * 1000) / 10;
    return `${percent}%`;
  }

  function toNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.round(number));
  }
})();
