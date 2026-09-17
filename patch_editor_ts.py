with open('frontend/src/app/features/projects/project-editor.component.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import_lines = "import html2canvas from 'html2canvas';\nimport { ApiService } from '../../core/services/api.service';\nimport { StatusService } from '../../core/services/status.service';\n"
text = import_lines + text

new_meth = '''
  captureScreenshot(): void {
    const api = inject(ApiService);
    const status = inject(StatusService);
    
    // We capture the body element
    html2canvas(document.body, { 
      useCORS: true, 
      allowTaint: true,
      windowWidth: document.body.scrollWidth,
      windowHeight: document.body.scrollHeight
    }).then(canvas => {
      const base64Image = canvas.toDataURL('image/png');
      const viewName = window.location.pathname.split('/').pop() || 'screenshot';
      
      status.run(api.saveDebugScreenshot(base64Image, viewName), () => {
        status.notify([`Screenshot saved to D:\\AI_STUDIO`]);
      });
    }).catch(err => {
      console.error('Screenshot failed:', err);
    });
  }
}
'''

text = text.replace('  statusClass(status: string): string {\n    if (status === \'Rendered\') return \'pill ok\';\n    if (status === \'Rendering\') return \'pill warn\';\n    if (status === \'Ready\') return \'pill ok\';\n    return \'pill\';\n  }\n}', '  statusClass(status: string): string {\n    if (status === \'Rendered\') return \'pill ok\';\n    if (status === \'Rendering\') return \'pill warn\';\n    if (status === \'Ready\') return \'pill ok\';\n    return \'pill\';\n  }' + new_meth)

# Wait, inject() inside a method won't work in Angular unless it's in the injection context.
# I should add them as properties using inject().
text = text.replace('  readonly store = inject(ProjectStore);', '  readonly store = inject(ProjectStore);\n  private readonly api = inject(ApiService);\n  private readonly status = inject(StatusService);')
text = text.replace('const api = inject(ApiService);\n    const status = inject(StatusService);\n    ', '')
text = text.replace('status.run(api.save', 'this.status.run(this.api.save')
text = text.replace('status.notify([', 'this.status.notify([')

with open('frontend/src/app/features/projects/project-editor.component.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated TS')
