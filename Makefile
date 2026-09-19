include $(TOPDIR)/rules.mk

LUCI_TITLE:=Flux responsive LuCI theme
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-theme-flux
PKG_VERSION:=0.1.0-rc1
PKG_RELEASE:=5
PKG_LICENSE:=MIT

define Build/Compile
	@if [ ! -s "$(PKG_BUILD_DIR)/htdocs/luci-static/flux/cascade.css" ]; then \
		echo "ERROR: cascade.css is missing. Run 'pnpm install --frozen-lockfile && pnpm build:css' before copying this package into the OpenWrt buildroot." >&2; \
		exit 1; \
	fi
endef

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
