import { Injectable } from '@angular/core';

const TILE_SIZE = 240;        // pixels, width and height of every tile image
const MAX_LENGTH = 45_000;    // max size per image (as text), keeps the whole puzzle well under Firebase's 1 MB limit

@Injectable({ providedIn: 'root' })
export class ImageService {
  /** Crops any photo to a square, shrinks it to tile size and compresses it. Returns a data URL. */
  async compressToTile(file: File): Promise<string> {
    const img = await this.loadImage(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const side = Math.min(w, h);

    // Landscape: crop from the center. Portrait: crop a bit higher, so faces don't get cut off.
    const sx = (w - side) / 2;
    const sy = h > w ? (h - side) * 0.2 : (h - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, TILE_SIZE, TILE_SIZE);

    let quality = 0.8;
    let data = canvas.toDataURL('image/jpeg', quality);
    while (data.length > MAX_LENGTH && quality > 0.3) {
      quality -= 0.1;
      data = canvas.toDataURL('image/jpeg', quality);
    }
    return data;
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('That file could not be opened as a picture. Try a JPG or PNG.'));
      };
      img.src = url;
    });
  }
}
