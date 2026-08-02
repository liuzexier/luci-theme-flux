module("luci.controller.flux", package.seeall)

function index()
  entry({"admin", "system", "flux"}, cbi("flux"), _("Flux 主题设置"), 90).dependent = true
  entry({"admin", "system", "flux-menu"}, template("flux/menu_page")).leaf = true
end
