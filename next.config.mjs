/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erlaubt Test-Builds in ein eigenes Verzeichnis, ohne einen laufenden Dev-Server (.next) zu stören
  distDir: process.env.NEXT_DIST_DIR || ".next",

  webpack: (config, { webpack }) => {
    // @imgly/background-removal -> onnxruntime-web verweist per new URL(..., import.meta.url) auf eigene ES-Module
    // (ort.*.mjs). Webpack gibt sie als Assets aus, und Terser scheitert beim Minifizieren ("import.meta outside module").
    // Diese Dateien sind bereits minifiziert -> als "minimized" markieren, dann überspringt Terser sie.
    class SkipMinifyOrtAssets {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap("SkipMinifyOrtAssets", (compilation) => {
          compilation.hooks.processAssets.tap(
            { name: "SkipMinifyOrtAssets", stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
            (assets) => {
              for (const name of Object.keys(assets)) {
                if (/ort[\w.-]*\.mjs$/.test(name)) compilation.updateAsset(name, assets[name], { minimized: true });
              }
            },
          );
        });
      }
    }
    config.plugins.push(new SkipMinifyOrtAssets());
    return config;
  },
};

export default nextConfig;
