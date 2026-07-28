# Recipe Output Template

Use this as the scaffold for every generated recipe. Fill in all placeholders with values calculated from the brew-method defaults, grind-determinant framework, and origin/processing guidance.

## Placeholder Legend

- `{{BREW_METHOD}}` — User's chosen brew method
- `{{RECIPE_STYLE}}` — For V60 only: Classic V60 or Tetsu Kasuya 4:6 Method
- `{{COFFEE_ORIGIN}}` — Country/Region
- `{{PROCESSING}}` — Washed / Natural / Honey
- `{{VARIETY}}` — If known
- `{{ROAST_LEVEL}}` — Light / Medium / Medium-Dark
- `{{FLAVOR_INTENT}}` — Required user intent: clarity / balanced / sweetness / body / forgiveness
- `{{COFFEE_DOSE}}` — Grams of coffee
- `{{WATER_AMOUNT}}` — Total ml of water
- `{{WATER_TEMP}}` — Degrees Celsius
- `{{RATIO}}` — e.g., 1:15
- `{{YIELD}}` — Expected ml yield
- `{{BREW_TIME}}` — Target range, e.g., 2:45-3:15
- `{{GRIND_SETTING}}` — **Mandatory markdown table** with exact settings for all five grinders: 1Zpresso K-Ultra, 1Zpresso Q Air, Baratza Encore ESP, Fellow Opus, and Timemore C2. Include all five rows for every generated or adapted recipe, even when the user names only one grinder or no grinder. See example below.
- `{{TIMELINE_ROWS}}` — Pipe-delimited markdown table rows; every bloom/pour row must have a numeric pour speed in `g/s`
- `{{STEPS}}` — Numbered step blocks; every bloom/pour step must repeat its numeric pour speed in `g/s`
- `{{FLAVOR_NOTES}}` — 2-3 sentence flavor description
- `{{DIALING_IN_ROWS}}` — Pipe-delimited rows for both Dialing In tables (preferences and diagnosis)

## Example Filled Recipe

