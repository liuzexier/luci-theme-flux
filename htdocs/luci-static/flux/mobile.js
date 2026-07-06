(function () {
  "use strict";

  function closeBottomMenus(exceptItem) {
    document.querySelectorAll("[data-flux-bottom-item].is-open").forEach(function (item) {
      if (item !== exceptItem) {
        item.classList.remove("is-open");
      }
    });
  }

  function toggleDetails(summary, event) {
    var details = summary.closest("details");

    if (!details) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    details.open = !details.open;
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

    document.querySelectorAll("[data-flux-bottom-panel] details > summary").forEach(function (summary) {
      summary.addEventListener("click", function (event) {
        toggleDetails(summary, event);
      });

      summary.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          toggleDetails(summary, event);
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
