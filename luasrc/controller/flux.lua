module("luci.controller.flux", package.seeall)

function index()
  entry({"admin", "system", "flux"}, cbi("flux"), _("Flux Theme"), 90).dependent = true
end
