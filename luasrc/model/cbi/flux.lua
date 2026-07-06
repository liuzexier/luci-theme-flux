local m = Map("flux", translate("Flux 主题设置"), translate("配置 Flux 主题的外观。"))

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
primary.default = "#0f766e"
primary.placeholder = "#0f766e"
primary.datatype = "string"
primary.rmempty = false

local bg_light = appearance:option(Value, "background_light", translate("亮色背景"))
bg_light.default = "#f7f8fb"
bg_light.placeholder = "#f7f8fb"
bg_light.datatype = "string"
bg_light.rmempty = false

local bg_dark = appearance:option(Value, "background_dark", translate("暗色背景"))
bg_dark.default = "#101418"
bg_dark.placeholder = "#101418"
bg_dark.datatype = "string"
bg_dark.rmempty = false

local glass = appearance:option(ListValue, "glass_opacity", translate("玻璃透明度"))
glass:value("0.95", translate("不透明"))
glass:value("0.82", translate("轻微透明"))
glass:value("0.72", translate("均衡"))
glass:value("0.58", translate("清透"))
glass:value("0.42", translate("高透明"))
glass.default = "0.72"
glass.rmempty = false

return m
