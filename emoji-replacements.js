// Emoji to SVG Icon Replacement Script
// Replaces emojis with SVG icons in script.js

const fs = require('fs');

console.log("Reading script.js...");
let content = fs.readFileSync('script.js', 'utf8');

const originalLength = content.length;

// Define replacements (skip 🎭 theme and 💥 explosion as requested)
// Keep: ⚠️✅ 🔴🟠🟡🟢 🥇🥈🥉
const replacements = [
    ['🔗', '<img src="icons/misc/link.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📌', '<img src="icons/status/pin.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['💾', '<img src="icons/actions/save.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📥', '<img src="icons/actions/download.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📊', '<img src="icons/misc/chart-line-up.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📈', '<img src="icons/misc/chart-line-up.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📉', '<img src="icons/misc/chart-line-down.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['💡', '<img src="icons/misc/lightbulb.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📂', '<img src="icons/misc/folder.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📋', '<img src="icons/misc/checklist.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['🧮', '<img src="icons/misc/calculator.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['🎯', '<img src="icons/misc/gameplay.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['⚔️', '<img src="icons/misc/combat.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['✏️', '<img src="icons/actions/pencil.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['🗑️', '<img src="icons/actions/trash.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['✨', '<img src="icons/misc/sparkles.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['📍', '<img src="icons/story/location.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['👥', '<img src="icons/misc/user.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['⏱️', '<img src="icons/misc/calendar.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['💭', '<img src="icons/misc/thought-bubble.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['➕', '<img src="icons/actions/add.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['➖', '<img src="icons/misc/subtract.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['⚖️', '<img src="icons/misc/scales-balance.svg" alt="" width="16" height="16" style="vertical-align: middle;">'],
    ['🖥️', '<img src="icons/misc/ui.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
    ['⚛️', '<img src="icons/misc/physics.svg" alt="" width="14" height="14" style="vertical-align: middle;">'],
];

// Apply all simple replacements
replacements.forEach(([emoji, svg]) => {
    const matches = content.match(new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    const count = matches ? matches.length : 0;
    if (count > 0) {
        content = content.split(emoji).join(svg);
        console.log(`Replaced ${count} instances of ${emoji}`);
    }
});

// Handle ⚙️ mechanics icon
content = content.replace(/icon: '⚙️'/g, 'icon: \'<img src="icons/navigation/mechanics.svg" alt="" width="14" height="14" style="vertical-align: middle;">\'');
content = content.replace(/mechanic: '⚙️ Mechanics'/g, 'mechanic: \'<img src="icons/navigation/mechanics.svg" alt="" width="14" height="14" style="vertical-align: middle;"> Mechanics\'');
content = content.replace(/: '⚙️ Instance<\/span>'/g, ': \'<img src="icons/navigation/mechanics.svg" alt="" width="14" height="14" style="vertical-align: middle;"> Instance</span>\'');

// Replace in typeIcon assignments
content = content.replace(
    /const typeIcon = cls\.classType === 'character' \? '🎭' : '⚙️';/g,
    'const typeIcon = cls.classType === \'character\' ? \'🎭\' : \'<img src="icons/navigation/mechanics.svg" alt="" width="14" height="14" style="vertical-align: middle;">\';'
);

// Replace any remaining ⚙️
const remaining = (content.match(/⚙️/g) || []).length;
if (remaining > 0) {
    content = content.split('⚙️').join('<img src="icons/navigation/mechanics.svg" alt="" width="14" height="14" style="vertical-align: middle;">');
    console.log(`Replaced ${remaining} remaining instances of ⚙️`);
}

// Write the file back
console.log("Writing updated script.js...");
fs.writeFileSync('script.js', content, 'utf8');

const newLength = content.length;
console.log(`\nDone! File size changed from ${originalLength} to ${newLength} bytes`);
console.log(`Difference: ${newLength > originalLength ? '+' : ''}${newLength - originalLength} bytes`);
console.log("\nEmoji replacements complete!");
console.log("Skipped: 🎭 (theme), 💥 (explosion), ⚠️✅🔴🟠🟡🟢🥇🥈🥉 (intentional)");
