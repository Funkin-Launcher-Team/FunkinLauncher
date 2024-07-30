#!/bin/sh
clear
cd ..
npm i
npm i electron --save-dev
curl https://ffm-backend.web.app/source-code/bgv.mp4 -o static/bgv.mp4
npm test
