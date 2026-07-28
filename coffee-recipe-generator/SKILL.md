---
name: coffee-recipe-generator
description: Storage-optional, harness-agnostic specialty coffee workflow for bag analysis, concise brewer and coffee guidance, recipe generation, recipe adaptation, and primary-source brewing research.
metadata:
  version: "2.0.0"
  author: Portable Skill Template
  tags: Coffee, Brewing, Barista, Research, Portable
  recipe_generation_parameters:
    - name: brew_method
      label: Brewing method
      required: true
      prompt: "What brewing method do you want to use?"
    - name: coffee_dose_grams
      label: Coffee dose in grams
      required: true
      prompt: "How many grams of coffee will you be using for this recipe?"
    - name: flavor_intent
      label: Flavor intent
      required: true
      prompt: "What flavor direction do you want: clarity, balanced, sweetness, body, or forgiveness?"
    - name: v60_recipe_style
      label: V60 recipe style
      required: when brew_method is V60
      prompt: "For V60, do you want a classic recipe or Tetsu Kasuya's 4:6 method?"
---

# Specialty Coffee Core

## Compatibility

This skill is designed to work across different agent harnesses and note systems.
- It does not require Obsidian.
- It does not require any specific agent tool API.
- It must remain functional when no persistent storage is configured.
- Storage, if available, is an optional enhancement for loading and saving profiles, recipes, and research.

When adapting this skill to a specific system, map workflow steps by capability:
- image extraction / OCR
- web extraction / browser access
- file read / write
- optional profile-store lookup

For portability rules, load `references/portability-and-storage.md`.

## When to Use

Load this skill when the user:
- shares a photo of a coffee bag or label
- asks a concise coffee question, requests a brewer recommendation, or compares brewing methods
- asks to create, generate, or adjust a brewing recipe
- asks to adapt an existing recipe to a different bean, brewer, or equipment version
- wants to research brewing science, equipment, or competition techniques
- may want to save coffee profiles or recipes to an optional storage destination

## Required Inputs

| Workflow | Required Inputs |
|----------|----------------|
| Bag Analysis | Image of the coffee bag/label |
| Quick Coffee Guidance | User's question plus any bean or equipment context already available |
| Recipe Generation | Brew method, coffee dose (g), origin, processing method, flavor intent: clarity, balanced, sweetness, body, or forgiveness; for V60 only, recipe style: classic or 4:6 |
| Recipe Adaptation | Base recipe, target bean profile OR target brewer/equipment version, flavor intent: clarity, balanced, sweetness, body, or forgiveness |
| Research | Topic or question |

Optional adjustments: roast level, strength preference, equipment available.

## Intent Routing

Classify the request before selecting a workflow:

1. Use Quick Coffee Guidance when the user asks a question, requests a recommendation or comparison, or uses language such as “best,” “better,” “which,” “why,” “what brewer,” “what method,” or “suits this coffee.” Answer directly from the available context. Do not gather recipe-generation inputs or fill the recipe template.
2. Use Recipe Generation only when the user explicitly requests a recipe, asks to generate/create one, requests a dial-in, or asks for a full brew plan, brew guide, brewing instructions, or step-by-step brew.
3. Use Recipe Adaptation only when the user explicitly asks to change an existing recipe for another bean or brewer.
4. When intent is ambiguous, give the concise guidance first and offer to generate a full recipe. Do not generate the recipe until the user opts in.

The presence of bean details, processing terms, a brewer name, or an existing profile does not by itself imply recipe intent.

---

## Workflow A: Bag Analysis

1. Extract text from the coffee bag image using the available image/OCR capability. Request: Brand, Variety, Processing method, Farm/Producer, Origin, Elevation, Roast level, Tasting notes (both languages), Roast date.
2. Normalize the result: standardize processing terms, convert elevation to `msnm`, preserve bilingual tasting notes, classify acidity/sweetness balance.
3. Build the profile with `templates/coffee-profile.md`. Generate a safe filename: `{Brand} - {Variety} {Process} - {Farm or Origin}.md`.
4. If a destination is configured or explicitly requested, save the profile to the user's profile store. Otherwise, return the completed profile inline as markdown.
5. Confirm what was extracted, what was missing, and whether the result was saved or returned inline.

Pitfalls:
- Ask for a clearer photo if critical fields are unreadable.
- Do not guess a missing processing method.
- If no image is available yet, explain that you will fill `templates/coffee-profile.md` and either save it or return it inline once the image is received.

---

## Workflow B: Recipe Generation

