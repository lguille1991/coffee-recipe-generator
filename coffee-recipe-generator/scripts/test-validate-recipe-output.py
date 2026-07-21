#!/usr/bin/env python3
"""Focused regression tests for recipe-output validation routing."""

import runpy
import unittest
from pathlib import Path


VALIDATOR = runpy.run_path(
    str(Path(__file__).with_name("validate-recipe-output.py"))
)
is_recipe_turn = VALIDATOR["is_recipe_turn"]


class RecipeTurnDetectionTests(unittest.TestCase):
    def test_skill_edit_request_is_not_a_recipe_output_turn(self):
        user_text = (
            "I get inconsistent results when generating a coffee recipe using my skill "
            "in SKILL.md. Update the skill so every pour includes g/s."
        )
        assistant_text = "Updated the skill, template, references, and validator."

        self.assertFalse(is_recipe_turn(user_text, assistant_text))

    def test_skill_forward_test_request_is_not_a_recipe_output_turn(self):
        user_text = (
            "Run a round of tests using different sets of data that trigger the skill, "
            "validate the output recipe now includes pour speed in g/s in each individual pour"
        )
        assistant_text = (
            "All forward tests passed. Every tested pour included a numeric g/s speed."
        )

        self.assertFalse(is_recipe_turn(user_text, assistant_text))

    def test_genuine_recipe_request_still_requires_recipe_output(self):
        self.assertTrue(
            is_recipe_turn(
                "Generate a V60 coffee recipe for this washed Ethiopian coffee.",
                "Here is a quick starting point.",
            )
        )

    def test_recipe_shaped_output_is_validated_even_during_maintenance(self):
        assistant_text = "\n".join(
            [
                "## Coffee Details",
                "## Overview",
                "## Brew Timeline",
                "## Brewing Steps",
            ]
        )

        self.assertTrue(
            is_recipe_turn("Update the recipe template in SKILL.md.", assistant_text)
        )


if __name__ == "__main__":
    unittest.main()
