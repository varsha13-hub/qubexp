const fs = require('fs');
const path = require('path');
const htmlPath = path.join('solar-system','index.html');
if (!fs.existsSync(htmlPath)) {
  console.warn('No solar-system/index.html found — please add the component <script> tags manually or create index.html');
  process.exit(0);
}
let html = fs.readFileSync(htmlPath,'utf8');
const marker = '<!-- COMPONENTS-INJECT -->';
if (!html.includes(marker)) {
  // try to append before </head>
  const scripts = [
    'components/planet-surface.js',
    'components/planet-landing.js',
    'components/storm-system.js',
    'components/ambient-audio.js',
    'components/voice-command.js'
  ].map(p => `<script src="${p}"></script>`).join('\n');
  if (html.includes('</head>')) {
    html = html.replace('</head>', scripts + '\n</head>');
    fs.writeFileSync(htmlPath, html);
    console.log('Injected component <script> tags into solar-system/index.html');
  } else {
    console.log('No </head> tag found - please add these script tags manually:\n' + scripts);
  }
} else {
  console.log('Please replace the marker <!-- COMPONENTS-INJECT --> in solar-system/index.html with component script tags.');
}

