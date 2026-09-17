with open('frontend/src/app/features/projects/project-editor.component.html', 'r', encoding='mbcs') as f:
    text = f.read()
text = text.replace('?? Capture</button>', 'Capture Screen</button>')
with open('frontend/src/app/features/projects/project-editor.component.html', 'w', encoding='utf-8') as f:
    f.write(text)

with open('frontend/src/app/features/assets/asset-library.component.html', 'r', encoding='mbcs') as f:
    text = f.read()

text = text.replace('<span class="icon">??</span> ', '')
text = text.replace('<span class="icon">???</span> ', '')
text = text.replace('<span class="icon">?</span> ', '')
text = text.replace('<td class="muted" style="cursor: grab; text-align: center;">?</td>', '<td class="muted" style="cursor: grab; text-align: center;">&#9776;</td>')

with open('frontend/src/app/features/assets/asset-library.component.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed HTML encoding issues')
