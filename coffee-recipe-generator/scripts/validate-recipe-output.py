#!/usr/bin/env python3
"""Stop-hook validator for generated coffee recipes."""

import json
import re
import sys
from pathlib import Path


REQUIRED_SECTIONS = [
    "Coffee Details",
    "Overview",
    "Flavor Profile",
    "Brew Timeline",
    "Brewing Steps",
    "Troubleshooting Guide",
    "Adjusting for Your Taste",
]

REQUIRED_GRINDERS = [
    "1Zpresso K-Ultra",
    "1Zpresso Q Air",
    "Baratza Encore ESP",
    "Fellow Opus",
    "Timemore C2",
]

REQUIRED_FLAVOR_INTENTS = [
    "clarity",
    "balanced",
    "sweetness",
    "body",
    "forgiveness",
]

POUR_ACTION_RE = re.compile(r"\b(?:bloom|pour)\b", re.IGNORECASE)
POUR_SPEED_RE = re.compile(
    r"\b\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)?\s*g\s*/\s*s\b",
    re.IGNORECASE,
)

EXPLICIT_RECIPE_REQUEST_RE = re.compile(
    r"\b(?:recipe(?![- ]generator\b)|dial[- ]?in|brew(?:ing)?\s+(?:plan|guide|instructions?)|"
    r"step[- ]by[- ]step\s+brew)\b",
    re.IGNORECASE,
)

QUICK_GUIDANCE_RE = re.compile(
    r"\b(?:best|better|which|recommend(?:ation|ed|ing)?|compare|comparison|"
    r"difference|why|suits?|pairing|what\s+(?:brewer|brew(?:ing)?\s+method))\b",
    re.IGNORECASE,
)

SKILL_ISSUE_REPORT_RE = re.compile(
    r"(?:\b(?:issue|bug|problem|noticed?|behaviou?r|tries?|keeps?)\b.{0,160}"
    r"\b(?:skill|template|validator|hook|workflow)\b|"
    r"\b(?:skill|template|validator|hook|workflow)\b.{0,160}"
    r"\b(?:issue|bug|problem|noticed?|behaviou?r|tries?|keeps?)\b)",
    re.IGNORECASE | re.DOTALL,
)

MAINTENANCE_REQUEST_RE = re.compile(
    r"(?:\bSKILL\.md\b|\brecipe-output\.md\b|\bvalidate-recipe-output\.py\b|"
    r"\bhooks?\.json\b|"
    r"\b(?:update|edit|modify|change|fix|revise|improve|test(?:s|ed|ing)?)\b.{0,100}"
    r"\b(?:skill|template|validator|hook|script|workflow|instructions?|references?)\b|"
    r"\b(?:skill|template|validator|hook|script|workflow|instructions?|references?)\b"
    r".{0,100}\b(?:update|edit|modify|change|fix|revise|improve|test(?:s|ed|ing)?)\b)",
    re.IGNORECASE | re.DOTALL,
)

RECIPE_OUTPUT_MARKERS = [
    "## Coffee Details",
    "## Overview",
    "## Brew Timeline",
    "## Brewing Steps",
    "| Grinder |",
]


def emit(payload):
    print(json.dumps(payload))


