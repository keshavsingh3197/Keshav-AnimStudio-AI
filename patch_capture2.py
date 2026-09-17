with open('frontend/src/app/features/projects/project-editor.component.ts', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('  captureScreenshot(): void {')
if idx != -1:
    end_idx = text.rfind('}')
    if text[end_idx-1] == '\n':
        end_idx = text.rfind('}', 0, end_idx)
    
    new_meth = '''  captureScreenshot(): void {
    this.status.notify(['Capturing screenshot...']);
    html2canvas(document.body, { 
      useCORS: true, 
      windowWidth: document.body.scrollWidth,
      windowHeight: document.body.scrollHeight
    }).then(canvas => {
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      const viewName = window.location.pathname.split('/').pop() || 'screenshot';
      
      this.status.run(this.api.saveDebugScreenshot(base64Image, viewName), () => {
        this.status.notify(['Screenshot saved to D:\\\\AI_STUDIO']);
      });
    }).catch(err => {
      this.status.error.set('Capture failed: ' + err.message);
    });
  }
}
'''
    text = text[:idx] + new_meth

with open('frontend/src/app/features/projects/project-editor.component.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched correctly')
