(function () {
  "use strict";

  function closeBottomMenus(exceptItem) {
    document.querySelectorAll("[data-flux-bottom-item].is-open").forEach(function (item) {
      if (item !== exceptItem) {
        item.classList.remove("is-open");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-flux-bottom-item].has-menu").forEach(function (item) {
      var link = item.querySelector("[data-flux-bottom-link]");

      if (!link) {
        return;
      }

      link.addEventListener("click", function (event) {
        if (!item.classList.contains("is-open")) {
          event.preventDefault();
          closeBottomMenus(item);
          item.classList.add("is-open");
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-flux-bottom-item]")) {
        closeBottomMenus();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeBottomMenus();
      }
    });
  });
})();
