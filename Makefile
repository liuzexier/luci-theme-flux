include $(TOPDIR)/rules.mk

LUCI_TITLE:=Flux responsive LuCI theme
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_NAME:=luci-theme-flux
PKG_VERSION:=0.1.0
PKG_RELEASE:=16
PKG_LICENSE:=MIT

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
