(function () {
  const core = window.PowersLoop;
  const visitorContext = core.getVisitorContext();
  const currentTag = visitorContext.tag || core.getCurrentTag();
  const tagProfile = core.getTagProfile(currentTag);
  let state = core.recordVisit(core.loadState());
  let openTimer = 0;

  const elements = {
    tagPill: document.querySelector(".tag-pill"),
    tagLabel: document.getElementById("tagLabel"),
    visitMessage: document.getElementById("visitMessage"),
    drawButton: document.getElementById("drawButton"),
    openPackButton: document.getElementById("openPackButton"),
    showLatestButton: document.getElementById("showLatestButton"),
    drawNote: document.getElementById("drawNote"),
    packArena: document.getElementById("packArena"),
    packType: document.getElementById("packType"),
    revealCard: document.getElementById("revealCard"),
    revealImage: document.getElementById("revealImage"),
    revealCategory: document.getElementById("revealCategory"),
    rarityBadge: document.getElementById("rarityBadge"),
    prizeName: document.getElementById("prizeName"),
    prizePartner: document.getElementById("prizePartner"),
    prizeCode: document.getElementById("prizeCode"),
    couponDialog: document.getElementById("couponDialog"),
    couponDetail: document.getElementById("couponDetail"),
    confettiLayer: document.getElementById("confettiLayer"),
    packStage: document.querySelector(".pack-stage"),
  };

  initialize();

  function initialize() {
    const shouldShowTag = tagProfile.label && tagProfile.label !== "通常";
    elements.packStage.classList.toggle("has-tag", shouldShowTag);
    elements.tagPill.hidden = !shouldShowTag;
    elements.tagLabel.textContent = tagProfile.label;
    elements.visitMessage.textContent = tagProfile.message;
    elements.packType.textContent = tagProfile.packType;
    render();
    bindEvents();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function bindEvents() {
    elements.drawButton.addEventListener("click", openPack);
    elements.openPackButton.addEventListener("click", handleMainAction);
    elements.showLatestButton.addEventListener("click", showLatestCoupon);
    elements.revealCard.addEventListener("click", showLatestCoupon);
  }

  function handleMainAction() {
    if (elements.packStage.classList.contains("has-result")) {
      render();
      return;
    }

    openPack();
  }

  function openPack() {
    elements.packStage.classList.remove("has-result");
    elements.packArena.classList.remove("has-reveal");
    elements.revealCard.hidden = true;
    elements.drawButton.disabled = true;
    elements.openPackButton.disabled = true;
    elements.showLatestButton.disabled = true;
    elements.packArena.classList.add("is-opening");
    elements.drawNote.textContent = "パックを開封中...";

    window.clearTimeout(openTimer);
    openTimer = window.setTimeout(() => {
      const draw = core.drawCoupon(currentTag, { context: visitorContext, state });
      const issued = core.issueCoupon(draw.coupon, currentTag, {
        context: visitorContext,
        drawRule: draw.rule ? draw.rule.name : "",
      });
      state.wallet.unshift(issued);
      state.draws[core.getDrawKey(currentTag)] = issued.instanceId;
      state.points += issued.points;
      core.saveState(state);

      revealCoupon(issued);
      burstConfetti(issued.rarity);
      syncStats();
      elements.openPackButton.disabled = false;
      elements.showLatestButton.disabled = false;
      elements.openPackButton.innerHTML = '<i data-lucide="rotate-ccw" aria-hidden="true"></i>パックに戻る';
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 1350);
  }

  function revealCoupon(coupon, options = {}) {
    elements.packStage.classList.add("has-result");
    elements.packArena.classList.remove("is-opening");
    elements.packArena.classList.add("has-reveal");
    elements.revealCard.hidden = false;
    elements.revealImage.src = coupon.image;
    elements.revealImage.alt = `${coupon.partner}の特典イメージ`;
    elements.revealCategory.textContent = getCategoryLabel(coupon.category);
    elements.rarityBadge.textContent = getRarityLabel(coupon.rarity);
    elements.rarityBadge.dataset.rarity = coupon.rarity;
    elements.prizeName.textContent = coupon.name;
    elements.prizePartner.textContent = coupon.partner;
    elements.prizeCode.textContent = coupon.code;
    elements.drawNote.textContent = options.alreadyOpened
      ? "直近の特典を表示しています。"
      : "この画面をブーススタッフへ。";
  }

  function showLatestCoupon() {
    const latest = core.getTodayCoupon(state, currentTag) || state.wallet[0];
    if (!latest) {
      elements.drawNote.textContent = "まだクーポンがありません。パックを開封してください。";
      return;
    }

    revealCoupon(latest, { alreadyOpened: true });
    showCouponDetail(latest);
  }

  function showCouponDetail(coupon) {
    elements.couponDetail.innerHTML = `
      <p class="eyebrow">${core.escapeHtml(getCategoryLabel(coupon.category))}</p>
      <h2>${core.escapeHtml(coupon.name)}</h2>
      <p>${core.escapeHtml(coupon.partner)}</p>
      <div class="detail-code">${core.escapeHtml(coupon.code)}</div>
      <p>${core.escapeHtml(coupon.terms)}</p>
      <p>有効期限：${core.formatDate(coupon.expiresAt)} / 獲得：${core.formatDate(coupon.issuedAt)}</p>
    `;

    if (typeof elements.couponDialog.showModal === "function" && !elements.couponDialog.open) {
      elements.couponDialog.showModal();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function render() {
    syncStats();

    elements.packStage.classList.remove("has-result");
    elements.packArena.classList.remove("has-reveal", "is-opening");
    elements.revealCard.hidden = true;
    elements.drawButton.disabled = false;
    elements.openPackButton.disabled = false;
    elements.showLatestButton.disabled = false;
    elements.openPackButton.innerHTML = '<i data-lucide="sparkles" aria-hidden="true"></i>パックを開く';
    elements.drawNote.textContent = "続けて抽選できます。";

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function syncStats() {
    return state;
  }

  function burstConfetti(rarity) {
    elements.confettiLayer.innerHTML = "";
    const count = rarity === "super-rare" ? 46 : rarity === "rare" ? 36 : 26;

    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement("span");
      piece.className = "spark-piece";
      piece.style.setProperty("--tx", `${Math.round(Math.random() * 520 - 260)}px`);
      piece.style.setProperty("--ty", `${Math.round(Math.random() * -360 - 80)}px`);
      piece.style.setProperty("--delay", `${Math.random() * 90}ms`);
      elements.confettiLayer.appendChild(piece);
    }

    window.setTimeout(() => {
      elements.confettiLayer.innerHTML = "";
    }, 1100);
  }

  function getRarityLabel(rarity) {
    if (rarity === "super-rare") return "SUPER RARE";
    if (rarity === "rare") return "RARE";
    return "HIT";
  }

  function getCategoryLabel(category) {
    if (category === "SESSION") return "体験特典";
    if (category === "EVENT") return "イベント特典";
    if (category === "GIFT") return "プレゼント特典";
    if (category === "DX") return "DX特典";
    return "特典";
  }
})();
