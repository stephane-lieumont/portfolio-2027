---
name: verify-visual
description: Verify a visual or animated change by measuring the live DOM rather than reading the CSS. Use after any change to layout, styling, transitions or animation, and whenever a visual bug resists a fix — especially if the same symptom has been reported more than once.
---

# Verifying visual behaviour

**Reading the CSS tells you what you wrote. Measuring tells you what the
browser did.** Every visual bug in this repository so far survived a careful
reading of the stylesheet — several survived three or four — and every one was
found by querying the live DOM. See `.claude/memory/traps.md`.

## Before anything else

```js
document.visibilityState;
```

If this is `'hidden'`, **`requestAnimationFrame` will never fire**. Any script
that awaits a frame hangs and the tool reports "the renderer may be frozen".
A working feature was once diagnosed as a performance failure and reverted over
exactly this. Prefer synchronous reads of `getComputedStyle`; never conclude
anything about frame cost from a hidden tab.

## Measuring a transition

Do not trust the declared duration — check the property is actually
transitioning. A `transition` shorthand in another rule may have dropped it.

```js
// After a real pointer enter and exit
el.getAnimations().map((a) => ({
  property: a.transitionProperty,
  duration: a.effect.getTiming().duration,
  easing: a.effect.getTiming().easing,
}));
```

Then sample the value over time. A property with no transition shows its target
in the first sample:

```js
const seen = [];
for (let i = 0; i < 16; i += 1) {
  seen.push(Math.round(performance.now()) + ' ' + getComputedStyle(el).scale);
  await new Promise((r) => setTimeout(r, 280)); // setTimeout, not rAF
}
```

## Measuring an animation

Stamp the state that triggers it, then read computed delays and durations
synchronously — no awaited frame needed:

```js
document.documentElement.setAttribute('data-ready', '');
const s = getComputedStyle(el);
// s.animationName, s.animationDelay, s.animationDuration
document.documentElement.removeAttribute('data-ready');
```

To check a keyframe's shape, drive the timeline:

```js
const a = el.getAnimations()[0];
a.currentTime = 200;
getComputedStyle(el).opacity;
```

## Measuring layout

Read the resolved grid, not the authored one — spans and `auto-fill` do not
always give what the rule suggests:

```js
getComputedStyle(list).gridTemplateColumns; // once computed to "224px 84px"
[...tiles].map((t) => Math.round(t.getBoundingClientRect().width));
```

For images, confirm they actually loaded rather than that the `src` looks right:

```js
({ src: img.getAttribute('src'), complete: img.complete, natural: img.naturalWidth });
```

## Checking what is served

Cheaper than a browser, and it distinguishes "the rule is wrong" from "the file
is not there":

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" http://localhost:4300/medias/cgi/escart-wild.jpg
```

## When the same symptom is reported twice

Stop fixing and start measuring. Every multi-round bug in this project had a
cause in a different place from where it was being fixed:

- "the zoom-out is brutal" → the zoom had **no transition at all**
- "the text looks crushed" → the percentage resolved against the wrong box
- "the hover has no effect" → the rule was scoped away by encapsulation

A second report is evidence the diagnosis is wrong, not that the value needs
another nudge.

## Then report honestly

State what you measured, in numbers. If something could not be verified — and
frame cost in a hidden tab cannot — say so plainly rather than implying it
passed.
