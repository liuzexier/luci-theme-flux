local m = Map("flux", translate("Flux Theme"), translate("Tune Flux appearance and browse LuCI menus."))

local appearance = m:section(NamedSection, "theme", "appearance", translate("Appearance"))
appearance.addremove = false
appearance.anonymous = true

local mode = appearance:option(ListValue, "mode", translate("Color mode"))
mode:value("auto", translate("Follow system"))
mode:value("light", translate("Light"))
mode:value("dark", translate("Dark"))
mode.default = "auto"
mode.rmempty = false

local primary = appearance:option(Value, "primary_color", translate("Primary color"))
primary.default = "#0f766e"
primary.placeholder = "#0f766e"
primary.datatype = "string"
primary.rmempty = false

local bg_light = appearance:option(Value, "background_light", translate("Light background"))
bg_light.default = "#f7f8fb"
bg_light.placeholder = "#f7f8fb"
bg_light.datatype = "string"
bg_light.rmempty = false

local bg_dark = appearance:option(Value, "background_dark", translate("Dark background"))
bg_dark.default = "#101418"
bg_dark.placeholder = "#101418"
bg_dark.datatype = "string"
bg_dark.rmempty = false

local glass = appearance:option(ListValue, "glass_opacity", translate("Glass opacity"))
glass:value("0.95", translate("Solid"))
glass:value("0.82", translate("Subtle"))
glass:value("0.72", translate("Balanced"))
glass:value("0.58", translate("Clear"))
glass:value("0.42", translate("Transparent"))
glass.default = "0.72"
glass.rmempty = false

local directory = m:section(SimpleSection, translate("All menus"), translate("Expand a first-level menu, then choose a second-level page to navigate."))
directory.template = "flux/menu_tree"

return m