```
# V60 Recipe for Ethiopia Yirgacheffe Natural Process

## Coffee Details
- **Origin:** Ethiopia Yirgacheffe
- **Processing:** Natural (Dry Process)
- **Variety:** Heirloom
- **Roast Level:** Light
- **Flavor Intent:** Clarity
- **Recipe Style:** Classic V60

## Overview
- **Coffee:** 15g
- **Water:** 255ml at 92°C
- **Ratio:** 1:17
- **Expected Yield:** ~240ml
- **Expected Brew Time:** 2:45 - 3:15
- **Flavor Intent:** Clarity
- **Recipe Style:** Classic V60
- **Grind:** Medium-fine

| Grinder | Setting |
|---------|---------|
| 1Zpresso K-Ultra | 0.6.0 – 0.8.0 (60–80 ticks) |
| 1Zpresso Q Air | 1.2.0 – 2.0.1 |
| Baratza Encore ESP | 16 – 17 |
| Fellow Opus | 4.5 – 5.5 |
| Timemore C2 | 16 – 18 clicks |

## Flavor Profile
A fruit-forward cup with intense blueberry and stone fruit notes, tuned for clarity so the aromatics stay separated rather than heavy. The natural process enhances the coffee's wild, wine-like character. Expect a syrupy body with a clean, bright finish. Perfect for showcasing Ethiopian terroir.

## Brew Timeline
| Time | Action | Total Water | Pour Speed |
|------|--------|-------------|------------|
| 0:00 | Bloom | 30ml | 3-4 g/s |
| 0:45 | First Main Pour | 110ml | 5-6 g/s |
| 1:15 | Second Main Pour | 185ml | 5-6 g/s |
| 1:45 | Final Pour | 255ml | 3-4 g/s |
| 2:45 | Drawdown complete | — | — |

## Brewing Steps

### Step 1: Bloom
- **Time:** 0:00 - 0:45
- **Water:** 30g at 92°C (double the coffee dose)
- **Pour Pattern:** Start at center, slowly spiral outward to edges
- **Pour Speed:** 3-4 g/s (slow)

### Step 2: First Main Pour
- **Time:** 0:45 - 1:15
- **Water:** Add 80g (total 110g)
- **Pour Pattern:** Start center, pour in slow circles expanding to outer edge, maintain water level at 1/3 bed height
- **Pour Speed:** 5-6 g/s (medium)

### Step 3: Second Main Pour
- **Time:** 1:15 - 1:45
- **Water:** Add 75g (total 185g)
- **Pour Pattern:** Slow circles from center outward, maintain level
- **Pour Speed:** 5-6 g/s (medium)

### Step 4: Final Pour
- **Time:** 1:45 - 2:15
- **Water:** Add 70g (total 255g)
- **Pour Pattern:** Gentle spiral pour, finish 2-3cm above bed to avoid air incorporation
- **Pour Speed:** 3-4 g/s (slow)

### Final Drawdown
- **Time:** Target 2:45 - 3:15 total
- **Expected:** All water should pass through by 3:15-3:30

## Dialing In Your Cup

Start here if your brew isn't quite right, or if you just want to push the flavor in a new direction. Change one variable at a time.

| I want it to taste... | Try this |
|-----------------------|----------|
| Brighter, more acidity | Lower temp to 90-91°C, or grind coarser, or stop brew 15s earlier |
| Sweeter, milder | Raise temp to 94-95°C, grind medium, or add 10s to brew time |
| More fruit intensity | Use 91-92°C with a longer bloom |
| Heavier body | Grind coarser, or slow down the final drawdown |
| Cleaner cup | Rinse filter twice, pour slower, or use a thicker filter |

| Something went wrong... | Likely cause | Fix |
|-------------------------|--------------|-----|
| Too sour | Under-extraction | Grind 1-2 clicks finer, raise temp 1-2°C, pour slower |
| Too bitter | Over-extraction | Grind 1-2 clicks coarser, lower temp 1-2°C, pour faster |
| Weak/watery | Low extraction | Grind finer, use 1-2g more coffee, or slow the first pour |
| Muddy/cloudy | Fines or over-agitation | Pour 3-5cm higher, let bed settle between pours |
| Bitter AND sour at once | Uneven extraction | Even out your pour pattern, grind finer |
```

## Rules for Filling the Template

1. **Grind setting:** Always consult `references/grind-determinants.md` first. Never estimate from scratch.
2. **Temp:** Use `references/origin-processing-guide.md` for origin and roast-level temp adjustments.
3. **Brew time:** Use `references/brew-method-defaults.md` as the base, then adjust for processing.
4. **Steps:** Simplify to 3-4 key steps for beginners; add nuance for experts.
5. **Flavor intent:** The recipe must state one selected intent in the Overview: clarity, balanced, sweetness, body, or forgiveness. Reflect that intent in the Flavor Profile and Dialing In Your Cup section.
6. **V60 recipe style:** Every V60 recipe must state the selected style in the Overview: `Classic V60` or `Tetsu Kasuya 4:6 Method`. Do not generate V60 steps until the style has been resolved. For 4:6, use `references/four-six-method.md` for the timeline, scaled pour math, flavor-intent split, drain-timed pacing, and drawdown troubleshooting.
7. **Dialing In:** Include both tables (taste preferences and taste diagnosis) in every recipe.
8. **Grinder callout:** **MANDATORY.** Always include a markdown table with exact settings for all five grinders in `references/grinder-settings.md`: 1Zpresso K-Ultra, 1Zpresso Q Air, Baratza Encore ESP, Fellow Opus, and Timemore C2. Reference `references/grinder-settings.md` for base ranges, then apply the five-determinant adjustments. Never use generic descriptions alone.
9. **Preflight check:** Before finalizing a recipe, confirm the grinder table has exactly five rows and none of the five grinder names are missing. If a method is unsupported by a grinder, keep the row and write `Not supported` plus the closest practical alternative when available.
10. **Pour speed:** Every bloom and pour must include a numeric speed as a single value or range in grams per second (`g/s`) in both its Brew Timeline row and Brewing Step. A qualitative label may follow the numeric rate, but cannot replace it. Use `—` only for non-pouring actions such as drawdown.
