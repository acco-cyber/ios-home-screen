import ZAI from 'z-ai-web-dev-sdk'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const WALLPAPER_DIR = '/home/z/my-project/public/wallpapers'
const PHOTO_DIR = '/home/z/my-project/public/photos'
const COVER_DIR = '/home/z/my-project/public/covers'

type Job = { prompt: string; out: string; size: string }

const jobs: Job[] = [
  {
    prompt:
      'Abstract iOS style wallpaper, soft flowing silky gradient waves in warm peach, coral and lavender tones, dreamy blurred bokeh light, elegant minimal smooth, vertical phone wallpaper, ultra high quality',
    out: path.join(WALLPAPER_DIR, 'light.jpg'),
    size: '768x1376',
  },
  {
    prompt:
      'Abstract iOS style dark wallpaper, deep midnight indigo and violet flowing silk gradient waves, subtle glowing particles like stars, smooth elegant minimal, vertical phone wallpaper, ultra high quality',
    out: path.join(WALLPAPER_DIR, 'dark.jpg'),
    size: '768x1376',
  },
  {
    prompt:
      'Serene mountain lake at golden hour, misty peaks, perfect mirror reflection in calm water, warm amber and teal tones, professional landscape photography, vertical phone wallpaper, high quality',
    out: path.join(WALLPAPER_DIR, 'sunset.jpg'),
    size: '768x1376',
  },
  {
    prompt:
      'Tropical beach with turquoise water and white sand, palm leaves framing the top, bright summer day, travel photography, high quality',
    out: path.join(PHOTO_DIR, 'beach.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'City skyline at night with neon reflections on wet street, cyberpunk vibes, cinematic photography, high quality',
    out: path.join(PHOTO_DIR, 'city.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Golden retriever puppy running on grass in a park, joyful, shallow depth of field, professional pet photography, high quality',
    out: path.join(PHOTO_DIR, 'dog.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Latte art coffee cup on wooden table next to an open book, cozy morning light through window, lifestyle photography, high quality',
    out: path.join(PHOTO_DIR, 'coffee.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Close-up of blooming pink cherry blossom branch against soft blue sky, spring, macro photography, high quality',
    out: path.join(PHOTO_DIR, 'blossom.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Green terraced rice fields in misty mountains at sunrise, aerial view, travel photography, high quality',
    out: path.join(PHOTO_DIR, 'fields.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Colorful hot air balloons floating over desert rock formations at dawn, Cappadocia style, travel photography, high quality',
    out: path.join(PHOTO_DIR, 'balloons.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Northern lights aurora borealis green and purple over snowy forest and cabin, night photography, high quality',
    out: path.join(PHOTO_DIR, 'aurora.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Modern minimalist album cover art, gradient sun disk over layered horizon lines, retro synthwave sunset, orange pink purple, grainy texture, square',
    out: path.join(COVER_DIR, 'midnight-drive.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Minimalist album cover, single white wave line on deep teal background, japanese inspired, elegant, square',
    out: path.join(COVER_DIR, 'ocean-bloom.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Album cover art, dreamy pastel clouds and floating geometric shapes, soft pink and lavender, surreal minimal, square',
    out: path.join(COVER_DIR, 'cloud-nine.jpg'),
    size: '1024x1024',
  },
  {
    prompt:
      'Album cover art, macro photo of water droplets on dark green leaf, moody, deep tones, square',
    out: path.join(COVER_DIR, 'rainfall.jpg'),
    size: '1024x1024',
  },
]

async function main() {
  const zai = await ZAI.create()
  for (const job of jobs) {
    if (fs.existsSync(job.out)) {
      console.log(`skip (exists): ${job.out}`)
      continue
    }
    let ok = false
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: job.prompt,
          size: job.size,
        })
        const b64 = res.data?.[0]?.base64
        if (!b64) throw new Error('empty base64')
        const buf = Buffer.from(b64, 'base64')
        await sharp(buf).jpeg({ quality: 82 }).toFile(job.out)
        console.log(`ok: ${job.out}`)
        ok = true
      } catch (e) {
        console.error(`attempt ${attempt} failed for ${job.out}: ${e}`)
        await new Promise((r) => setTimeout(r, 1500 * attempt))
      }
    }
    if (!ok) console.error(`FAILED: ${job.out}`)
  }
  console.log('ALL DONE')
}

main()
