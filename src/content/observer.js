"use strict";

function observeOracleShell() {
  let scheduled = false;

  const scheduleEnsureCard = () => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      ensureSalesCenterCard();
    });
  };

  const observer = new MutationObserver(scheduleEnsureCard);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  scheduleEnsureCard();
}
