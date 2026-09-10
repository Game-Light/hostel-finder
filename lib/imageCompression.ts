// Resizes and compresses an image in the browser before upload.
// This is the single biggest lever against Supabase Storage egress costs:
// a photo straight off a phone camera can be 3-5MB+; after this it's
// typically 100-400KB, and every listing page view re-downloads whatever
// size we stored — so shrinking uploads shrinks all future bandwidth too.
export function compressImage(file: File, maxWidth = 1600, quality = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => {
        // Only scale down, never up — small images stay untouched
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return }
            // Keep the original filename but the file is now much smaller
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}