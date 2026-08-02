(function () {
  "use strict";

  var drawer;
  var drawerToggle;
  var drawerClose;
  var backdrop;
  var previousFocus;
  var lastDrawerToggle = 0;

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
      closeDrawer(false);
      closeBottomMenus(item);
      item.classList.add("is-open");
    }

    item.setAttribute("data-flux-last-toggle", String(Date.now()));
    return true;
  }

  function drawerIsOpen() {
    return !!(drawer && document.body.classList.contains("flux-drawer-open"));
  }

  function openDrawer(event) {
    if (!drawer || !drawerToggle || drawerIsOpen()) {
      return;
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    closeBottomMenus();
    previousFocus = document.activeElement;
    document.body.classList.add("flux-drawer-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerToggle.setAttribute("aria-expanded", "true");
    lastDrawerToggle = Date.now();

    window.requestAnimationFrame(function () {
      if (drawerClose) {
        drawerClose.focus();
      }
    });
  }

  function closeDrawer(restoreFocus, event) {
    if (!drawer || !drawerIsOpen()) {
      return;
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    document.body.classList.remove("flux-drawer-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerToggle.setAttribute("aria-expanded", "false");

    if (restoreFocus !== false && previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  }

  function toggleDrawer(event) {
    if (drawerIsOpen()) {
      closeDrawer(true, event);
    } else {
      openDrawer(event);
    }
  }

  function trapDrawerFocus(event) {
    var focusable;
    var first;
    var last;

    if (!drawerIsOpen() || event.key !== "Tab") {
      return;
    }

    focusable = drawer.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    first = focusable[0];
    last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var desktopQuery;

    drawer = document.querySelector("[data-flux-drawer]");
    drawerToggle = document.querySelector("[data-flux-drawer-toggle]");
    drawerClose = document.querySelector("[data-flux-drawer-close]");
    backdrop = document.querySelector("[data-flux-backdrop]");

    document.addEventListener("touchend", function (event) {
      var toggle = event.target.closest("[data-flux-drawer-toggle]");
      var link;

      if (toggle) {
        toggleDrawer(event);
        return;
      }

      link = event.target.closest("[data-flux-bottom-link]");
      if (link) {
        toggleBottomMenu(link, event);
      }
    }, { passive: false });

    document.addEventListener("click", function (event) {
      var toggle = event.target.closest("[data-flux-drawer-toggle]");
      var close = event.target.closest("[data-flux-drawer-close]");
      var drawerSummary = event.target.closest("[data-flux-drawer] details > summary");
      var drawerLink = event.target.closest("[data-flux-drawer] a[href]");
      var link = event.target.closest("[data-flux-bottom-link]");
      var summary;

      if (toggle) {
        if (Date.now() - lastDrawerToggle < 650) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        toggleDrawer(event);
        return;
      }

      if (close) {
        closeDrawer(true, event);
        return;
      }

      if (backdrop && (event.target === backdrop || event.target.closest("[data-flux-backdrop]"))) {
        closeDrawer(true, event);
        return;
      }

      if (drawerSummary) {
        toggleDetails(drawerSummary, event);
        return;
      }

      if (drawerLink) {
        closeDrawer(false);
        return;
      }

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

      summary = event.target.closest("[data-flux-bottom-panel] details > summary");
      if (summary) {
        toggleDetails(summary, event);
        return;
      }

      if (!event.target.closest("[data-flux-bottom-item]")) {
        closeBottomMenus();
      }
    });

    document.addEventListener("keydown", function (event) {
      var summary = event.target.closest("[data-flux-bottom-panel] details > summary, [data-flux-drawer] details > summary");

      if (event.key === "Escape") {
        closeBottomMenus();
        closeDrawer(true, event);
        return;
      }

      if (summary && (event.key === "Enter" || event.key === " ")) {
        toggleDetails(summary, event);
        return;
      }

      trapDrawerFocus(event);
    });

    if (window.matchMedia) {
      desktopQuery = window.matchMedia("(min-width: 901px)");

      var closeAtDesktop = function (query) {
        if (query.matches) {
          closeDrawer(false);
        }
      };

      if (desktopQuery.addEventListener) {
        desktopQuery.addEventListener("change", closeAtDesktop);
      } else if (desktopQuery.addListener) {
        desktopQuery.addListener(closeAtDesktop);
      }
    }
  });
})();
