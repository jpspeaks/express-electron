const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const superagent = require('superagent');
const fileExtension = require('file-extension');

app.use(cors());

app.get('/', function(req, res) {
  res.json('Hello World');
});

app.get('/releases/:assetID/:assetName', async (req, res) => {
  const url = `https://api.github.com/repos/Umbra-Digital-Company/umbra-pos-system/releases/assets/${req.params.assetID}`;
  console.log(req.params.assetID);
  console.log(req.params.assetName);
  superagent
    .get(url)
    .set({
      'User-Agent': 'react-tauri-app',
      Accept: 'application/octet-stream',
      Authorization: 'token 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'
    })
    .pipe(res)
    .on('error', err => console.log('eeeeeeeeeeeeeeeee', err))
    .on('finish', () => {
      console.log('finishhhhhhhhhhhhhhh');
    });
});

app.get('/:target/:currentVersion', async (req, res) => {
  console.log('checking...');
  const url = 'https://api.github.com/repos/Umbra-Digital-Company/umbra-pos-system/releases/latest';
  let zipAssetID, zipAssetName, sigAssetURL;

  try {
    const releaseRes = await superagent.get(url).set({
      'User-Agent': 'react-tauri-app',
      Accept: 'application/vnd.github+json',
      Authorization: 'token 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'
    });
    console.log(releaseRes._body);

    const version = releaseRes._body.tag_name;
    const pubDate = releaseRes._body.published_at;

    if (version === req.params.currentVersion) return res.status(204).end();

    releaseRes._body.assets.forEach(asset => {
      if (fileExtension(asset.name) === 'sig') {
        sigAssetURL = asset.url;
      }
      if (fileExtension(asset.name) === 'zip') {
        zipAssetID = asset.id;
        zipAssetName = asset.name;
      }
    });

    if (!zipAssetID || !sigAssetURL) {
      res.status(204).end();
    }

    superagent
      .get(sigAssetURL)
      .set({
        'User-Agent': 'react-tauri-app',
        Accept: 'application/octet-stream',
        Authorization: 'token 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'
      })
      .pipe(fs.createWriteStream('key.zig'))
      .on('error', () => {
        res.status(204).end();
      })
      .on('finish', () => {
        const key = fs.readFileSync('key.zig', { encoding: 'utf8' });
        console.log(key);
        console.log(
          `https://21f1-2001-fd8-641-fa8-88d5-e2b8-7732-f7c2.ngrok.io/releases/${zipAssetID}/${zipAssetName}`
        );
        res.json({
          url: `https://21f1-2001-fd8-641-fa8-88d5-e2b8-7732-f7c2.ngrok.io/releases/${zipAssetID}/${zipAssetName}`,
          version: version.split('v')[1],
          notes: 'New update',
          pub_date: pubDate,
          signature: key
        });
      });
  } catch (error) {
    console.log(error);
    res.status(204).end();
  }
});

app.listen(8000, () => {
  console.log('Listening to port 8000');
});
