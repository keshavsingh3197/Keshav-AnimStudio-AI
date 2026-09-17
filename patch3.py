with open('frontend/src/app/features/clips/clip-studio.component.ts', 'r', encoding='utf-8') as f:
    text = f.read()

old = """        return {
          volume: sound.volume,
          audioAssetId: assetId,
          audioVolume: sound.audioVolume,
          keepOriginalAudio: sound.keepOriginalAudio,
        };"""

new = """        return {
          volume: sound.volume,
          audioAssetId: assetId,
          audioVolume: sound.audioVolume,
          keepOriginalAudio: sound.keepOriginalAudio,
          trimStartSeconds: sound.audioTrimStartSeconds ?? null,
          trimEndSeconds: sound.audioTrimEndSeconds ?? null,
        };"""

if old in text:
    text = text.replace(old, new)
    with open('frontend/src/app/features/clips/clip-studio.component.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS: Payload trim fields added.')
else:
    print('ERROR: Pattern not found.')
