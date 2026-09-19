local fs = require "nixio.fs"
local dispatcher = require "luci.dispatcher"
local jsonc = require "luci.jsonc"

local m = Map("flux", translate("Flux 主题设置"), translate("配置 Flux 主题的外观和底部快捷入口。"))
local constants_path = (dispatcher.context.docroot or "/www") .. "/luci-static/flux/constants.json"
local constants = jsonc.parse(fs.readfile(constants_path) or "") or {}
local appearance_defaults = constants.appearance or {}
local light_defaults = appearance_defaults.light or {}
local dark_defaults = appearance_defaults.dark or {}
local menu_root = dispatcher.menu_json() or {}
local admin_tree = menu_root.children and menu_root.children.admin or menu_root
local menu_choices = {}
local menu_titles = {}
local branch_paths = {}
local icon_choices = {
  { "home", translate("Home") },
  { "services", translate("服务") },
  { "network", translate("网络") },
  { "status", translate("状态") },
  { "system", translate("系统") },
  { "wifi", translate("Wi-Fi") },
  { "vpn", translate("VPN") },
  { "terminal", translate("终端") },
  { "storage", translate("存储") },
  { "settings", translate("设置") },
  { "all", translate("全部") }
}
local valid_icons = {}

local function is_legacy_primary(value)
  value = tostring(value or ""):lower()

  for _, legacy in ipairs(appearance_defaults.legacyPrimary or {}) do
    if value == tostring(legacy):lower() then
      return true
    end
  end

  return false
end

for _, icon in ipairs(icon_choices) do
  valid_icons[icon[1]] = true
end

local function uci_section_exists(config, section)
  local ok, value = pcall(function()
    return m.uci:get_all(config, section)
  end)

  return ok and value ~= nil
end

local function uci_type_exists(config, section_type)
  local found = false

  pcall(function()
    m.uci:foreach(config, section_type, function()
      found = true
      return false
    end)
  end)

  return found
end

local function depends_satisfied(node)
  local depends = node and node.depends

  if type(depends) ~= "table" then
    return true
  end

  if type(depends.fs) == "table" then
    for path, mode in pairs(depends.fs) do
      if mode == "executable" then
        if not fs.access(path, "x") then
          return false
        end
      elseif not fs.access(path) then
        return false
      end
    end
  end

  if type(depends.uci) == "table" then
    for config, rule in pairs(depends.uci) do
      if type(rule) == "table" then
        for section, _ in pairs(rule) do
          if tostring(section):sub(1, 1) == "@" then
            if not uci_type_exists(config, tostring(section):sub(2)) then
              return false
            end
          elseif not uci_section_exists(config, section) then
            return false
          end
        end
      end
    end
  end

  return true
end

