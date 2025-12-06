const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// FIX 1: Explicit Route (Base Team Suggestion)
// We send the JSON directly to avoid any file-reading errors
app.get('/.well-known/farcaster.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    "accountAssociation": {
      "header": "",
      "payload": "",
      "signature": ""
    },
    "baseBuilder": {
      "ownerAddress": "0x3A8D692Aabdd4981080a8F6af8375a21359464Bf"
    },
    "miniapp": {
      "version": "1",
      "name": "Scicon Shooter",
      "homeUrl": "https://sciconshooter.xyz",
      "iconUrl": "https://sciconshooter.xyz/icon.png",
      "splashImageUrl": "https://sciconshooter.xyz/icon.png",
      "splashBackgroundColor": "#000000",
      "primaryCategory": "games",
      "tags": ["games", "shooter"],
      "description": "A sci-fi shooter game on Base."
    }
  }));
});

// FIX 2: Static Files with Dotfiles allowed (Base Team Suggestion)
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));
app.use(express.static(__dirname));

// Catch-All
app.get('*', (req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  if (require('fs').existsSync(publicIndex)) {
    res.sendFile(publicIndex);
  } else {
    res.send('Scicon Shooter Loading...');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});