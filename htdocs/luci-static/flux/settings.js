(function () {
  "use strict";

  var slots = ["slot1", "slot2", "slot3"];
  var slotDefaults = {
    slot1: { label: "Home", icon: "home" },
    slot2: { label: "服务", icon: "services" },
    slot3: { label: "网络", icon: "network" }
  };

  function field(slot, option) {
    return document.querySelector('[name="cbid.flux.' + slot + "." + option + '"]');
  }

  function emitChange(element, type) {
    var event = document.createEvent("HTMLEvents");
    event.initEvent(type || "change", true, false);
    element.dispatchEvent(event);
  }

  function fieldContainer(element) {
    return element && element.closest(".cbi-value-field");
  }

  function fieldRow(element) {
    return element && element.closest(".cbi-value");
  }

  function selectedOption(select) {
    return select && select.options[select.selectedIndex];
  }

  function selectedMenuTitle(select) {
    var option = selectedOption(select);
    var parts = option ? option.text.split(" / ") : [];
    return parts.length ? parts[parts.length - 1] : "";
  }

  function createSegmentedSelect(select, className, onChange) {
    if (!select) {
      return function () {};
    }

    var control = document.createElement("div");
    control.className = className;
    control.setAttribute("role", "group");

    Array.prototype.forEach.call(select.options, function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = option.text;
      button.setAttribute("data-value", option.value);
      button.setAttribute("aria-pressed", option.value === select.value ? "true" : "false");
      button.classList.toggle("is-active", option.value === select.value);

      button.addEventListener("click", function () {
        select.value = option.value;
        emitChange(select);
        updateButtons();
        onChange();
      });

      control.appendChild(button);
    });

    function updateButtons() {
      Array.prototype.forEach.call(control.querySelectorAll("button"), function (button) {
        var active = button.getAttribute("data-value") === select.value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    select.classList.add("flux-quick-native-select");
    select.parentNode.insertBefore(control, select.nextSibling);
    select.addEventListener("change", function () {
      updateButtons();
      onChange();
    });

    return updateButtons;
  }

  function createIconPicker(select, onChange) {
    if (!select) {
      return;
    }

    var picker = document.createElement("div");
    picker.className = "flux-icon-picker";
    picker.setAttribute("role", "radiogroup");
    picker.setAttribute("aria-label", "图标");

    Array.prototype.forEach.call(select.options, function (option) {
      var button = document.createElement("button");
      var icon = document.createElement("span");
      var glyph = document.createElement("span");
      var label = document.createElement("span");

      button.type = "button";
      button.className = "flux-icon-choice";
      button.setAttribute("data-value", option.value);
      button.setAttribute("role", "radio");
      icon.className = "flux-bottom-link";
      icon.setAttribute("data-icon", option.value);
      glyph.className = "flux-bottom-icon";
      label.className = "flux-icon-choice-label";
      label.textContent = option.text;
      icon.appendChild(glyph);
      button.appendChild(icon);
      button.appendChild(label);

      button.addEventListener("click", function () {
        select.value = option.value;
        emitChange(select);
        updateButtons();
        onChange();
      });

      picker.appendChild(button);
    });

    function updateButtons() {
      Array.prototype.forEach.call(picker.querySelectorAll(".flux-icon-choice"), function (button) {
        var active = button.getAttribute("data-value") === select.value;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-checked", active ? "true" : "false");
      });
    }

    select.classList.add("flux-quick-native-select");
    select.parentNode.insertBefore(picker, select.nextSibling);
    select.addEventListener("change", function () {
      updateButtons();
      onChange();
    });
  }

  function initialize() {
    var root = document.querySelector("[data-flux-quick-settings]");

    if (!root || root.classList.contains("is-enhanced")) {
      return;
    }

    var fieldsReady = slots.every(function (slot) {
      return field(slot, "source") &&
        field(slot, "menu_path") &&
        field(slot, "custom_path") &&
        field(slot, "label") &&
        field(slot, "icon");
    });

    if (!fieldsReady) {
      window.setTimeout(initialize, 50);
      return;
    }

    var panels = root.querySelector("[data-flux-quick-panels]");
    var branchPaths = {};
    var currentSlot = "slot1";

    Array.prototype.forEach.call(root.querySelectorAll("[data-flux-branch-path]"), function (node) {
      branchPaths[node.getAttribute("data-flux-branch-path")] = true;
    });

    slots.forEach(function (slot) {
      var node = document.getElementById("cbi-flux-" + slot);
      var section = node && node.closest(".cbi-section");

      if (!section) {
        return;
      }

      section.classList.add("flux-quick-panel");
      section.setAttribute("data-flux-quick-panel", slot);
      panels.appendChild(section);
    });

    function updatePreview(slot) {
      var preview = root.querySelector('[data-flux-preview-slot="' + slot + '"]');
      var source = field(slot, "source");
      var menuPath = field(slot, "menu_path");
      var label = field(slot, "label");
      var icon = field(slot, "icon");
      var link = preview && preview.querySelector(".flux-bottom-link");
      var labelNode = preview && preview.querySelector(".flux-bottom-label");
      var isBranch = source && source.value === "menu" && menuPath && branchPaths[menuPath.value];
      var defaults = slotDefaults[slot];

      if (!preview || !link || !labelNode) {
        return;
      }

      preview.classList.toggle("has-menu", !!isBranch);
      link.setAttribute("data-icon", icon && icon.value ? icon.value : defaults.icon);
      labelNode.textContent = label && label.value ? label.value : defaults.label;
    }

    function updateTargetHint(slot) {
      var source = field(slot, "source");
      var menuPath = field(slot, "menu_path");
      var hint = root.querySelector('[data-flux-target-hint="' + slot + '"]');

      if (!hint) {
        return;
      }

      if (source && source.value === "custom") {
        hint.textContent = "点击 Tab 时直接进入自定义路径";
      } else if (menuPath && branchPaths[menuPath.value]) {
        hint.textContent = "包含子菜单，点击 Tab 时展开";
      } else {
        hint.textContent = "点击 Tab 时直接进入页面";
      }
    }

    function setLabelFromMenu(slot) {
      var menuPath = field(slot, "menu_path");
      var label = field(slot, "label");
      var title = selectedMenuTitle(menuPath);

      if (label && title) {
        label.value = title;
        emitChange(label, "input");
        emitChange(label);
      }
    }

    function updateSourceFields(slot) {
      var source = field(slot, "source");
      var menuRow = fieldRow(field(slot, "menu_path"));
      var customRow = fieldRow(field(slot, "custom_path"));
      var custom = source && source.value === "custom";

      if (menuRow) {
        menuRow.hidden = !!custom;
      }

      if (customRow) {
        customRow.hidden = !custom;
      }
    }

    function activateSlot(slot) {
      currentSlot = slot;

      Array.prototype.forEach.call(root.querySelectorAll("[data-flux-slot-button]"), function (button) {
        var active = button.getAttribute("data-flux-slot-button") === slot;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", active ? "true" : "false");
      });

      Array.prototype.forEach.call(root.querySelectorAll("[data-flux-quick-panel]"), function (panel) {
        var active = panel.getAttribute("data-flux-quick-panel") === slot;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });

      Array.prototype.forEach.call(root.querySelectorAll("[data-flux-preview-slot]"), function (preview) {
        preview.classList.toggle("is-active", preview.getAttribute("data-flux-preview-slot") === slot);
      });
    }

    Array.prototype.forEach.call(root.querySelectorAll("[data-flux-slot-button]"), function (button) {
      button.addEventListener("click", function () {
        activateSlot(button.getAttribute("data-flux-slot-button"));
      });
    });

    slots.forEach(function (slot) {
      var source = field(slot, "source");
      var menuPath = field(slot, "menu_path");
      var customPath = field(slot, "custom_path");
      var label = field(slot, "label");
      var icon = field(slot, "icon");
      var hint = document.createElement("div");

      hint.className = "flux-quick-target-hint";
      hint.setAttribute("data-flux-target-hint", slot);

      if (fieldContainer(menuPath)) {
        fieldContainer(menuPath).appendChild(hint);
      }

      createSegmentedSelect(source, "flux-entry-source", function () {
        if (source.value === "menu") {
          setLabelFromMenu(slot);
        }

        updateSourceFields(slot);
        window.setTimeout(function () {
          updateTargetHint(slot);
          updatePreview(slot);
        }, 0);
      });

      createIconPicker(icon, function () {
        updatePreview(slot);
      });

      menuPath.addEventListener("change", function () {
        setLabelFromMenu(slot);
        updateTargetHint(slot);
        updatePreview(slot);
      });
      if (customPath) {
        customPath.addEventListener("input", function () {
          updatePreview(slot);
        });
      }

      if (label) {
        label.addEventListener("input", function () {
          updatePreview(slot);
        });
      }

      updateSourceFields(slot);
      updateTargetHint(slot);
      updatePreview(slot);
    });

    var invalidPanel = root.querySelector("[data-flux-quick-panel] .cbi-input-invalid, [data-flux-quick-panel] .cbi-section-error");

    if (invalidPanel) {
      var invalidSection = invalidPanel.closest("[data-flux-quick-panel]");
      currentSlot = invalidSection ? invalidSection.getAttribute("data-flux-quick-panel") : currentSlot;
    }

    root.classList.add("is-enhanced");
    activateSlot(currentSlot);

    var form = root.closest("form");

    if (form) {
      form.addEventListener("reset", function () {
        window.setTimeout(function () {
          slots.forEach(function (slot) {
            updateTargetHint(slot);
            updatePreview(slot);
          });
        }, 0);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      window.setTimeout(initialize, 0);
    });
  } else {
    window.setTimeout(initialize, 0);
  }
})();