local function sorted_children(node)
  local children = {}

  if not node or type(node.children) ~= "table" then
    return children
  end

  for name, child in pairs(node.children) do
    if child and child.title and child.satisfied ~= false and depends_satisfied(child) then
      children[#children + 1] = { name = name, node = child }
    end
  end

  table.sort(children, function(a, b)
    local ao = tonumber(a.node.order or 1000)
    local bo = tonumber(b.node.order or 1000)

    if ao == bo then
      return tostring(a.node.title) < tostring(b.node.title)
    end

    return ao < bo
  end)

  return children
end

local function is_page_alias(node)
  return node and type(node.action) == "table" and node.action.type == "alias"
end

local function collect_menu_choices(node, prefix, parent_titles)
  for _, child in ipairs(sorted_children(node)) do
    local item = child.node
    local path = prefix .. "/" .. child.name

    if path ~= "admin/logout" then
      local title = tostring(translate(item.title))
      local titles = {}

      for _, parent_title in ipairs(parent_titles) do
        titles[#titles + 1] = parent_title
      end

      titles[#titles + 1] = title
      menu_choices[#menu_choices + 1] = {
        path = path,
        label = table.concat(titles, " / "),
        title = title
      }
      menu_titles[path] = title

      local children = sorted_children(item)

      if #children > 0 then
        if not is_page_alias(item) then
          branch_paths[#branch_paths + 1] = path
        end

        collect_menu_choices(item, path, titles)
      end
    end
  end
end

collect_menu_choices(admin_tree, "admin", {})

local appearance = m:section(NamedSection, "theme", "appearance", translate("外观"))
appearance.addremove = false
appearance.anonymous = true

local mode = appearance:option(ListValue, "mode", translate("颜色模式"))
mode:value("auto", translate("跟随系统"))
mode:value("light", translate("亮色"))
mode:value("dark", translate("暗色"))
mode.default = "auto"
mode.rmempty = false

local primary = appearance:option(Value, "primary_color", translate("主色调"))
primary.default = appearance_defaults.primary
primary.placeholder = primary.default
primary.datatype = "string"
primary.rmempty = false
function primary.cfgvalue(self, section)
  local value = Value.cfgvalue(self, section)
  return is_legacy_primary(value) and self.default or value
end

local bg_light = appearance:option(Value, "background_light", translate("亮色背景"))
bg_light.default = light_defaults.background
bg_light.placeholder = bg_light.default
bg_light.datatype = "string"
bg_light.rmempty = false

local bg_dark = appearance:option(Value, "background_dark", translate("暗色背景"))
bg_dark.default = dark_defaults.background
bg_dark.placeholder = bg_dark.default
bg_dark.datatype = "string"
bg_dark.rmempty = false

local tab_count = appearance:option(ListValue, "tab_count", translate("快捷入口数量"))
for count = 1, 5 do
  tab_count:value(tostring(count), tostring(count))
end
tab_count.default = "4"
tab_count.rmempty = false

function tab_count.cfgvalue(self, section)
  local value = tonumber(self.map.uci:get("flux", section, self.option))

  if not value or value < 1 or value > 5 then
    return "4"
  end

  return tostring(math.floor(value))
end

local quick_tabs = m:section(SimpleSection)
quick_tabs.template = "flux/quick_tabs"
quick_tabs.branch_paths = branch_paths

local function add_slot(section_name, title, defaults)
  local slot = m:section(NamedSection, section_name, "menu", title)
  slot.addremove = false
  slot.anonymous = true

  local source = slot:option(ListValue, "source", translate("入口类型"))
  source:value("menu", translate("菜单"))
  source:value("custom", translate("自定义路径"))
  source.default = defaults.source
  source.rmempty = false

  function source.cfgvalue(self, section)
    local value = self.map.uci:get("flux", section, self.option)

    if value == "custom" or value == "menu" then
      return value
    end

    return defaults.source
  end

  local menu_path = slot:option(ListValue, "menu_path", translate("菜单目标"))

  for _, choice in ipairs(menu_choices) do
    menu_path:value(choice.path, choice.label)
  end

  menu_path.default = defaults.menu_path
  menu_path.rmempty = false

  function menu_path.cfgvalue(self, section)
    local value = self.map.uci:get("flux", section, self.option)
    local legacy_path = self.map.uci:get("flux", section, "path")

    if value and value ~= "" then
      return value
    end

    if legacy_path and (legacy_path == "admin" or legacy_path:match("^admin/")) then
      return legacy_path
    end

    return defaults.menu_path
  end

  local custom_path = slot:option(Value, "custom_path", translate("页面路径"))
  custom_path.placeholder = "/cgi-bin/luci/admin/..."
  custom_path.description = translate("仅支持 admin/... 或以 / 开头的站内路径。")
  custom_path.default = defaults.custom_path
  custom_path.rmempty = true

  function custom_path.cfgvalue(self, section)
    local value = self.map.uci:get("flux", section, self.option)
    local legacy_path = self.map.uci:get("flux", section, "path")

    if value and value ~= "" then
      return value
    end

    if source:cfgvalue(section) == "custom" and legacy_path and legacy_path ~= "" then
      return legacy_path
    end

    return defaults.custom_path
  end

  function custom_path.validate(self, value, section)
    local selected_source = source:formvalue(section) or source:cfgvalue(section)

    if selected_source ~= "custom" then
      return value
    end

    value = tostring(value or ""):match("^%s*(.-)%s*$")

    if value == "" then
      return nil, translate("自定义路径不能为空。")
    end

    if value:sub(1, 2) == "//" or value:match("^%a[%w+.-]*:") then
      return nil, translate("仅支持当前 OpenWrt 的站内路径。")
    end

    if value:sub(1, 1) == "/" or value == "admin" or value:match("^admin/[%w%._~%-%/]+$") then
      return value
    end

    return nil, translate("请输入 admin/... 或以 / 开头的站内路径。")
  end

  local label = slot:option(Value, "label", translate("显示名称"))
  label.default = defaults.label
  label.placeholder = defaults.label
  label.rmempty = false

  function label.cfgvalue(self, section)
    local value = self.map.uci:get("flux", section, self.option)

    if value and value ~= "" then
      return value
    end

    local path = menu_path:cfgvalue(section)
    return menu_titles[path] or defaults.label
  end

  local icon = slot:option(ListValue, "icon", translate("图标"))

  for _, choice in ipairs(icon_choices) do
    icon:value(choice[1], choice[2])
  end

  icon.default = defaults.icon
  icon.rmempty = false

  function icon.cfgvalue(self, section)
    local value = self.map.uci:get("flux", section, self.option)
    return valid_icons[value] and value or defaults.icon
  end
end

add_slot("slot1", translate("Tab1"), {
  label = translate("Home"),
  icon = "home",
  source = "custom",
  menu_path = "admin/quickstart",
  custom_path = "/"
})

add_slot("slot2", translate("Tab2"), {
  label = translate("服务"),
  icon = "services",
  source = "menu",
  menu_path = "admin/services",
  custom_path = "/"
})

add_slot("slot3", translate("Tab3"), {
  label = translate("网络"),
  icon = "network",
  source = "menu",
  menu_path = "admin/network",
  custom_path = "/"
})

add_slot("slot4", translate("Tab4"), {
  label = translate("系统"),
  icon = "system",
  source = "menu",
  menu_path = "admin/system",
  custom_path = "/"
})

add_slot("slot5", translate("Tab5"), {
  label = translate("状态"),
  icon = "status",
  source = "menu",
  menu_path = "admin/status",
  custom_path = "/"
})

return m
