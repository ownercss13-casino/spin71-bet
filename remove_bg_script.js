import { Jimp } from 'jimp';
import path from 'path';

async function main() {
  try {
    const imagePath = path.resolve('public/apple-touch-icon.png');
    console.log('Reading image from:', imagePath);
    
    // Load the image
    const image = await Jimp.read(imagePath);
    console.log(`Image loaded successfully. Size: ${image.bitmap.width}x${image.bitmap.height}`);
    
    // Get the color of the top-left corner pixel to identify the background color
    const bgPixelColor = image.getPixelColor(1, 1);
    const bgR = (bgPixelColor >> 24) & 0xFF;
    const bgG = (bgPixelColor >> 16) & 0xFF;
    const bgB = (bgPixelColor >> 8) & 0xFF;
    const bgA = bgPixelColor & 0xFF;
    
    console.log(`Top-left corner pixel color (detected background): RGBA(${bgR}, ${bgG}, ${bgB}, ${bgA})`);
    
    // We will scan all pixels. If a pixel's RGB values are very close to the background color,
    // we make it transparent. If background color is white/near-white, we'll also catch any near-white pixels.
    let count = 0;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];
      
      // Calculate distance to detected background color
      const dist = Math.sqrt(
        Math.pow(r - bgR, 2) +
        Math.pow(g - bgG, 2) +
        Math.pow(b - bgB, 2)
      );
      
      // If we are close to the background color, make it transparent
      // Or if the pixel is extremely close to white (brightness > 240) and our background is light
      const isNearBg = dist < 45; // threshold of color distance
      const isWhiteBg = (bgR > 220 && bgG > 220 && bgB > 220);
      const isPixelNearWhite = (r > 240 && g > 240 && b > 240);
      
      if (isNearBg || (isWhiteBg && isPixelNearWhite)) {
        this.bitmap.data[idx + 3] = 0; // alpha = 0 (transparent)
        count++;
      }
    });
    
    console.log(`background removal completed. Modified ${count} pixels to transparent.`);
    
    // Save the image back
    await image.write(imagePath);
    console.log('Image saved successfully!');
  } catch (error) {
    console.error('Error running background removal:', error);
  }
}

main();
