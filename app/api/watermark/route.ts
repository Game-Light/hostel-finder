import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const image = sharp(buffer)
    const { width = 800, height = 600 } = await image.metadata()

    const fontSize = Math.max(16, Math.round(Math.min(width, height) * 0.045))
    const text = 'Hostel Finder'

    // Create diagonal watermark SVG — repeated across image
    const cols = Math.ceil(width / 220)
    const rows = Math.ceil(height / 120)
    let watermarkContent = ''

    for (let row = 0; row < rows + 2; row++) {
      for (let col = 0; col < cols + 2; col++) {
        const x = col * 220 - 110
        const y = row * 120 - 60
        watermarkContent += `
          <text
            x="${x}"
            y="${y}"
            font-size="${fontSize}"
            font-family="Arial, sans-serif"
            font-weight="bold"
            fill="white"
            fill-opacity="0.35"
            transform="rotate(-35, ${x}, ${y})"
            letter-spacing="2"
          >${text}</text>
        `
      }
    }

    const watermarkSvg = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${watermarkContent}
      </svg>
    `)

    const watermarked = await image
      .composite([{ input: watermarkSvg, blend: 'over' }])
      .jpeg({ quality: 88 })
      .toBuffer()

    return new NextResponse(watermarked, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': watermarked.length.toString(),
      },
    })
  } catch (err) {
    console.error('Watermark error:', err)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}