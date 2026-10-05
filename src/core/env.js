// Tiny abstraction so the engine runs in the browser and in Node tests.
// The browser default uses the DOM; tests and scripts call setEnv() with @napi-rs/canvas.

let env = null;

export function setEnv(next) {
  env = next;
}

export function getEnv() {
  if (!env) {
    env = {
      createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
      },
      Path2D: globalThis.Path2D,
      loadSvg(svg) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Could not draw that sign.'));
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        });
      },
    };
  }
  return env;
}
