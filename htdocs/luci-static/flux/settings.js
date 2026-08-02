(function () {
  "use strict";

  var slots = ["slot1", "slot2", "slot3", "slot4", "slot5"];
  var slotOptions = ["source", "menu_path", "custom_path", "label", "icon"];
  var slotDefaults = {
    slot1: { source: "custom", menu_path: "admin/quickstart", custom_path: "/", label: "Home", icon: "home" },
    slot2: { source: "menu", menu_path: "admin/services", custom_path: "/", label: "服务", icon: "services" },
    slot3: { source: "menu", menu_path: "admin/network", custom_path: "/", label: "网络", icon: "network" },
    slot4: { source: "menu", menu_path: "admin/system", custom_path: "/", label: "系统", icon: "system" },
    slot5: { source: "menu", menu_path: "admin/status", custom_path: "/", label: "状态", icon: "status" }
  };

  function field(section, option) {
    return document.querySelector('[name="cbid.flux.' + section + "." + option + '"]');
  }

  function emitChange(element, type) {
    var event;

    if (!element) {
      return;
    }

    event = document.createEvent("HTMLEvents");
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
      return function () {};
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

    return updateButtons;
  }

  function initialize() {
    var root = document.querySelector("[data-flux-quick-settings]");
    var countField = field("theme", "tab_count");

    if (!root || root.classList.contains("is-enhanced")) {
      return;
    }

    var fieldsReady = countField && slots.every(function (slot) {
      return slotOptions.every(function (option) {
        return !!field(slot, option);
      });
    });

    if (!fieldsReady) {
      window.setTimeout(initialize, 50);
      return;
    }

    var panels = root.querySelector("[data-flux-quick-panels]");
    var previewNav = root.querySelector("[data-flux-quick-preview-nav]");
    var countNode = root.querySelector("[data-flux-quick-count]");
    var addButton = root.querySelector("[data-flux-add-slot]");
    var deleteButton = root.querySelector("[data-flux-delete-slot]");
    var branchPaths = {};
    var visualUpdaters = {};
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

    function slotIndex(slot) {
      return slots.indexOf(slot);
    }

    function getCount() {
      var count = Number(countField.value || 4);

      if (!isFinite(count) || count < 1 || count > 5) {
        count = 4;
      }

      return Math.floor(count);
    }

    function updatePreview(slot) {
      var preview = root.querySelector('[data-flux-preview-slot="' + slot + '"]');
      var source = field(slot, "source");
      var menuPath = field(slot, "menu_path");
      var label = field(slot, "label");
      var icon = field(slot, "icon");
      var link = preview && preview.querySelector(".flux-bottom-link");
      var labelNode = preview && preview.querySelector(".flux-bottom-label");
      var isBranch = source.value === "menu" && !!branchPaths[menuPath.value];
      var defaults = slotDefaults[slot];

      if (!preview || !link || !labelNode) {
        return;
      }

      preview.classList.toggle("has-menu", isBranch);
      link.setAttribute("data-icon", icon.value || defaults.icon);
      labelNode.textContent = label.value || defaults.label;
    }

    function updateTargetHint(slot) {
      var source = field(slot, "source");
      var menuPath = field(slot, "menu_path");
      var hint = root.querySelector('[data-flux-target-hint="' + slot + '"]');

      if (!hint) {
        return;
      }

      if (source.value === "custom") {
        hint.textContent = "点击 Tab 时直接进入自定义路径";
      } else if (branchPaths[menuPath.value]) {
        hint.textContent = "包含子菜单，点击 Tab 时展开";
      } else {
        hint.textContent = "点击 Tab 时直接进入页面";
      }
    }

    function setLabelFromMenu(slot) {
      var menuPath = field(slot, "menu_path");
      var label = field(slot, "label");
      var title = selectedMenuTitle(menuPath);

      if (title) {
        label.value = title;
        emitChange(label, "input");
        emitChange(label);
      }
    }

    function updateSourceFields(slot) {
      var source = field(slot, "source");
      var menuRow = fieldRow(field(slot, "menu_path"));
      var customRow = fieldRow(field(slot, "custom_path"));
      var custom = source.value === "custom";

      if (menuRow) {
        menuRow.hidden = custom;
      }

      if (customRow) {
        customRow.hidden = !custom;
      }
    }

    function activateSlot(slot) {
      var count = getCount();
      var index = slotIndex(slot);

      if (index < 0 || index >= count) {
        slot = slots[Math.max(0, count - 1)];
      }

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

    function updateVisibleSlots() {
      var count = getCount();

      slots.forEach(function (slot, index) {
        var visible = index < count;
        var button = root.querySelector('[data-flux-slot-button="' + slot + '"]');
        var preview = root.querySelector('[data-flux-preview-slot="' + slot + '"]');

        if (button) {
          button.hidden = !visible;
        }

        if (preview) {
          preview.hidden = !visible;
        }
      });

      if (previewNav) {
        previewNav.style.setProperty("--flux-tab-count", String(count));
      }

      if (countNode) {
        countNode.textContent = count + " / 5";
      }

      addButton.disabled = count >= 5;
      deleteButton.disabled = count <= 1;
      activateSlot(currentSlot);
    }

    function setCount(count) {
      countField.value = String(Math.max(1, Math.min(5, count)));
      emitChange(countField);
      updateVisibleSlots();
    }

    function setSlotValues(slot, values) {
      slotOptions.forEach(function (option) {
        var element = field(slot, option);

        element.value = values[option] == null ? "" : values[option];
        emitChange(element, option === "label" || option === "custom_path" ? "input" : "change");
      });

      updateSourceFields(slot);
      updateTargetHint(slot);
      updatePreview(slot);
    }

    function readSlotValues(slot) {
      var values = {};

      slotOptions.forEach(function (option) {
        values[option] = field(slot, option).value;
      });

      return values;
    }

    function resetSlot(slot) {
      setSlotValues(slot, slotDefaults[slot]);
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

      if (fieldContainer(source)) {
        fieldContainer(source).appendChild(hint);
      }

      visualUpdaters[slot] = {};
      visualUpdaters[slot].source = createSegmentedSelect(source, "flux-entry-source", function () {
        if (source.value === "menu") {
          setLabelFromMenu(slot);
        }

        updateSourceFields(slot);
        window.setTimeout(function () {
          updateTargetHint(slot);
          updatePreview(slot);
        }, 0);
      });

      visualUpdaters[slot].icon = createIconPicker(icon, function () {
        updatePreview(slot);
      });

      menuPath.addEventListener("change", function () {
        setLabelFromMenu(slot);
        updateTargetHint(slot);
        updatePreview(slot);
      });
      customPath.addEventListener("input", function () {
        updatePreview(slot);
      });
      label.addEventListener("input", function () {
        updatePreview(slot);
      });

      updateSourceFields(slot);
      updateTargetHint(slot);
      updatePreview(slot);
    });

    addButton.addEventListener("click", function () {
      var count = getCount();
      var slot;

      if (count >= 5) {
        return;
      }

      slot = slots[count];
      resetSlot(slot);
      currentSlot = slot;
      setCount(count + 1);
    });

    deleteButton.addEventListener("click", function () {
      var count = getCount();
      var index = slotIndex(currentSlot);
      var nextIndex;

      if (count <= 1 || index < 0 || index >= count) {
        return;
      }

      for (nextIndex = index; nextIndex < count - 1; nextIndex += 1) {
        setSlotValues(slots[nextIndex], readSlotValues(slots[nextIndex + 1]));
      }

      resetSlot(slots[count - 1]);
      currentSlot = slots[Math.min(index, count - 2)];
      setCount(count - 1);
    });

    countField.addEventListener("change", function () {
      updateVisibleSlots();
    });

    var countRow = fieldRow(countField);
    if (countRow) {
      countRow.hidden = true;
    }

    var invalidPanel = root.querySelector("[data-flux-quick-panel] .cbi-input-invalid, [data-flux-quick-panel] .cbi-section-error");
    if (invalidPanel) {
      var invalidSection = invalidPanel.closest("[data-flux-quick-panel]");
      currentSlot = invalidSection ? invalidSection.getAttribute("data-flux-quick-panel") : currentSlot;
    }

    root.classList.add("is-enhanced");
    updateVisibleSlots();

    var form = root.closest("form");
    if (form) {
      form.addEventListener("reset", function () {
        window.setTimeout(function () {
          slots.forEach(function (slot) {
            visualUpdaters[slot].source();
            visualUpdaters[slot].icon();
            updateSourceFields(slot);
            updateTargetHint(slot);
            updatePreview(slot);
          });
          currentSlot = "slot1";
          updateVisibleSlots();
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
