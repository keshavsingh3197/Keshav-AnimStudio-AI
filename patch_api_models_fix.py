with open('frontend/src/app/core/models/api.models.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# First revert all orderIndex replacements
text = text.replace('name: string;\n  orderIndex: number;', 'name: string;')
text = text.replace('name: string;\n  orderIndex?: number;', 'name: string;')

# Now carefully add orderIndex only to Asset
asset_idx = text.find('export interface Asset {')
if asset_idx != -1:
    end_idx = text.find('}', asset_idx)
    asset_str = text[asset_idx:end_idx]
    if 'name: string;' in asset_str:
        asset_str = asset_str.replace('name: string;', 'name: string;\n  orderIndex: number;')
        text = text[:asset_idx] + asset_str + text[end_idx:]

with open('frontend/src/app/core/models/api.models.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed api.models.ts')
