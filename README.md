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
  src/styles/
    main.scss
    _compatibility.scss
  htdocs/luci-static/flux/
    cascade.css (generated)
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

Install the pinned frontend dependencies and generate the production stylesheet
before invoking OpenWrt tooling:

```sh
pnpm install --frozen-lockfile
pnpm build:css
pnpm check:css
```

`cascade.css` is a generated artifact and is intentionally not tracked. A direct
OpenWrt buildroot build fails with an actionable error when this file has not
been generated first.

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

Theme source lives in `src/styles`. Tailwind utilities are available for markup
owned by Flux, while semantic SCSS selectors remain the compatibility layer for
LuCI-generated and third-party markup. The build emits the single stylesheet
expected by LuCI at `htdocs/luci-static/flux/cascade.css`.

Default appearance values are centralized in
`htdocs/luci-static/flux/constants.json`. Change the primary color, light/dark
palette, or glass opacity there, then run `pnpm build:css`. Lua templates, the
settings form, UCI initialization, local-proxy compatibility, generated Logo,
and generated CSS all consume the same constants. Values listed in
`legacyPrimary` are treated as
old defaults rather than user customization, without writing back to UCI.

## Local router proxy

Install the pinned development dependencies and start Vite:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:8094/cgi-bin/luci/`. LuCI pages and APIs are proxied to
`http://192.168.17.1`, while requests under `/luci-static/flux/` use files from
the local `htdocs/luci-static/flux/` directory with caching disabled. Requests
for `cascade.css`, including cache-busting query strings, are compiled directly
from SCSS through Tailwind and Autoprefixer.

The same server can be used as an HTTP forward proxy for `192.168.17.1` and
`192.168.6.1`. Forwarded page and API requests keep their original router host,
while Flux assets are replaced by the local source. This allows one browser
proxy profile to debug either router without changing the router URL.

Use another router or port when needed:

```sh
ROUTER_TARGET=http://192.168.6.1 PORT=8095 pnpm dev
```

Override the forward-proxy allowlist with a comma-separated list when needed:

```sh
ROUTER_TARGETS=192.168.17.1,192.168.6.1,192.168.1.1 pnpm dev
```

Use `ROUTER_TARGETS='*'` only on a trusted development network to remove the
host allowlist entirely.

The templates in `luasrc/view/themes/flux` target the classic LuCI template layout used by many OpenWrt releases. If you target a newer LuCI tree that requires ucode templates, port these templates into the matching `ucode/template/themes/flux` location.
