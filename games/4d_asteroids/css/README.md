# Asteroids presentation styles — page layout and HUD

[style.css](style.css) is linked by the [Asteroids entrypoint](../index.html) after the shared `hud-style.css`. It defines the dark/cyan palette, header, wrapping game/sidebar layout, canvas border, panels, buttons, geometry readouts and HUD bar. This is presentation CSS; simulation, entity projection and input live in [the JavaScript modules](../js/README.md).

Keep selectors aligned with actual page markup and shared-cascade order. Font loading is external (`fonts.googleapis.com`); the CSS supplies local fallbacks. No build pipeline or generated stylesheet is involved.
