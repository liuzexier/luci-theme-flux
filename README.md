# luci-theme-flux

`luci-theme-flux` is a mobile-first LuCI theme for OpenWrt. It keeps the classic LuCI layout familiar on desktop, then turns navigation, tables, and forms into touch-friendly surfaces on phones.

## Features

- Responsive shell for desktop, tablet, and mobile LuCI pages.
- Mobile bottom submenu popovers with keyboard escape support.
- Persistent four-item mobile bottom navigation hidden on desktop widths.
- Larger touch targets for forms, tabs, buttons, and table actions.
- Safer table behavior on narrow screens with horizontal scrolling.
- Light/dark color support through `prefers-color-scheme`.
- Minimal JavaScript that only controls theme-level interactions.

## Package Layout

```text
luci-theme-flux/
  Makefile
  htdocs/luci-static/flux/
    cascade.css
    mobile.js
    logo.svg
  luasrc/
    controller/flux.lua
    model/cbi/flux.lua
    view/themes/flux/
      header.htm
      footer.htm
  root/etc/config/flux
```

## Preview

A static preview page is available for local theme work:

```text
preview/index.html
```

When a static server is running from this repository root, open:

```text
http://127.0.0.1:8081/preview/
```

## Build

This repository includes a Linux build helper that downloads the matching OpenWrt SDK and builds both default targets:

```sh
scripts/build-ipk.sh
```

By default it builds:

```text
x86/64
mediatek/filogic
```

Generated packages are copied to:

```text
dist/x86-64/
dist/mediatek-filogic/
```

The script defaults to OpenWrt `24.10.7`, which still produces `.ipk` packages. Override it with:

```sh
OPENWRT_VERSION=24.10.7 scripts/build-ipk.sh
```

This script must run on Linux because OpenWrt SDK archives are Linux x86_64 toolchains. On macOS, use the included GitHub Actions workflow:

```text
.github/workflows/build-ipk.yml
```

Install a generated package on the router:

```sh
opkg install luci-theme-flux_*.ipk
```

Then select the theme in LuCI:

```text
System -> System -> Language and Style -> Design
```

Open the Flux menu page:

```text
System -> Flux Theme
```

The fourth bottom entry is `All` and opens the standalone Flux theme page under the LuCI System menu. That page lists all first-level LuCI menus, with expandable second-level links.

## Development Notes

Most of the theme behavior lives in `htdocs/luci-static/flux/cascade.css`. The JavaScript in `mobile.js` intentionally stays small and only toggles the mobile drawer state.

The templates in `luasrc/view/themes/flux` target the classic LuCI template layout used by many OpenWrt releases. If you target a newer LuCI tree that requires ucode templates, port these templates into the matching `ucode/template/themes/flux` location.
