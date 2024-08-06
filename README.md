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
      <img src="art/toperri.png" alt="toperri" width="90" height="90">
    </td>
    <td>
       <img src="art/heroeyad.jpg" alt="HeroEyad" width="90" height="90">
    </td>
    <td>
       <img src="art/sector.png" alt="Sector03" width="90" height="90">
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

1) Use ``npm install --global yarn`` to install Yarn.
2) Use ``yarn install`` to install all dependencies required for the app to function.
3) You can now use ``yarn test`` to run the app (or use ``open.bat``)

# Building

1) Use ``npm install --global yarn`` to install Yarn.
2) Use ``yarn install`` to install all dependencies required for the app to function.
3) Use ``yarn build-win`` to build for Windows. [^1]
4) Funkin Launcher will be built into the ``/dist`` folder.

[^1]: Use ``yarn build-linux`` to build for Linux or ``yarn build-osx`` to build for Mac (you WILL need to edit the source code in order to support other OSes.)

# License

This work is licensed under CC BY-NC-SA 4.0. That means you may redistribute this work and modify it as long as you credit all of the developers of the launcher.
