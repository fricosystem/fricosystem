import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const srcIcon = resolve(rootDir, 'public/icons/apex-logo-source.png');
const iconsDir = resolve(rootDir, 'public/icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Background color matching the app theme (#0a1628 - dark navy)
const bgColor = { r: 10, g: 22, b: 40, alpha: 1 };

async function generateIcon(size, suffix = '', padded = false) {
  const filename = resolve(iconsDir, `icon-${size}x${size}${suffix}.png`);

  if (padded) {
    // Maskable icon: logo centered with ~20% padding on all sides, solid bg
    const padding = Math.round(size * 0.15);
    const logoSize = size - padding * 2;

    await sharp(srcIcon)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
      .then(async (logoBuffer) => {
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: bgColor,
          },
        })
          .composite([{ input: logoBuffer, gravity: 'center' }])
          .png()
          .toFile(filename);
      });
  } else {
    // Regular icon: logo centered on solid bg, no extra padding
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bgColor,
      },
    })
      .composite([
        {
          input: await sharp(srcIcon)
            .resize(Math.round(size * 0.85), Math.round(size * 0.85), {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer(),
          gravity: 'center',
        },
      ])
      .png()
      .toFile(filename);
  }

  console.log(`[v0] Generated: ${filename}`);
}

async function main() {
  console.log('[v0] Generating PWA icons from APEX HUB logo...');

  for (const size of sizes) {
    await generateIcon(size, '');
    if (size === 192 || size === 512) {
      await generateIcon(size, '-maskable', true);
    }
  }

  // Also generate favicon.ico equivalent as PNG
  await generateIcon(32, '-favicon');

  console.log('[v0] All PWA icons generated successfully!');
}

main().catch((err) => {
  console.error('[v0] Error generating icons:', err);
  process.exit(1);
});
