with open('frontend/src/app/features/projects/project-editor.component.ts', 'r', encoding='utf-8') as f:
    text = f.read()

new_meth = '''  captureScreenshot(): void {
    this.status.notify(['Capturing screenshot... please wait.']);
    html2canvas(document.body, { 
      useCORS: true, 
      windowWidth: document.body.scrollWidth,
      windowHeight: document.body.scrollHeight,
      logging: false
    }).then(canvas => {
      const base64Image = canvas.toDataURL('image/jpeg', 0.7);
      const viewName = window.location.pathname.split('/').pop() || 'screenshot';
      
      this.status.run(this.api.saveDebugScreenshot(base64Image, viewName), () => {
        this.status.notify([`Screenshot saved to D:\\\\AI_STUDIO`]);
      });
    }).catch(err => {
      this.status.error.set('Capture failed: ' + err.message);
      console.error('Screenshot failed:', err);
    });
  }'''

import re
text = re.sub(r'  captureScreenshot\(\): void \{[\s\S]*?\}\n  \}', new_meth + '\n}', text)

with open('frontend/src/app/features/projects/project-editor.component.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched captureScreenshot')
