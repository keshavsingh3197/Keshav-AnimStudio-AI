with open('backend/AnimStudio.Domain/Assets/Asset.cs', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('public string Name { get; set; } = string.Empty;\n', 'public string Name { get; set; } = string.Empty;\n    public int OrderIndex { get; set; }\n')

with open('backend/AnimStudio.Domain/Assets/Asset.cs', 'w', encoding='utf-8') as f:
    f.write(text)

with open('backend/AnimStudio.Api/Contracts/Responses.cs', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('public string Name { get; init; } = string.Empty;\n', 'public string Name { get; init; } = string.Empty;\n    public int OrderIndex { get; init; }\n')

with open('backend/AnimStudio.Api/Contracts/Responses.cs', 'w', encoding='utf-8') as f:
    f.write(text)

with open('backend/AnimStudio.Api/Contracts/Mappings.cs', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('Name = a.Name,', 'Name = a.Name,\n            OrderIndex = a.OrderIndex,')

with open('backend/AnimStudio.Api/Contracts/Mappings.cs', 'w', encoding='utf-8') as f:
    f.write(text)

with open('frontend/src/app/core/models/api.models.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('name: string;', 'name: string;\n  orderIndex: number;')

with open('frontend/src/app/core/models/api.models.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Added OrderIndex to Asset')
