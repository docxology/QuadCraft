# Trusted live JavaScript evaluation: capabilities and safety limits

[Development index](README.md) · [Brush source editing](paintbrush_system.md) · [JavaScript runtime map](javascript_implementation.md)

## What the page actually does

[`src/browser/index.html`](../../src/browser/index.html) includes a textarea `textBoxToEval` and an inline button handler that reads its value, logs it, calls **`eval(jsCode)`**, then logs the return value. Related historical `QuadrayGrid*.html` pages have their own versions.

This is a local debugging/live-coding convenience. There is no syntax-highlighting `CodeEditor`, vetted execution context, worker timeout, memory quota, rollback, code-history/version manager or live-module reload system. Earlier editor/sandbox examples were design sketches, not an API to instantiate.

## Trust boundary

Evaluated code runs with the page's JavaScript privileges. It can alter reachable world/camera state, access the DOM and localStorage, use available network APIs or block the main thread. A syntax/runtime error is visible in the browser console; the button does not establish a transactional error boundary or undo changes made before the error.

Only evaluate code you have inspected and trust. Do not present downloaded snippets, shared brush strings or multiplayer messages as safe to execute. A proposed allowlist or `new Function` wrapper would not by itself isolate JavaScript. Browser sandboxing of a web page is not isolation between evaluated code and the page that invokes it.

## State and input integration

The page's keyboard handler avoids applying game controls while the textarea is the event target. `StateMap()` includes the editor text as part of the experiment's save payload. Saving text does not imply that it is validated or automatically evaluated on load; inspect the selected snapshot's loader before making such a claim.

Live code may call page-local geometry/brush functions, but those globals are not a stable SDK. The [runtime map](javascript_implementation.md) distinguishes local `Q`/`Quadray` helpers from portfolio modules and native C++ interfaces.

## Safer source-level workflow

For repeatable changes, edit the existing brush table or implementation file, keep a saved scene backup, reload the selected entry point and examine console/resource errors. [Source customization](modding_guide.md) identifies real extension points. This does not require or imply a plugin loader.

## Conceptual isolation requirements

An untrusted editor would require a deliberately designed restricted message/data interface and an isolation mechanism with enforceable termination and resource controls. Decide what geometry mutations are allowed and how partial failures are reverted before claiming a safe runtime. No such system is documented as implemented here.