def stringify(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(stringify(item) for item in value)
    if isinstance(value, dict):
        for key in ("text", "content", "message", "prompt"):
            text = stringify(value.get(key))
            if text:
                return text
    return ""


def collect_user_text(node):
    texts = []
    if isinstance(node, dict):
        role = str(node.get("role") or node.get("author") or "").lower()
        kind = str(node.get("type") or node.get("item_type") or "").lower()
        if role == "user" or "user" in kind:
            text = stringify(
                node.get("content")
                or node.get("message")
                or node.get("prompt")
                or node.get("text")
            )
            if text:
                texts.append(text)
        for value in node.values():
            texts.extend(collect_user_text(value))
    elif isinstance(node, list):
        for item in node:
            texts.extend(collect_user_text(item))
    return texts


def last_user_message(transcript_path):
    if not transcript_path:
        return ""

    path = Path(transcript_path)
    if not path.is_file():
        return ""

    users = []
    try:
        with path.open("r", encoding="utf-8") as transcript:
            for line in transcript:
                try:
                    users.extend(collect_user_text(json.loads(line)))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return ""

    return users[-1] if users else ""


def is_recipe_turn(user_text, assistant_text):
    marker_count = sum(1 for marker in RECIPE_OUTPUT_MARKERS if marker in assistant_text)
    recipe_shaped_output = marker_count >= 2 or bool(
        re.search(r"^# .*\bRecipe\b", assistant_text, re.IGNORECASE | re.MULTILINE)
    )
    if recipe_shaped_output:
        return True
    if MAINTENANCE_REQUEST_RE.search(user_text or "") or SKILL_ISSUE_REPORT_RE.search(
        user_text or ""
    ):
        return False
    if QUICK_GUIDANCE_RE.search(user_text or ""):
        return False
    return bool(EXPLICIT_RECIPE_REQUEST_RE.search(user_text or ""))


def heading_index(markdown, heading):
    match = re.search(rf"^##\s+{re.escape(heading)}\s*$", markdown, re.MULTILINE)
    return match.start() if match else -1


def section_body(markdown, heading):
    match = re.search(
        rf"^##\s+{re.escape(heading)}\s*$\n(?P<body>.*?)(?=^##\s+|\Z)",
        markdown,
        re.MULTILINE | re.DOTALL,
    )
    return match.group("body") if match else ""


def is_separator_row(row):
    cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell or "") for cell in cells)


def table_blocks(markdown):
    blocks = []
    current = []
    for line in markdown.splitlines():
        if line.lstrip().startswith("|") and line.rstrip().endswith("|"):
            current.append(line)
        elif current:
            blocks.append(current)
            current = []
    if current:
        blocks.append(current)
    return blocks


def grinder_table_errors(markdown):
    overview = section_body(markdown, "Overview")
    if not overview:
        return ["Overview section is missing or empty, so the grinder table could not be validated."]

    grinder_table = None
    for block in table_blocks(overview):
        header = block[0].lower()
        if "grinder" in header and "setting" in header:
            grinder_table = block
            break

    if grinder_table is None:
        return ["Overview must contain a markdown grinder table with Grinder and Setting columns."]

    data_rows = [row for row in grinder_table[1:] if not is_separator_row(row)]
    errors = []
    if len(data_rows) != len(REQUIRED_GRINDERS):
        errors.append(f"Grinder table must have exactly 5 data rows; found {len(data_rows)}.")

    row_text = "\n".join(data_rows)
    for grinder in REQUIRED_GRINDERS:
        pattern = re.compile(rf"^\|\s*{re.escape(grinder)}\s*\|.+\|$", re.MULTILINE)
        if not pattern.search(row_text):
            errors.append(f"Missing grinder row: {grinder}.")

    names = [row.strip().strip("|").split("|")[0].strip() for row in data_rows if "|" in row]
    extra = [name for name in names if name not in REQUIRED_GRINDERS]
    if extra:
        errors.append("Unexpected grinder row(s): " + ", ".join(extra) + ".")

    return errors


def flavor_intent_errors(markdown):
    overview = section_body(markdown, "Overview")
    if not overview:
        return ["Overview section is missing or empty, so flavor intent could not be validated."]

    match = re.search(
        r"^\s*-?\s*\*\*Flavor Intent:\*\*\s*(?P<intent>[^\n]+)$",
        overview,
        re.IGNORECASE | re.MULTILINE,
    )
    if not match:
        return [
            "Overview must include a Flavor Intent field using one of: "
            + ", ".join(REQUIRED_FLAVOR_INTENTS)
            + "."
        ]

    intent = match.group("intent").strip().lower().rstrip(".")
    if intent not in REQUIRED_FLAVOR_INTENTS:
        return [
            "Flavor Intent must be one of: "
            + ", ".join(REQUIRED_FLAVOR_INTENTS)
            + f"; found {match.group('intent').strip()}."
        ]

    return []


