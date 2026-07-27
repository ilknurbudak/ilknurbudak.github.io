# ilknur budak

Portfolio site. Eight works, each running live in the browser, plus an about page.
No build step, no dependencies: open `index.html` and it runs.

Live at [ilknurbudak.github.io](https://ilknurbudak.github.io)

## Layout

One screen. The left column holds the name, the catalogue and the contact links, and
belongs to nothing else. The stage on the right holds one work at a time, loaded in a
frame. Each work keeps its own controls on the right, at the same width, so moving
between works does not move the furniture.

Every work carries a colophon in the bottom left: name, title, and whatever that work
uses as its variable, whether palette, seed, preset or page. It is drawn with
`mix-blend-mode: difference`, so it inverts itself against whatever sits behind it.

## Works

| # | Work | What it is |
|---|------|-----------|
| 01 | Generative Grid | A grid of colour dissolving and reforming in bilateral symmetry. Each colour triggers its own note. |
| 02 | Echo Masks | Brush strokes accumulating along flow fields. The brain reads them as faces. |
| 03 | Collage Workbench | A seeded gestural collage generator. Abstract prints laid out as collage pages. |
| 04 | CANVAS | A workbench for hand drawings. Every frame is a function of time, so the loop closes seamlessly. |
| 05 | paintsound | Draw a line, hear it. Horizontal is time, vertical is pitch. |
| 06 | ink | A drawing read as a mask; its interior and rim fill with ink that keeps flowing. Per pixel on the GPU. |
| 07 | The Recursive Human | A digital palimpsest installation, read page by page. Four drawings as a dataset. |
| 08 | no noob color | A persona-aware colour palette tool built on CIELAB, OKLab, ACES, HCT and CIEDE2000. |

## Structure

```
index.html          the shell: column, catalogue, stage
style.css
script.js           which work loads into the stage
works/
  grid/             single file
  echo-masks/       p5.js
  kolaj/            single file, canvas 2D and WebGL2
  canvas/           layer engine in src/, sample drawing in assets/
  paintsound/       Web Audio
  ink/              WebGL2, needs a browser that supports it
  recursive/        multi page; web/ holds the pages, assets/ the data
  nnc/              built from the no-noob-color repo
  about/
```

## Notes

Each work lives in its own frame, so one work cannot reach into another or into the
page around it. Sound never starts on its own: Generative Grid and paintsound wait
for a click, as browsers require.

`no noob color` runs here without its backend, so the parts that need a server are
not in this build: no sign in, no account, no prompt generation, no photo extraction.
The interface, the colour science and the exports work.

The Recursive Human's loop asks for the camera. Nothing is uploaded; the frames stay
in the browser.
