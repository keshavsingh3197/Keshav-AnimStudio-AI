with open('frontend/src/app/core/services/api.service.ts', 'r', encoding='utf-8') as f:
    text = f.read()

new_meth = '''  reorderAssets(projectId: string, assetIds: string[]): Observable<unknown> {
    return this.unwrap(this.http.put<ApiResponse<unknown>>(`${this.base}/api/projects/${projectId}/assets/reorder`, { assetIds }));
  }
'''

idx = text.find("  moveAssetToFolder(")
text = text[:idx] + new_meth + "\n" + text[idx:]

with open('frontend/src/app/core/services/api.service.ts', 'w', encoding='utf-8') as f:
    f.write(text)
print('Added reorderAssets')
