# A Simple Solution for multiscreen Presentations and Theatrical Beamer Visuals

Features:

- Realtime Web Controller
- Transitions
- Calibration tool for Spatial Mapping
- Several Presentations at the same time

Supports:
- Image Files (png, jpg, gif)
- Black Screens (.black)
- Keeping Slides (.keep)

# How to create a Presentation
- create new folder in /cdn/

```mkdir ./cdn/beamer/ ```


- add images and videos

```
Beamer
│       another_file.png
│       filename.png
│       hooray.mp4
│       wow.gif
```

- rename them to the order they are supposed to play in

```
Beamer
│       1.png
│       2.png
│       4.mp4
│       5.gif
```

- if you leave numbers out, the previous slide will stay until the next slide comes up, or add \[slide\].keep
- create a File named \[slide\].black in order to let the presentation black out
```
Beamer
│       1.png
│       2.png
│       3.keep
│       4.mp4
│       5.png
│       6.black
```
- to add transitions name the file \[slide\]-\[transition\].png. Options: 
    - ✔️ in     <- fades from black
    - ✔️ out    <- fades to black
    - ✔️ inout  <- fades from and to black
    - ❌ shake it all about
    - ... blend  <- blends to next slide
    - ... inblend <- fades from black and blends to next slide
    - 

```
Beamer
│       1-inout-5-1.png
│       2-blend-1-5.png
│       3-blend-1-5.keep
│       4-out-1-5.mp4
│       5.gif
│       6.black
```

- open a folder in the Beamersystem Terminal, then ```node index.js```
- connect your devices to the same network. In the browser open \[Your Device IP\]:3000 
