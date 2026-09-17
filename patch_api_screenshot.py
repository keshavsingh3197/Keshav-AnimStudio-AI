with open('frontend/src/app/core/services/api.service.ts', 'r', encoding='utf-8') as f:
    text = f.read()

new_meth = '''  saveDebugScreenshot(base64Image: string, viewName: string): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.base}/api/debug/screenshot`, { base64Image, viewName }));
  }
'''

idx = text.find("  // --- Users ---")
if idx == -1:
    idx = text.rfind("}")
text = text[:idx] + new_meth + "\n" + text[idx:]

with open('frontend/src/app/core/services/api.service.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Added saveDebugScreenshot')
