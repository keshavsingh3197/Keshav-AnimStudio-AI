with open('backend/AnimStudio.Api/Controllers/DebugController.cs', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('[HttpPost("screenshot")]', '[HttpPost("screenshot")]\n    [RequestSizeLimit(100_000_000)]')

with open('backend/AnimStudio.Api/Controllers/DebugController.cs', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched DebugController')
