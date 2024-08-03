# FunkinLauncher

An AIO tool for managing FNF installations.

# Credits

<table style="width:90%">
  <tr>
    <th><a href="https://www.errico.dev/?ref=flauncher">toperri</a></th>
    <th><a href="https://heroeyad.github.io/">HeroEyad</a></th>
    <th><a href="https://x.com/Sector03_">Sector03</a></th>
  </tr>
  <tr>
    <td>
      <img src="https://www.errico.dev/assets/ProfilePicture.png" alt="toperri" width="90" height="90">
    </td>
    <td>
       <img src="https://github.com/user-attachments/assets/c507b4f7-0234-4903-b5c6-42041c0335ea" alt="HeroEyad" width="90" height="90">
    </td>
    <td>
       <img src="https://github.com/user-attachments/assets/405d1106-e986-48a6-8f94-21d592dec931" alt="Sector03" width="90" height="90">
    </td>
  </tr>
  <tr>
    <td>Programmer</td>
    <td>Programmer</td>
    <td>Artist</td>
  </tr>
</table>

"Fuzzfreak" composed by [Jukestar](https://jukestar.newgrounds.com/)

# How to run
<br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/0ec16fcd-15a7-4b6c-93a0-67d4ecb1d92c" width="300">
</p>

<br>

Since this app is built on Electron, you will need to install <a href="https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi">Node.js</a> to run the app from source code. After that...

1) Use ``npm i`` to install all dependencies required for the app to function.
2) Also install Electron with ``npm install electron --save-dev``.
3) Use ``curl https://raw.githubusercontent.com/toperri/camerawork/main/camerawork.js -o static/js/camerawork.js`` to download the latest version of camerawork (NOTICE: camerawork is hosted under another license!)
4) You can now use ``npm test`` to run the app (or use ``open.bat``)

# Building

1) Download Electron prebuilts from their GitHub page
2) After downloading the prebuilts, extract them, open the "resources" folder and delete the "default_app" file.
3) Create an "app" folder in "resources".
4) In the "app" folder put the whole GitHub repo contents except for README, .gitignore, .gitattributes, dbfile and the rfc-buildhost pdf file.

# License

This work is licensed under CC BY-NC-SA 4.0. That means you may redistribute this work and modify it as long as you credit all of the developers of the launcher.
