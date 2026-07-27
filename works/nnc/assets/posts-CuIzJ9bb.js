const e=[{slug:"color-science-foundations",eyebrow:"Foundations",title:"Color is not what your screen says it is",lead:"A pixel value is a number. The color you actually see is a negotiation between physics, biology, and a long chain of decisions made by people you'll never meet.",readingTime:"6 min",sections:[{type:"prose",body:`Color science begins with a deeply uncomfortable fact: there is no such thing as "the" color of an object. What we call color is the brain's interpretation of how a surface reflects, absorbs, and re-emits photons across a narrow slice of the electromagnetic spectrum. The same shirt looks different under fluorescent office lighting, a sunset, and a phone flash — and it is different, in the only sense that matters.

The job of color science is to make this messy, perceptual phenomenon **measurable, transferrable, and reproducible**. From the first CIE 1931 standard observer experiments — where humans matched mixtures of red, green, and blue lights to test colors viewed through a 2-degree aperture — to today's perceptually uniform OKLab and OKLCH spaces, every color model is an attempt to pin down something that fundamentally lives between the world and the visual cortex.

This blog won't teach you everything. It can't. But it will give you the working vocabulary you need to **trust** the colors you ship — to your screen, to a Procreate canvas, to a printer, or to another pair of human eyes.`},{type:"demo",component:"lab"},{type:"prose",body:`Try the converter above. Drag the RGB sliders and watch the L*, a*, b* values shift. Notice how a small change in green produces a large jump in L\\* — that is *not* a quirk of the math. It is the math accurately reflecting the fact that the human eye is dramatically more sensitive to the green portion of the spectrum than to red or blue.

That single insight — perceptual non-uniformity — is the reason CIELAB exists, the reason WCAG contrast ratios weight green heavily, and the reason your "neutral gray" looks slightly green or magenta on different displays.`}],sources:[{title:"Colour Science Resources Hub",url:"https://www.colour-science.org/",blurb:"Most comprehensive starting point for color science."},{title:"Awesome Colour (GitHub)",url:"https://github.com/colour-science/awesome-colour",blurb:"Curated list of color libraries, tools, and articles."}]},{slug:"rgb-cmyk-hex-when-which-why",eyebrow:"Color Modes",title:"RGB, CMYK, HEX — when each one is the right answer",lead:"These are not interchangeable formats. They model different physical realities. Mix them up and you get muddy print, washed-out screens, or a brand color that drifts every time it crosses a medium.",readingTime:"5 min",sections:[{type:"prose",body:"**RGB** is **additive**: you start in the dark and add light. Red + Green + Blue at full intensity produces white. This is how every screen works — phones, monitors, projectors. Pixel values are literally instructions for how brightly to fire three light emitters.\n\n**CMYK** is **subtractive**: you start with white paper and subtract reflected light by adding ink. Cyan + Magenta + Yellow theoretically produces black, but in practice produces muddy brown, which is why a separate **K**ey (black) channel is added. CMYK is for ink on paper — offset printing, posters, packaging.\n\n**HEX** is just RGB in a different costume. `#FF8800` is exactly `rgb(255, 136, 0)`. The hex notation is shorter, easier to paste, and historically associated with the web — but underneath it's the same additive light model."},{type:"quote",body:"If you design a brand identity in RGB and hand the print shop a HEX swatch, they will silently translate it through their CMYK profile and the result will not be the color you approved."},{type:"prose",body:`**Rule of thumb:**

- **Screens, web, video, UI** → RGB (or its HEX shorthand)
- **Print, packaging, fabric** → CMYK
- **Cross-medium brand assets** → specify in CIELAB or Pantone, then translate to RGB and CMYK separately for each output

The single biggest mistake junior designers make is treating "the same number" as "the same color". A \`#FF8800\` orange on your monitor is wider-gamut than any CMYK printer can reproduce. The color you saw isn't the color that ships.`},{type:"demo",component:"gamut"}],sources:[{title:"RGB vs CMYK vs HEX — when to use which",url:"https://www.geeksforgeeks.org/difference-between-rgb-and-cmyk-color-model/",blurb:"Practical comparison of digital and print color modes."}]},{slug:"hsl-hsv-why-ui-loves-them",eyebrow:"Color Models",title:"HSL and HSV — why every UI tool ships them",lead:"Designers don't think in (255, 136, 0). They think 'orange, vivid, slightly muted'. HSL and HSV are the color models that match how your hand reaches for the picker.",readingTime:"4 min",sections:[{type:"prose",body:`RGB is excellent for telling a screen what to do, terrible for telling a designer what they want. "Make it more orange" is not a coordinate move in RGB space — it's a hue rotation, which means juggling three values at once.

HSL and HSV decouple the three things humans actually *think about*:

- **Hue** — what color (a position on the rainbow, 0-360°)
- **Saturation** — how vivid (gray to neon)
- **Lightness** (HSL) or **Value** (HSV) — how light or dark

Pick a hue, then dial in saturation and lightness independently. This is why every color picker — Photoshop, Figma, Procreate, browser dev tools — gives you HSL/HSV controls.`},{type:"demo",component:"hue"},{type:"prose",body:'**HSL vs HSV** — the difference matters less than you\'d think:\n\n- **HSV** treats "Value" as raw brightness. `V=1` is the most vivid version of a color. Pure red is `HSV(0, 100%, 100%)`.\n- **HSL** treats "Lightness" symmetrically. `L=50%` is the most vivid version; `L=100%` is white, `L=0%` is black. Pure red is `HSL(0, 100%, 50%)`.\n\nHSL is more intuitive for tints/shades (raise lightness for tints, lower for shades). HSV is more intuitive for picking the most saturated version of a hue. Most modern tools default to HSL.\n\n**Critical caveat:** neither is *perceptually* uniform. Two colors with the same HSL lightness can look dramatically different in apparent brightness — which is why CIELAB and OKLCH exist. HSL is convenient; Lab is honest.'}],sources:[{title:"HSL and HSV Explained",url:"https://www.rapidtables.com/convert/color/rgb-to-hsl.html",blurb:"Reference guide for HSL/HSV models and conversion math."}]},{slug:"cielab-the-honest-color-space",eyebrow:"Perceptual Color",title:"CIELAB — the color space that respects your eyes",lead:"RGB and HSL are about pixels and convenience. Lab is about perception. If you have ever wondered why two colors with the same brightness slider look different — Lab is the answer.",readingTime:"6 min",sections:[{type:"prose",body:"**CIELAB** (also written L\\*a\\*b\\* or just Lab) was designed in 1976 with one goal: a color space where the **distance between two points equals how different they look to a human**. RGB does not do this — a step from `(50, 50, 50)` to `(50, 100, 50)` is the same numerical distance as `(150, 150, 150)` to `(150, 200, 150)`, but the first jump is far more visually dramatic.\n\nLab has three axes:\n\n- **L\\*** — Lightness, 0 (black) to 100 (white). Roughly logarithmic in luminance, matching the eye's response.\n- **a\\*** — Green-Red axis, negative is green, positive is red.\n- **b\\*** — Blue-Yellow axis, negative is blue, positive is yellow.\n\nThe opponent-color axes (a\\* and b\\*) come from how the visual cortex actually processes signals from cone cells. We see red *or* green, blue *or* yellow — never both. Lab encodes this directly."},{type:"quote",body:"Almost every serious palette extraction tool — including this one — runs k-means clustering in Lab, not RGB. Cluster centroids in RGB land near the most numerous pixels; centroids in Lab land near the most perceptually distinct ones."},{type:"prose",body:`**Why this matters for tools like no noob color:**

When you drop a photo and we extract a 5-color palette, we convert every pixel to Lab, run k-means, and convert back. The result is a palette that matches what your *eye* picks out as dominant — not what a naive average of pixel values produces. Try the same image in a tool that clusters in RGB and you'll get muddier, less distinguishable swatches.

Newer perceptual spaces — **OKLab** (2020) and **OKLCH** — fix some of CIELAB's remaining quirks (especially around blue and dark colors) and are slowly becoming the modern default. But for most working tools, CIELAB is still the workhorse.`}],sources:[{title:"CIELAB Color Space",url:"https://www.hunterlab.com/blog/color-measurement-2/cielab-and-cieluv-color-spaces/",blurb:"Industry-standard intro to CIELAB and human perception."},{title:"Python Colour Documentation",url:"https://www.colour-science.org/",blurb:"Industry-grade color math: CIE, ICC, OKLab, CIECAM."}]},{slug:"wcag-contrast-and-why-it-matters",eyebrow:"Accessibility",title:"Contrast ratios — why your beautiful palette might fail",lead:"Designed something gorgeous and discovered low-vision users can't read it? The math behind that failure is older than the web and stricter than your aesthetic instincts.",readingTime:"5 min",sections:[{type:"prose",body:`WCAG (Web Content Accessibility Guidelines) defines contrast as a ratio between the **relative luminance** of two colors. Luminance is computed by:

1. Linearizing each RGB channel (gamma decode)
2. Weighting them by human sensitivity: \`L = 0.2126·R + 0.7152·G + 0.0722·B\`
3. Computing the ratio \`(brighter + 0.05) / (darker + 0.05)\`

Note the green coefficient: **71% of perceived brightness comes from the green channel**. A pure-green text on white is far less contrasty than the RGB values suggest, which is why "lime green on white" is the canonical accessibility disaster.`},{type:"demo",component:"contrast"},{type:"prose",body:`**The thresholds:**

- **AA normal text** — ratio ≥ 4.5:1
- **AA large text** (≥ 18pt or ≥ 14pt bold) — ratio ≥ 3.0:1
- **AAA normal text** — ratio ≥ 7.0:1
- **AAA large text** — ratio ≥ 4.5:1

Most designers aim for AA on body copy and AAA on critical UI (form labels, error messages, anything you must read). Brand-color buttons frequently fail AA against white backgrounds — which is why the "darker hover" trend exists; it pushes the resting state into compliance.

**WCAG 3.0** (still draft) replaces this ratio with **APCA** — Advanced Perceptual Contrast Algorithm — which accounts for font weight and size and is significantly more accurate. But until it's standardized, AA/AAA is what audits check.`}],sources:[{title:"Awesome Colour (GitHub)",url:"https://github.com/colour-science/awesome-colour",blurb:"Includes contrast and accessibility tooling."}]},{slug:"material-color-utilities",eyebrow:"Modern Systems",title:"Material 3 — Google's bet on dynamic, perceptual color",lead:"Material You doesn't pick colors — it derives them from a single seed using HCT, an OKLab-adjacent perceptual model. The result is theming that adapts without ever picking 'the wrong shade of blue'.",readingTime:"5 min",sections:[{type:"prose",body:`Google's **Material Color Utilities** is the open-source library behind Material Design 3 (Material You) — the system that powers dynamic theming on Android and Google products. It does something no traditional design system does: it **generates an entire palette from one seed color**, dynamically, while guaranteeing accessibility.

The trick is **HCT** — Hue, Chroma, Tone — a custom color space derived from CAM16 (a perceptual model). Unlike HSL, HCT's "tone" axis maps directly to perceived lightness, so a tone-50 surface and a tone-50 accent feel equally bright regardless of hue.`},{type:"prose",body:`**What this enables:**

- **Single-seed theming** — extract one color from a wallpaper, generate light/dark themes, primary/secondary/tertiary roles, and 13 tonal stops per role
- **Guaranteed accessibility** — every text-on-surface combination is tone-aware, so contrast is mathematically enforced
- **Smooth adaptation** — the same seed produces a coherent look across thousands of screens without designers ever picking individual shades

For the no noob color persona system, this is the model we eventually steal: a single user-picked color → an entire app-ready palette with WCAG guarantees baked in. Right now we hand-pick harmonies; Material 3 hand-picks *less* and lets the math do the rest.`},{type:"quote",body:"Material 3 is what happens when a design system stops trusting designers to enforce contrast and starts enforcing it programmatically. The result is more consistent and, importantly, more accessible — without anyone having to remember the rules."}],sources:[{title:"Material Color Utilities (GitHub)",url:"https://github.com/material-foundation/material-color-utilities",blurb:"Google's open-source library powering Material 3."}]},{slug:"aces-and-opencolorio",eyebrow:"Production",title:"ACES and OpenColorIO — color management for everything that moves",lead:"Film, animation, VFX, and games all face the same problem: a color that goes through eight stages of pipeline must come out the same. ACES and OCIO are how that promise is kept.",readingTime:"6 min",sections:[{type:"prose",body:`If you have ever worked in film or VFX, you have heard "we're working in ACES" or "the OCIO config is in the project root". These are not quirks — they are the industry's solution to a problem that gets exponentially worse the bigger your pipeline gets.

**ACES (Academy Color Encoding System)** is an open color management standard maintained by the Academy of Motion Picture Arts and Sciences. It defines:

- A **wide-gamut working space** (ACEScg) large enough to hold any camera's native colors plus headroom for grading
- **Input Device Transforms (IDTs)** for every major camera (RED, ARRI, Sony, etc.)
- **Reference Rendering Transforms (RRTs)** that convert the linear scene-referred light into a viewable image
- **Output Device Transforms (ODTs)** for every viewing condition — Rec.709 TV, P3 cinema, Dolby Vision HDR, etc.`},{type:"prose",body:`**OpenColorIO (OCIO)** is the open-source library that *implements* ACES (and other color pipelines) inside the actual tools — Nuke, Maya, Blender, DaVinci Resolve, Houdini, Unreal, Unity. A single \`config.ocio\` file describes every color space and transform; every artist on the project sees the same color regardless of their software.

For a single-developer color tool like no noob color, ACES is overkill — we're not grading 8K RAW footage. But the *idea* — separating "where the color comes from", "where it lives in the pipeline", and "where it's displayed" into three explicit transforms — is the discipline that makes color profiles (sRGB / Display P3 / Adobe RGB / CMYK) actually mean something.

When you toggle the profile picker in this app, you are doing exactly what OCIO does: keeping the underlying color data constant and changing only the **output transform**.`}],sources:[{title:"Academy Color Encoding System (ACES)",url:"https://acescentral.com/",blurb:"Industry standard for film/VFX color management."},{title:"OpenColorIO",url:"https://opencolorio.org/",blurb:"Open-source color management for VFX and animation."}]},{slug:"ten-years-of-colour-science",eyebrow:"Ecosystem",title:"Ten years of Colour — the Python library that grew up with the web",lead:"When Thomas Mansencal started colour-science in 2013, color math in Python meant rolling your own matrix transforms. A decade later, it is the rigor underneath dozens of tools — including this one.",readingTime:"4 min",sections:[{type:"prose",body:`**colour-science** (the Python package, with the British spelling) is the de-facto standard for serious color computation in Python. If you need CIE 1931, CAM16, OKLab, ICC profiles, spectral distributions, illuminants, observers, or any of the dozens of named color spaces — colour-science has them, with full test coverage and academic citations.

It is what we use in this app's Python microservice for:

- Mode-snapped k-means in Lab/OKLab (extract route)
- Rigorous WCAG luminance computation (contrast route)
- Round-trip color space conversions (convert route)
- Six harmony rules computed in HSV with Lab-aware seed selection (harmonize route)`},{type:"prose",body:`**Why a Python microservice instead of pure JavaScript?**

JavaScript color libraries (chroma.js, colord, culori) are excellent for the web's needs — fast, small, well-typed. But they are deliberately scoped: most don't ship CIECAM, none ship spectral distributions, and the ICC profile handling is limited.

For a tool that aims to be *correct* across mediums (not just "looks right on the screen I designed it on"), a Python service backed by colour-science gives you industry-grade math without reinventing it. The frontend stays small; the heavy lifting happens in 30 lines of Python that delegate to a battle-tested library.

The lesson generalizes: **you don't need to choose between a beautiful frontend and rigorous math.** A microservice boundary lets the right tool do each job.`}],sources:[{title:"10 Years of Colour Science",url:"https://www.colour-science.org/",blurb:"Retrospective on the library's first decade."},{title:"Python Colour Documentation",url:"https://www.colour-science.org/",blurb:"Reference docs covering CIE, ISO, OKLab, and more."}]}];e.push({slug:"ciede2000-deep-dive",eyebrow:"Math",title:"CIEDE2000 — the formula behind 'how different is this?'",lead:"Every time you ask 'are these two colors close enough?' there is a number. The number you actually want is CIEDE2000, and it is older and weirder than you think.",readingTime:"7 min",sections:[{type:"prose",body:`In 1976, the CIE published L\\*a\\*b\\* with the promise that **Euclidean distance in this space approximates perceived color difference**. The formula was simple: \`ΔE76 = sqrt((L1-L2)² + (a1-a2)² + (b1-b2)²)\`. One number, no parameters, easy to compute.

It was wrong in places. Specifically: in the blue corner of color space, ΔE76 overestimated differences. In the gray-near-neutral region, it underestimated. Two colors that humans called identical produced ΔE76 = 5; two colors humans called clearly different produced ΔE76 = 3. The formula's foundational claim — that Lab is perceptually uniform — broke under scrutiny.

The CIE responded with **CIE94** in 1994, which weighted the differences in chroma and hue separately. Better in saturated regions, still flawed in the dark blues. The fix wasn't done.

**CIEDE2000** arrived in 2000 with five corrections layered on top of CIE94:

1. A hue-rotation correction in the blue region (where CIE94 still failed)
2. A compensation for low chroma differences appearing larger than they are
3. A weighting that recognizes the eye is more sensitive to lightness in mid-tones than in extremes
4. A neutral-color correction that prevents grays from inflating ΔE
5. Reference conditions (kL, kC, kH) for adjusting based on viewing context`},{type:"quote",body:"ΔE2000 is not pretty math. It is empirically derived, full of magic numbers, and slow to compute. But it is the closest formula we have to 'how different do these two colors actually look?'"},{type:"prose",body:`**The thresholds in practice:**

- ΔE < 1 — imperceptible to the human eye, even side-by-side
- ΔE 1-2 — close inspection only; print proofing tolerance
- ΔE 2-10 — perceptible at a glance; brand color drift territory
- ΔE 10-49 — clearly distinct colors
- ΔE 50+ — opposite ends of color space (red vs cyan, etc)

In this app's contrast/delta-e endpoint, all three (CIE76, CIE94, CIEDE2000) are exposed. CIE76 is fastest, CIEDE2000 is most accurate, CIE94 sits in the middle.

**Where you actually use it:**
- Pantone closest-match search (which PMS code is nearest to your hex?)
- Quality control in printing (is this proof close enough to the master?)
- Library duplicate detection (are these two saved palettes effectively the same?)
- Color theme generation (am I picking distinct enough accents?)`}],sources:[{title:"CIEDE2000 (Wikipedia)",url:"https://en.wikipedia.org/wiki/Color_difference#CIEDE2000",blurb:"Reference implementation + history."},{title:"Sharma, Wu, Dalal — implementation paper",url:"https://www.imaging.org/",blurb:"The canonical 2005 paper with all the corrections explained."}]},{slug:"oklab-vs-cielab",eyebrow:"Modern Color",title:"OKLab and OKLCH — Lab grew up in 2020",lead:"CIELAB has been the standard for 50 years. Then in 2020, a Swedish engineer noticed it had problems with blue and dark colors and quietly fixed them.",readingTime:"5 min",sections:[{type:"prose",body:`**OKLab** was published by Björn Ottosson in December 2020 as a free, open-source alternative to CIELAB. It was a single-author project. It is now in the CSS specification (\`oklch()\` is supported in every modern browser) and increasingly the default choice for new color tools.

The problem OKLab solves is specific: **CIELAB's perceptual uniformity breaks at the extremes**. Two colors at the same Lab L\\* value (lightness) but different hues can look noticeably different in brightness — especially in the deep blue region, where Lab consistently overstates lightness, and in highly saturated colors, where Lab's a\\*/b\\* axes shear in unintuitive ways.

OKLab uses a different optimization target: it fits human perceptual data more carefully in the modern wide gamuts (P3, Rec.2020) that didn't exist when CIELAB was designed in 1976. The math is similar — a 3x3 matrix into a perceptual intermediate, then a non-linear curve, then another 3x3 matrix — but the constants are different.`},{type:"demo",component:"lab"},{type:"prose",body:`**Why OKLCH (cylindrical OKLab) is the practical winner:**

OKLab gives you L (lightness), a (green-red), b (blue-yellow). Useful for math, hard for designers.

OKLCH gives you L (lightness), C (chroma), H (hue, 0-360°). Same coordinate space, but in a form designers can think in: "rotate the hue, keep the chroma and lightness". This is what HSL/HSV pretend to do but don't actually deliver perceptually.

**In CSS:**
\`\`\`css
:root {
  --primary: oklch(70% 0.18 290);     /* lavender */
  --primary-dark: oklch(40% 0.18 290); /* same hue + chroma, darker */
}
\`\`\`

The dark version is *guaranteed* to feel like a darker version of the same color. With HSL, you'd lower lightness and the hue might appear to shift. With OKLCH, only L changes.

**This app uses OKLab/OKLCH for:**
- The 11-stop tonal palette generator (\`/tones/generate\`)
- Lab-fallback in extract endpoints
- Material 3 theming (HCT is also CAM-derived, related family)

CIELAB is fine for backward compatibility and image processing. OKLab is the design system answer for the next decade.`}],sources:[{title:"Björn Ottosson — A perceptual color space for image processing",url:"https://bottosson.github.io/posts/oklab/",blurb:"The original 2020 OKLab paper and motivation."},{title:"CSS Color Module Level 4",url:"https://www.w3.org/TR/css-color-4/",blurb:"Spec for oklab(), oklch() in CSS."}]},{slug:"k-means-math",eyebrow:"Algorithm",title:"k-means in 30 lines — and why we run it in Lab",lead:"The algorithm behind every 'extract palette from photo' button. It's older than your laptop, simpler than you'd guess, and one trick keeps the output honest.",readingTime:"5 min",sections:[{type:"prose",body:`**k-means clustering** picks K representative points from a cloud of N data points, minimizing the sum of squared distances from each point to its nearest representative. Published in 1957, used everywhere from market segmentation to compression to (here) palette extraction.

The algorithm:

1. Pick K random pixels as initial centroids.
2. Assign each pixel to its nearest centroid.
3. Recompute each centroid as the mean of its assigned pixels.
4. Repeat 2-3 until centroids stop moving.

That's it. Convergence is not guaranteed in finite time but in practice happens within 10-20 iterations for image data.

**Why we run it in Lab, not RGB:**

In RGB, "distance" is meaningless to a human. The Euclidean distance from \`(50, 50, 50)\` to \`(50, 100, 50)\` equals the distance from \`(150, 150, 150)\` to \`(150, 200, 150)\`, but the first jump is far more visually dramatic. Cluster centroids in RGB therefore land in the wrong places — pulled toward the most numerous pixels, not the most perceptually distinct ones.

In Lab, distance is roughly proportional to perceived difference. Centroids land where humans would say "that's a distinct color" — which is the entire point of palette extraction.`},{type:"quote",body:"Switch the same image's k-means from RGB to Lab and you'll usually see at least one swatch shift dramatically — the algorithm finds a perceptually meaningful color that the RGB-space run completely missed."},{type:"prose",body:`**The mode-snap trick:**

After k-means converges, the K centroids are *averaged colors*. They mathematically represent each cluster but don't necessarily correspond to any real pixel in the image. Take a photo of a sunset where pixels are split between deep magenta and bright orange — the centroid lands on a muddy brown that's in neither part of the photo.

The fix: after computing centroids, replace each one with the **most common quantized pixel** in its cluster. Quantize to (e.g.) 8-bit-per-channel buckets, count frequencies, pick the mode. The resulting palette is guaranteed to consist of colors that actually appear in the image.

This is what \`/extract/kmeans\` does by default. The endpoint exposes \`color_space\` (lab, rgb, oklab) so you can compare; the mode-snap is always on.

**When K=5 and N=400×400=160,000 pixels:**

- ~20 iterations × 160K pixels × 5 distance calcs each = ~16M operations
- numpy vectorizes this into a single 5×3 matrix subtraction broadcast over 160K vectors
- runs in <100ms on any laptop

The 'AI' marketing for color extraction is, in 99% of cases, this 1957 algorithm.`}],sources:[{title:"k-means clustering (Wikipedia)",url:"https://en.wikipedia.org/wiki/K-means_clustering",blurb:"The 1957 paper, history, and modern variants."},{title:"scikit-learn — KMeans",url:"https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html",blurb:"The implementation we use server-side."}]});const a=[{slug:"tip-cmyk-print-prep",eyebrow:"Tip · 2 min",title:"Your screen lied. Prep for print in three checks.",lead:"Your monitor shows colors that don't physically exist on paper. Three quick checks before you send to the printer save you from muddy disappointment.",readingTime:"2 min",kind:"tip",sections:[{type:"prose",body:`**1. CMYK gamut.** Vibrant cyans, electric greens, neon oranges — most don't survive the trip from RGB to CMYK ink. The Print persona panel flags any swatch that exceeds the printable gamut and suggests a closer print-safe alternative. Use that suggestion as your hand-off color, then approve the original screen color separately.

**2. Total ink coverage.** Each CMYK channel is up to 100%, but stacking them above ~320% causes drying/registration issues on coated paper. The ink density meter tints offending swatches red. Consider boosting the K (black) channel to bring totals down — black ink is cheap; total coverage is expensive.

**3. ICC profile.** FOGRA39 (EU coated), GRACoL (US commercial), SWOP (US news), Japan Color (JP) — your shop will tell you which one they use. The Print panel preset shifts CMYK numbers per profile so you can see how the same brand red drifts between presses.`},{type:"demo",component:"gamut"},{type:"quote",body:"If you only do one thing: ask your shop which ICC profile they use, then preview your palette under it. Everything else flows from that."}],sources:[{title:"Print Designer panel · /generate",url:"/#/generate",blurb:"Live CMYK gamut + ICC + ink density audit."}]},{slug:"tip-instagram-feed-cohesion",eyebrow:"Tip · 2 min",title:"Instagram feed cohesion in one harmony rule",lead:"A unified feed isn't about the same exact filter — it's about a tight hue range. Pick analogous and you can post 100 things without ever 'breaking the grid'.",readingTime:"2 min",kind:"tip",sections:[{type:"prose",body:`**Pick analogous, not complementary.** Complementary palettes (red + cyan) look great in single posts, terrible in a grid — every other tile is screaming at the next. Analogous palettes (warm yellows through warm reds, or cool blues through teals) keep the feed visually quiet while leaving room for individual posts to be bold.

**Cap the saturation range.** Mix 30% high-sat + 70% mid/low-sat. Fully saturated feeds read as desperate; fully muted reads as dead. The Content Creator panel scores your palette's hue range as tight / balanced / loose — aim for tight on IG, looser on TikTok.

**Reserve one disruptor swatch.** Your 5-color palette should have one outlier — a pop you only use for big-moment posts (launch, sale, story arc payoff). That's the 10% in 60-30-10 — applied to your feed instead of a UI.`},{type:"demo",component:"hue"}],sources:[{title:"Content Creator panel · /generate",url:"/#/generate",blurb:"9-grid feed preview, TikTok aesthetic match, consistency audit."}]},{slug:"tip-wcag-text-on-image",eyebrow:"Tip · 3 min",title:"Text-on-image readability — the 4.5:1 trap",lead:"Your hero text passes WCAG AA on a flat color. Drop it onto a photo and that 4.5:1 number becomes a lie. Here's the fix.",readingTime:"3 min",kind:"tip",sections:[{type:"prose",body:`WCAG contrast assumes a single foreground color on a single background color. Photos have hundreds of background colors per pixel — your text might pass over the dark sky and fail over the bright clouds in the same image.

**Three fixes, ranked:**

1. **Text shadow** — \`text-shadow: 0 1px 4px rgba(0,0,0,.45)\`. Cheap, effective, breaks under critical inspection. Fine for hero typography on stable photos.
2. **Solid bar** — put a translucent dark band behind the text only. The contrast becomes deterministic again. Used on every Netflix title card for a reason.
3. **Image gradient overlay** — a 0% → 70% black gradient at the bottom (or matching to your text position) keeps the photo visible while guaranteeing background lightness.

For Stories / Reels / vertical content, the bottom gradient is almost always correct.`},{type:"demo",component:"contrast"},{type:"prose",body:"**The audit move:** sample 10 random pixels from your photo, run each through the WCAG check against your text color, and use the *worst* ratio as your design constraint — not the average."}],sources:[{title:"WCAG 2.1 Contrast",url:"https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",blurb:"Spec text on the 4.5:1 threshold."}]},{slug:"tip-procreate-import",eyebrow:"Tip · 1 min",title:"Procreate .swatches: import every export, not just yours",lead:"Procreate's .swatches format is a tiny ZIP. We export it. Adobe Capture exports it. Pinterest doesn't, but you can fake it.",readingTime:"1 min",kind:"tip",sections:[{type:"prose",body:`On any export menu, hit \`Procreate · .swatches\`. AirDrop the file to your iPad → tap once → it imports straight into Procreate's color palette tab. No Files app dance needed.

**If you got a palette as PNG/JPG**: drop it into Generate's reference image zone. The k-means extracts swatches; export those as .swatches. You just turned a screenshot into a working palette.

**If you got a list of hex codes**: paste them into a quick HTML file with a swatch grid, screenshot it, then route through the same flow. Or skip that — type the hexes manually into Generate's base color one at a time and chain Save calls.

The validated import format passes Procreate 5+ on iPad and macOS Catalyst.`}],sources:[{title:"Procreate Color Palettes",url:"https://help.procreate.com/procreate/handbook/colors/colors-palettes",blurb:"Official handbook on palette files."}]},{slug:"tip-color-blindness-quick-check",eyebrow:"Tip · 1 min",title:"Test for color blindness in three keyboard taps",lead:"9% of male users see red and green as the same color. Your data viz, your status badges, your map legend — check them.",readingTime:"1 min",kind:"tip",sections:[{type:"prose",body:`In Generate, the **Color blindness preview** chip row sits above your palette. Click \`protan\` to simulate protanopia (no red cones, ~1% of males), \`deuteran\` for deuteranopia (no green cones, the most common — ~6% of males), \`tritan\` for tritanopia (no blue cones, rare).

**What to look for:**

- Red and green swatches that become the same yellow-tan. Status indicators using only red/green for "error/success" fail here. Add an icon, a stripe, an outline — anything besides hue.
- Blue and purple becoming indistinguishable. Often hits brand palettes that lean cool.
- Saturated reds dropping to the same brightness as deep greens — kills any "fire vs forest" metaphor.

**Fix:** add a second visual channel (icon, weight, position) for any meaning currently carried by hue alone.`}],sources:[{title:"DaltonLens",url:"https://daltonlens.org/",blurb:"Open color blindness simulation reference."}]},{slug:"tip-naming-your-palettes",eyebrow:"Tip · 2 min",title:"Name palettes for future-you, not present-you",lead:"'Test 4', 'Final', 'New Palette (1)'. Your library is a pile. A naming convention turns it into a system.",readingTime:"2 min",kind:"tip",sections:[{type:"prose",body:'**Three things in every palette name:** the project, the role, the season. `Acme · Hero · SS26`. `Personal Site · Footer · Spring`. `Wedding Inv · Stationery · Aug`.\n\n**Why this works:**\n\n- **Project first** lets you filter Library by typing the project name in search.\n- **Role next** distinguishes between palettes for the same brand (you\'ll have a hero, a body copy, a marketing-only, a docs-only).\n- **Season / date last** means version history is implicit. `Acme · Hero · SS26` and `Acme · Hero · FW26` automatically sort and tell the story.\n\n**Tags pick up the rest.** Add `#warm`, `#minimal`, `#client-approved` as folksonomy labels — they cross-cut the project structure when you need to find "all warm palettes" across clients.'},{type:"quote",body:"Your future self going through 100 palettes does not remember why you saved them. Make the name say everything."}],sources:[{title:"Library · search + tags + folders",url:"/#/library",blurb:"All three filters available."}]}];function i(t){return[...e,...a].find(o=>o.slug===t)}export{e as P,a as T,i as f};
