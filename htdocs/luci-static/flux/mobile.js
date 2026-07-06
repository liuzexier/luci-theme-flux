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

  function toggleBottomMenu(link, event) {
    var item = link.closest("[data-flux-bottom-item].has-menu");

    if (!item) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();

    if (item.classList.contains("is-open")) {
      item.classList.remove("is-open");
    } else {
      closeBottomMenus(item);
      item.classList.add("is-open");
    }

    item.setAttribute("data-flux-last-toggle", String(Date.now()));
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("touchend", function (event) {
      var link = event.target.closest("[data-flux-bottom-link]");

      if (link) {
        toggleBottomMenu(link, event);
      }
    }, { passive: false });

    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-flux-bottom-link]");

      if (link) {
        var item = link.closest("[data-flux-bottom-item].has-menu");
        var lastToggle = item ? Number(item.getAttribute("data-flux-last-toggle") || 0) : 0;

        if (Date.now() - lastToggle < 650) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (toggleBottomMenu(link, event)) {
          return;
        }
      }

      var summary = event.target.closest("[data-flux-bottom-panel] details > summary");

      if (summary) {
        toggleDetails(summary, event);
        return;
      }

      if (!event.target.closest("[data-flux-bottom-item]")) {
        closeBottomMenus();
      }
    });

    document.addEventListener("keydown", function (event) {
      var summary = event.target.closest("[data-flux-bottom-panel] details > summary");

      if (summary && (event.key === "Enter" || event.key === " ")) {
        toggleDetails(summary, event);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeBottomMenus();
      }
    });
  });
})();
