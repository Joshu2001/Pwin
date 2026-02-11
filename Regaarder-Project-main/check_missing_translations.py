
import re

advertisewithus_path = r"c:\Users\user\Downloads\Regaarder-4.0-main\Regaarder-4.0-main\src\advertisewithus.jsx"
translations_path = r"c:\Users\user\Downloads\Regaarder-4.0-main\Regaarder-4.0-main\src\translations.js"

with open(advertisewithus_path, 'r', encoding='utf-8') as f:
    jsx_content = f.read()

# Regex to find t('String') or t("String")
matches = re.findall(r"t\(['\"](.*?)['\"]\)", jsx_content)
# filter out duplicates
unique_matches = sorted(list(set(matches)))

# Read translations file
with open(translations_path, 'r', encoding='utf-8') as f:
    translations_content = f.read()

# Extract Vietnamese section
vietnamese_section_match = re.search(r"'Vietnamese':\s*\{(.*?)\},", translations_content, re.DOTALL)
if vietnamese_section_match:
    vietnamese_content = vietnamese_section_match.group(1)
else:
    print("Could not find Vietnamese section")
    exit()

missing_keys = []
for key in unique_matches:
    # Check if key is in Vietnamese content
    # Simple valid check might be enough
    if f"'{key}':" not in vietnamese_content and f'"{key}":' not in vietnamese_content:
        missing_keys.append(key)

print(f"Found {len(missing_keys)} missing keys.")
for key in missing_keys:
    print(f"MISSING: {key}")
