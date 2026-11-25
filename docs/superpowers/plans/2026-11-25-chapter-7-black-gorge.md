# Chapter 7 Black Gorge Implementation Plan

1. Import and normalize the supplied map, obstacles, miniboss portraits, and Black Wizard portrait.
2. Add the seventh campaign region with four boss-only nodes and dynamic progress counts.
3. Add rooms 48-51, the `blackgorge` visual theme, and eight fixed 2x2 obstacle layouts.
4. Add the four boss state machines and their telegraph, projectile, hazard, invulnerability, and phase behaviors.
5. Connect skill cores, level transitions, final victory copy, HUD status, and asset cache keys.
6. Add focused API diagnostics for the new mechanics.
7. Run static checks, serve the game, inspect the campaign map and all four rooms in Playwright, then verify prior chapter entry still works.
