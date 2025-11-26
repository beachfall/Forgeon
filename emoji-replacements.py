#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Emoji to SVG Icon Replacement Script
Replaces emoji with SVG icons in script.js
"""

import re

# Read the file
print("Reading script.js...")
with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

original_length = len(content)

# Define replacements (skip 🎭 theme and 💥 explosion as requested)
# Keep: ⚠️✅ 🔴🟠🟡🟢 🥇🥈🥉
replacements = [
    # Link icon
    ('🔗', '<img src="icons/misc/link.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Pin icon
    ('📌', '<img src="icons/status/pin.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Save icon
    ('💾', '<img src="icons/actions/save.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Download icon
    ('📥', '<img src="icons/actions/download.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Chart icons
    ('📊', '<img src="icons/misc/chart-line-up.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    ('📈', '<img src="icons/misc/chart-line-up.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    ('📉', '<img src="icons/misc/chart-line-down.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Lightbulb icon
    ('💡', '<img src="icons/misc/lightbulb.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Folder icon
    ('📂', '<img src="icons/misc/folder.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Checklist icon
    ('📋', '<img src="icons/misc/checklist.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Calculator icon
    ('🧮', '<img src="icons/misc/calculator.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Target/gameplay icon
    ('🎯', '<img src="icons/misc/gameplay.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Combat icon
    ('⚔️', '<img src="icons/misc/combat.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Mechanics icon (careful to preserve the emoji version in typeIcon conditionals)
    # We'll handle this separately below
    # Pencil icon
    ('✏️', '<img src="icons/actions/pencil.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Trash icon
    ('🗑️', '<img src="icons/actions/trash.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Sparkles icon
    ('✨', '<img src="icons/misc/sparkles.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Location/pin icon
    ('📍', '<img src="icons/story/location.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # User icon
    ('👥', '<img src="icons/misc/user.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Calendar/timeline icon
    ('⏱️', '<img src="icons/misc/calendar.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Thought bubble icon
    ('💭', '<img src="icons/misc/thought-bubble.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Add icon
    ('➕', '<img src="icons/actions/add.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Subtract icon
    ('➖', '<img src="icons/misc/subtract.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Balance/scales icon
    ('⚖️', '<img src="icons/misc/scales-balance.svg" alt="" width="16" height="16" style="vertical-align: middle;">'),
    # UI icon
    ('🖥️', '<img src="icons/misc/ui.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
    # Physics icon
    ('⚛️', '<img src="icons/misc/physics.svg" alt="" width="14" height="14" style="vertical-align: middle;">'),
]

# Apply all simple replacements
for emoji, svg in replacements:
    count = content.count(emoji)
    if count > 0:
        content = content.replace(emoji, svg)
        print(f"Replaced {count} instances of {emoji}")

# Handle ⚙️ mechanics icon - replace all except in the typeIcon conditionals
# First, temporarily protect the typeIcon conditionals
content = re.sub(
    r"icon: '⚙️'",
    r"icon: '<img src=\"icons/navigation/mechanics.svg\" alt=\"\" width=\"14\" height=\"14\" style=\"vertical-align: middle;\">'",
    content
)

content = re.sub(
    r"mechanic: '⚙️ Mechanics'",
    r"mechanic: '<img src=\"icons/navigation/mechanics.svg\" alt=\"\" width=\"14\" height=\"14\" style=\"vertical-align: middle;\"> Mechanics'",
    content
)

content = re.sub(
    r": '⚙️ Instance</span>'",
    r": '<img src=\"icons/navigation/mechanics.svg\" alt=\"\" width=\"14\" height=\"14\" style=\"vertical-align: middle;\"> Instance</span>'",
    content
)

# Replace in typeIcon assignments
content = re.sub(
    r"const typeIcon = cls\.classType === 'character' \? '🎭' : '⚙️';",
    r"const typeIcon = cls.classType === 'character' ? '🎭' : '<img src=\"icons/navigation/mechanics.svg\" alt=\"\" width=\"14\" height=\"14\" style=\"vertical-align: middle;\">';",
    content
)

# Replace any remaining ⚙️
remaining_mechanics = content.count('⚙️')
if remaining_mechanics > 0:
    content = content.replace('⚙️', '<img src="icons/navigation/mechanics.svg" alt="" width="14" height="14" style="vertical-align: middle;">')
    print(f"Replaced {remaining_mechanics} remaining instances of ⚙️")

# Write the file back
print("Writing updated script.js...")
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

new_length = len(content)
print(f"\nDone! File size changed from {original_length} to {new_length} bytes")
print(f"Difference: {new_length - original_length:+d} bytes")
print("\nEmoji replacements complete!")
print("Skipped: 🎭 (theme), 💥 (explosion), ⚠️✅🔴🟠🟡🟢🥇🥈🥉 (intentional)")
