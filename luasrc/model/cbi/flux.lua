local m = Map("flux", translate("All"), translate("Browse LuCI menus from the Flux mobile theme page."))

local directory = m:section(SimpleSection, translate("All menus"), translate("Expand a first-level menu, then choose a second-level page to navigate."))
directory.template = "flux/menu_tree"

return m
