# MOE REPlay

## What is this repository for?

- MOE REPlay can parse HLS manifests and create live manifests on the fly
- Version 1.0

## How do I get set up?

- cd to re-live-manifest root directory
- $npm install -g typescript (if you don't have typescript installed)
- $npm install -g typings (if you don't have typings installed)
- $npm install
- $npm run compile
- modify "localPath" in projectDir/src/config/configuration.json to point to the local "temp" folder, example: /opt/realeyes/re-live-manifest/app/temp/ MAKE SURE THERE IS A TRAILING SLASH ON THE PATH
- modify "localUrl" in projectDir/src/config/configuration.json to point to the local server url, example: http://re-manifester.com/ MAKE SURE THERE IS A TRAILING SLASH ON THE URL
- $npm start

## How to run

- Use the endpoint in an HLS player: http://<hostname>.com/manifest?manifest=<manifestURL>&token=<tokenString>&startTime=0&type=m3u8
  - http://<hostname>.com : the local server url
  - <manifestURL> : the url where an HLS manifest is hosted
  - <tokenString> : the token used for authenticating with the host of the manifest
- Right now the startTime and type are optional (until start time and different manifest type features are added)
- If there is no token needed, omit that part of the query completely: http://<hostname>.com/manifest?manifest=<manifestURL>&startTime=0&type=m3u8

### Sample endpoint in production

http://relm.realeyes.com/manifest?manifest=http://www.streambox.fr/playlists/x36xhzz/x36xhzz.m3u8&startTime=0&type=m3u8

## Who do I talk to?

- Phil Moss phil@realeyes.com