def pour_speed_errors(markdown):
    errors = []
    timeline = section_body(markdown, "Brew Timeline")
    timeline_table = None
    for block in table_blocks(timeline):
        header = [cell.strip().lower() for cell in block[0].strip().strip("|").split("|")]
        if "action" in header:
            timeline_table = (header, block)
            break

    if timeline_table is None:
        errors.append("Brew Timeline must contain a markdown table with an Action column.")
    else:
        header, block = timeline_table
        if "pour speed" not in header:
            errors.append("Brew Timeline must include a Pour Speed column.")
        else:
            action_index = header.index("action")
            speed_index = header.index("pour speed")
            data_rows = [row for row in block[1:] if not is_separator_row(row)]
            for row in data_rows:
                cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
                if len(cells) <= max(action_index, speed_index):
                    errors.append("Every Brew Timeline row must include a Pour Speed cell.")
                    continue
                action = cells[action_index]
                if POUR_ACTION_RE.search(action) and not POUR_SPEED_RE.search(cells[speed_index]):
                    errors.append(
                        f'Brew Timeline action "{action}" must have a numeric pour speed in g/s.'
                    )

    steps = section_body(markdown, "Brewing Steps")
    step_blocks = re.split(r"(?=^###\s+)", steps, flags=re.MULTILINE)
    for block in step_blocks:
        heading = re.match(r"^###\s+(?P<heading>[^\n]+)", block)
        if not heading or not POUR_ACTION_RE.search(heading.group("heading")):
            continue
        speed = re.search(
            r"^\s*-?\s*\*\*Pour Speed:\*\*\s*(?P<speed>[^\n]+)$",
            block,
            re.IGNORECASE | re.MULTILINE,
        )
        if not speed or not POUR_SPEED_RE.search(speed.group("speed")):
            errors.append(
                f'Brewing step "{heading.group("heading").strip()}" must include a numeric '
                "Pour Speed in g/s."
            )

    return errors


def template_errors(markdown):
    errors = []
    positions = {section: heading_index(markdown, section) for section in REQUIRED_SECTIONS}
    missing = [section for section, index in positions.items() if index < 0]
    if missing:
        errors.append("Missing required section(s): " + ", ".join(missing) + ".")

    present = [positions[section] for section in REQUIRED_SECTIONS if positions[section] >= 0]
    if present != sorted(present):
        errors.append("Required sections must appear in the recipe-output.md order.")

    timeline = section_body(markdown, "Brew Timeline")
    if timeline:
        timeline_headers = []
        for block in table_blocks(timeline):
            headers = [cell.strip().lower() for cell in block[0].strip().strip("|").split("|")]
            if "action" in headers:
                timeline_headers = headers
                break
        if not any(re.search(r"\btime\b", header) for header in timeline_headers):
            errors.append("Brew Timeline must include a markdown table with a Time column.")

    troubleshooting = section_body(markdown, "Troubleshooting Guide")
    if troubleshooting and not re.search(
        r"\bIf\s+(?:your|the)\s+coffee\s+tastes\b", troubleshooting, re.IGNORECASE
    ):
        errors.append("Troubleshooting Guide must include the standard troubleshooting table.")

    errors.extend(grinder_table_errors(markdown))
    errors.extend(flavor_intent_errors(markdown))
    errors.extend(pour_speed_errors(markdown))
    return errors


def main():
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        emit({"continue": True})
        return 0

    if hook_input.get("hook_event_name") != "Stop" or hook_input.get("stop_hook_active"):
        emit({"continue": True})
        return 0

    assistant_text = hook_input.get("last_assistant_message") or ""
    user_text = last_user_message(hook_input.get("transcript_path"))

    if not assistant_text.strip() or not is_recipe_turn(user_text, assistant_text):
        emit({"continue": True})
        return 0

    errors = template_errors(assistant_text)
    if not errors:
        emit({"continue": True})
        return 0

    reason = (
        "The generated coffee recipe does not follow "
        "coffee-recipe-generator/templates/recipe-output.md. "
        "Revise the recipe before stopping. Fix these issues:\n"
        + "\n".join(f"- {error}" for error in errors)
        + "\n\nReturn the complete corrected recipe, not a summary. Include the exact five grinder rows: "
        + ", ".join(REQUIRED_GRINDERS)
        + ". Include a valid Flavor Intent in the Overview: "
        + ", ".join(REQUIRED_FLAVOR_INTENTS)
        + ". Include a numeric g/s pour speed for every bloom and pour in both the Brew "
        "Timeline and Brewing Steps."
    )
    emit({"decision": "block", "reason": reason})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
