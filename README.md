# ilknur budak

Portfolio site. Three works, each running live in the browser, plus an about page.
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
| 03 | paintsound | Draw a line, hear it. Horizontal is time, vertical is pitch. |

## Structure

```
index.html          the shell: column, catalogue, stage
style.css
script.js           which work loads into the stage
works/
  grid/             single file
  echo-masks/       p5.js
  paintsound/       Web Audio
  about/
arsiv/              works kept out of the catalogue, not linked from the site
  kolaj/            single file, canvas 2D and WebGL2
  canvas/           layer engine in src/, sample drawing in assets/
  ink/              WebGL2, needs a browser that supports it
  recursive/        multi page; web/ holds the pages, assets/ the data
  nnc/              built from the no-noob-color repo
```

## Notes

Each work lives in its own frame, so one work cannot reach into another or into the
page around it. Sound never starts on its own: Generative Grid and paintsound wait
for a click, as browsers require.

`arsiv/` holds works that are no longer in the catalogue. Their files stay in the
repository and still run, but nothing on the site links to them.
