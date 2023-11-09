# suid (vendor package)

This is a module to build, and then to re-export, the [`@suid/*`](https://suid.io/) packages. This is a workaround (hopefully temporary!) for tooling issues with Vite and Vitest. The primary remaining issue is that SUID imports cause test runs to hang indefinitely under certain circumstances (most recently, in Chromium and Firefox). The nature of the workaround is to compile SUID's packaged `.jsx` files as compiled JavaScript (with `solid-js` and `solid-js/web` imports externalized, not bundled).

This has been pretty quickly thrown together, and it is definitely incomplete. If the workaround remains necessary, we may need to expand beyond the currently built packages. And we will definitely need to be cautious about some of the assumptions made about types.