1. Enter this workflow only after Intent Routing identifies an explicit recipe request. Check for an existing bean profile using this source order: current conversation inputs → attached file/note → configured profile store (if any). If none exist, ask for missing bean details.
2. Gather required recipe inputs before generating: brew method, coffee dose in grams, origin, processing method, and flavor intent. Flavor intent must be one of: clarity, balanced, sweetness, body, or forgiveness. If brew method is missing, ask: “What brewing method do you want to use?” If coffee dose is missing, ask: “How many grams of coffee will you be using for this recipe?” If flavor intent is missing, ask: “What flavor direction do you want: clarity, balanced, sweetness, body, or forgiveness?” If the brew method is V60 or Hario V60 and the recipe style is missing, ask: “For V60, do you want a classic recipe or Tetsu Kasuya's 4:6 method?” If multiple required inputs are missing, ask for them in the same message. Do not assume or default the brew method, coffee dose, flavor intent, or V60 recipe style. Origin and processing method are non-negotiable. Do not require a grinder model before generating a recipe, because grinder settings are always produced for the full grinder set below.
3. Load `references/brew-method-defaults.md` for the method base. For V60 with classic recipe style, use the V60 base from that file. For V60 with 4:6 recipe style, also load `references/four-six-method.md` and use its ratio, coarse-grind bias, drain-timed pours, roast-level temperature guidance, and 3:30-4:00 maximum brew-time guardrail unless bean-specific origin, process, or roast guidance requires a small adjustment.
4. Load `references/grind-determinants.md` and `references/grinder-settings.md`. Apply the five-determinant stack: method base → processing → origin/altitude → roast → variety.
5. Always include exact settings for every grinder in `references/grinder-settings.md` in one markdown table: 1Zpresso K-Ultra, 1Zpresso Q Air, Baratza Encore ESP, Fellow Opus, and Timemore C2. This is required even when the user mentions only one grinder, does not specify a grinder, or asks for a quick recipe.
6. Load `references/origin-processing-guide.md` and adjust temperature for origin, process, and roast.
7. Fill `templates/recipe-output.md`. For V60 recipes, state the selected recipe style in the Overview as either `Classic V60` or `Tetsu Kasuya 4:6 Method`. For every pour, including the bloom, specify a numeric pour speed as a single value or range in grams per second (`g/s`). Include it in both the Brew Timeline row and the corresponding Brewing Step; never use only a qualitative label such as slow, medium, or fast.
8. Mandatory output sections, in this order:
   - Coffee Details
   - Overview
   - Flavor Profile
   - Brew Timeline
   - Brewing Steps
   - Dialing In Your Cup
9. Before returning the recipe, verify the Overview contains a grinder table with exactly these five rows: 1Zpresso K-Ultra, 1Zpresso Q Air, Baratza Encore ESP, Fellow Opus, Timemore C2.
10. Verify every bloom and pour has a numeric `g/s` pour speed in both the Brew Timeline and Brewing Steps. Non-pouring actions such as drawdown may use `—` in the timeline's Pour Speed column.
11. Verify the selected flavor intent appears in the Overview and is reflected in the Flavor Profile and Dialing In Your Cup guidance.
12. Offer pairing context when useful by consulting `references/brew-method-pairings.md` or `references/equipment-profiles.md`.
13. For V60 with 4:6 recipe style, build the Brew Timeline and Brewing Steps from `references/four-six-method.md`:
    - Scale water proportionally from the user's coffee dose using a 1:15 ratio unless the user requested a different strength.
    - Split total water into first 40% and final 60%.
    - Use the user's flavor intent to tune the first two pours: sweetness = smaller first pour/larger second pour, clarity = larger first pour/smaller second pour, balanced/body/forgiveness = equal first and second pours unless the bean profile strongly suggests otherwise.
    - Use the user's strength preference if supplied to tune the final 60%: refreshing/lighter = 2 pours, balanced/default = 3 pours, rich/strong/body = 3 pours with a slightly finer/coarser grind decision based on drawdown target rather than adding extra water. If no strength preference is supplied, use 3 pours.
    - Emphasize the method's rule that each next pour starts only when the slurry has almost completely drained; clock times are references, not fixed commands.
    - Include troubleshooting for drain timing: under 3:00 means grind finer; over 3:30-4:00 means grind coarser.
14. Remind the user this is a starting recipe and offer to refine after brewing.

Pitfalls:
- Never omit any of the five grinder rows from generated or adapted recipes.
- Never rely on generic grind descriptions alone; generic descriptors may appear only as a secondary label after the exact grinder table.
- Never omit the numeric `g/s` speed from a bloom or pour, and never substitute `ml/s` or a qualitative speed label without a numeric `g/s` value.
- Never assume a default brew method, coffee dose, flavor intent, or V60 recipe style; ask the user when any are missing from the initial prompt.
- Never generate a V60 recipe without first resolving whether it should be classic or 4:6.
- Never fail recipe generation just because no profile store exists.

---

## Workflow C: Primary-Source Research

