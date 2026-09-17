with open('frontend/src/app/features/projects/project-editor.component.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<a [routerLink]="[\'/projects\', project.id, \'render\']"><button type="button">Render</button></a>', '<a [routerLink]="[\'/projects\', project.id, \'render\']"><button type="button">Render</button></a>\n      <button type="button" class="secondary" title="Capture Screenshot" (click)="captureScreenshot()">?? Capture</button>')

with open('frontend/src/app/features/projects/project-editor.component.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated HTML')
