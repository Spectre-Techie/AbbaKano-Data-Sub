const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  { folder: '400Regular', file: 'MaterialSymbols_400Regular.ttf' },
  { folder: '700Bold', file: 'MaterialSymbols_700Bold.ttf' },
  { folder: '600SemiBold', file: 'MaterialSymbols_600SemiBold.ttf' },
  { folder: '500Medium', file: 'MaterialSymbols_500Medium.ttf' },
  { folder: '300Light', file: 'MaterialSymbols_300Light.ttf' },
  { folder: '200ExtraLight', file: 'MaterialSymbols_200ExtraLight.ttf' },
  { folder: '100Thin', file: 'MaterialSymbols_100Thin.ttf' },
];

const baseUrl = 'https://raw.githubusercontent.com/expo/google-fonts/master/font-packages/material-symbols/';
const baseTargetDir = path.join(__dirname, '..', 'node_modules', '@expo-google-fonts', 'material-symbols');

async function downloadFont(folder, file) {
  const targetDir = path.join(baseTargetDir, folder);
  const targetPath = path.join(targetDir, file);

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 10000) {
    return;
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const url = `${baseUrl}${folder}/${file}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve();
      }
      const stream = fs.createWriteStream(targetPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
      stream.on('error', () => resolve());
    }).on('error', () => resolve());
  });
}

async function main() {
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules', '@expo-google-fonts'))) {
    return;
  }
  for (const f of fonts) {
    await downloadFont(f.folder, f.file);
  }
}

main().catch(() => {});