1. Skip general search engines when they are unreliable in the current harness.
2. Navigate directly to relevant domains from `references/coffee-research-sources.md`.
3. Extract the source text using whatever web/browser capability the harness provides.
4. Synthesize the result into structured markdown with these sections:
   - Summary
   - Key Mechanisms
   - Practical Effects / Comparison Table
   - Expert Techniques
   - Sources (exact URLs)
   - Action Items
5. Validate that all six sections are present.
6. Save the research only if a destination is configured or requested; otherwise return it inline.

Pitfalls:
- When primary blogs are blocked, look for open-source calculators or recipe implementations that preserve the original parameters.
- Include exact URLs in the Sources section.

---

## Workflow D: Recipe Adaptation

1. Read the base recipe and any available bean profile.
2. Gather the required flavor intent before adapting. Flavor intent must be one of: clarity, balanced, sweetness, body, or forgiveness. If missing, ask: “What flavor direction should the adapted recipe target: clarity, balanced, sweetness, body, or forgiveness?”
3. Identify what changed:
   - bean swap
   - brewer swap
   - attachment/filter swap
4. Apply adaptation rules from `references/brewer-version-adaptation.md`.
5. Rebuild the recipe using `templates/recipe-output.md` and include a clear “Changes from Base” section.
6. Include the full five-grinder table required by Workflow B, recalculated for the adapted recipe rather than copied blindly from the base recipe.
7. Verify every bloom and pour has a numeric `g/s` pour speed in both the Brew Timeline and Brewing Steps.
8. Verify the selected flavor intent appears in the Overview and is reflected in the Flavor Profile and Dialing In Your Cup guidance.
9. Set expectations honestly when a bean cannot reproduce the same style as another.
10. Save only if a destination is configured or requested; otherwise return the adapted recipe inline.

Pitfalls:
- Do not blindly copy numbers from one bean to another.
- Do not ignore process, variety, or brewer geometry differences.

---

## Workflow E: Quick Coffee Guidance

1. Use the bean profile and equipment context already present in the conversation. Ask a clarifying question only when the missing detail would materially change the recommendation.
2. For brewer or method recommendations, load `references/brew-method-pairings.md` and consult `references/equipment-profiles.md` when the user's equipment is known.
3. Lead with the direct answer. Keep a quick request to one short paragraph or up to three concise bullets; include the main reason and, when useful, one alternative with its tradeoff.
4. Do not include recipe sections, dose, ratio, grinder table, timeline, pouring steps, or troubleshooting unless the user explicitly asks for a recipe.
5. Optionally end with one sentence offering to generate a full recipe for the recommended brewer. Do not mention, enumerate, or solicit recipe inputs in that initial offer; gather them only after the user opts in.

Pitfalls:
- Do not interpret a brewer name, origin, process, variety, roast, or flavor note as permission to generate a recipe.
- Do not ask for coffee dose, flavor intent, or V60 recipe style when answering a recommendation or general coffee question.
- Do not turn the optional recipe offer into an input request. “I can generate a full recipe if you want” is sufficient.
- Do not pad a simple answer with the recipe template.

---

## References Index

| File | Workflow Step | Purpose |
|------|---------------|---------|
| `references/portability-and-storage.md` | Cross-cutting | Portability pattern for non-Obsidian and runtime-agnostic environments |
| `references/brew-method-defaults.md` | B-3, D-3 | Base parameters per brew method |
| `references/grind-determinants.md` | B-4 | Five-determinant grind calculation |
| `references/grinder-settings.md` | B-4 | Exact grinder settings for K-Ultra, Q Air, Encore ESP, Fellow Opus, Timemore C2 |
| `references/origin-processing-guide.md` | B-6 | Origin, variety, and roast temp guidance |
| `references/brew-method-pairings.md` | B-12, E-2 | Matching coffee profile to brew method |
| `references/equipment-profiles.md` | B-12, E-2 | Personal brewer design notes and pairings |
| `references/troubleshooting.md` | B-8 / standalone | Taste preference and diagnosis guidance behind the Dialing In Your Cup section |
| `references/pour-patterns.md` | B-7 | Pour pattern descriptions and speed reference |
| `references/four-six-method.md` | B-3 / B-13 | Tetsu Kasuya 4:6 Method; filename spells out leading numeral by convention |
| `references/coffee-research-sources.md` | C-2 | Primary-source domains and HCG workflow |
| `references/grind-size-extraction-yield.md` | C / standalone | Condensed research: grind size vs extraction yield |
| `references/orea-v4-research.md` | C / standalone | Canonical Orea V4 bottoms, filters, and competition recipes |
| `references/brewer-version-adaptation.md` | D-3 | Adapting recipes between brewer versions |
| `templates/coffee-profile.md` | A-3 | Structured bean profile scaffold |
| `templates/recipe-output.md` | B-7, D-4 | Recipe output scaffold |
