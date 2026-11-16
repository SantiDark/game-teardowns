# Game Teardowns

A game design toolkit by Santiago Negro. Each game is taken apart with the same template: core loop, systems, feedback, onboarding, pacing, design tensions and what to take for original projects.

It is built for four kinds of people, and the home page has a way in for each:

| Who | Where | What they get |
| --- | --- | --- |
| Someone making a game | **Problems** | Design problems, each with the systems that answer it across every teardown |
| Someone learning design | **Editor** | A guided template to write a teardown and export it |
| Someone teaching design | **Method** | One shared template so students' work can be compared |
| Someone who plays | **Diary** | A log of moments that turns into a pacing curve and a teardown draft |

The parts feed each other: diary notes become teardown drafts, teardowns feed the Problems library, and the library helps people making games, learning or teaching.

Teardowns included: The Last of Us Part I, Dark Souls, Baldur's Gate 3, Hades, Celeste, Slay the Spire, Hollow Knight and Into the Breach.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no tracking. Fonts are included in the repo. The only outside services are Wikidata and Wikipedia: searches and recommendations run only when someone presses a button, and profile covers load from Wikimedia's image servers. Sending a teardown opens GitHub, but only when the person presses "Open GitHub".

## What is inside

- **Home**
  - Split hero with an original chart that overlays the pacing curve of every teardown.
  - Stats strip computed from `js/data.js` (teardowns, systems, loop steps, takeaways).
  - Grid of teardown cards. Each card has a thumbnail generated from that game's pacing curve, plus search and tag filters.
  - "How a teardown works": the five layers, each with its own icon and a count of systems across all games.
  - A preview of the comparison table.
- **Teardown page**: one scrolling page with a sticky table of contents that follows your position (scroll-spy) and a reading-progress bar. On small screens the table of contents becomes a sticky bar under the header.
  - Header band with title, meta chips, hook and an "at a glance" card.
  - Overview: summary, player fantasy, key facts, and onboarding and difficulty.
  - Core loop: a large clickable diagram with the step detail beside it.
  - Systems: compact cards in one grid, grouped by layer, each with a layer indicator. Click a card to read what it does, why it exists and its effect.
  - Feedback: visual, audio and mechanical.
  - Pacing: a curve where each point can be selected with the mouse, the keyboard (arrow keys) or the list beside it. It shows how intensity changes into and out of each moment.
  - Takeaways: design tensions, then cards with the project tag (ROADS, Counterpoint, etc.) and the test question.
- **Compare**: the same questions asked of every game. On a phone the table turns into one card per question.
- **Problems**: design problems such as "make failure feel fair". Each problem page gathers the systems that answer it in every teardown (what they do, why they exist, their effect), related problems, and a note when there are fewer than two games as examples. Systems on teardown pages link back to the problems they answer. See "Design problems" below.
- **All systems**: every system from every teardown in one library, with a filter by layer and a search. It shares a tab bar with Problems.
- **Search everywhere**: press Ctrl + K (Cmd + K on a Mac), `/`, or the magnifying glass in the header. It finds teardowns, systems, problems and pages, and works with the keyboard.
- **Similar teardowns** at the end of each teardown, and **Save as PDF**, which prints the teardown with every system card open and without the site's navigation.
- **My profile**: see below.
- **Diary**: see below.
- **Method**: how a teardown is built, and how to use it in a class.
- **Editor**: change any teardown, add new games and export the result (see below).
- On small screens the main menu folds into a menu button.
- Light and dark theme, keyboard navigation with visible focus, WCAG AA contrast, reduced-motion support, and layouts checked at 1440, 1024 and 390 px.

## Addresses

| Address | Page |
| --- | --- |
| `#/` | Home |
| `#/game/<slug>` | A teardown |
| `#/game/<slug>/<section>` | A teardown, scrolled to `overview`, `loop`, `systems`, `feedback`, `onboarding`, `pacing` or `takeaways` |
| `#/compare` | Comparison |
| `#/method` | Method |
| `#/problems` | Design problems |
| `#/problem/<id>` | One problem and how games answer it |
| `#/diary` | My diary: games, adding a game, patterns |
| `#/diary/<id>` | One game in the diary: moments and curve |
| `#/contribute` | How to send a teardown, and how to publish one |
| `#/systems` | Every system from every teardown |
| `#/me` | My profile: favorites, taste, recommendations, share link |
| `#/me/edit` | Create or change the profile |
| `#/u/<code>` | A shared profile and how well it matches yours |
| `#/edit` | Editor: every teardown, export, discard |
| `#/edit/<slug>` | Editor form for one teardown |
| `#/new` | Add a game |

Links to the old tabs (for example `#/game/dark-souls/onboarding`) still work. They now scroll to that part of the page.

## Editor

Open **Editor** in the menu, or the **Edit this teardown** button on any teardown.

- **Edit**: one form with every part of the template: basics, overview, onboarding, core loop, systems, feedback, pacing, comparison answers and takeaways. List items (loop steps, systems, moments and so on) can be added, removed and reordered. A side panel lists what is still missing (click an item to jump to the field) and draws the pacing curve as you type. Ctrl + S saves. The page warns before you leave with unsaved changes.
- **Add a game**: search the title on Wikidata and pick the right game. It fills in the title, studio, year, genre, tags and key facts (publisher, release date, platforms, modes, engine, series, director, composer) and links the Wikidata entry and Wikipedia article. The Wikipedia intro is shown for reference only and is not copied. You can also start from a blank template. The analysis itself (loop, systems, pacing, takeaways) is always written by hand.
- **Drafts**: a teardown with required parts missing is saved as a draft. It appears in the editor but stays hidden from the site until it is complete.

### Where changes are saved

Changes are saved **only in the browser where they were made** (localStorage). Other visitors, other browsers and other devices do not see them. A bar at the top of the site says when you are looking at local changes. Clearing the browser data deletes them.

To make changes public:

1. In the editor, press **Export data.js**. The file contains every complete teardown. Drafts are left out.
2. Replace `js/data.js` in the project with it.
3. Commit and push (or upload it on GitHub). Then press **Discard all changes** in the editor so your browser shows the published version again.

The exported file is plain data in JSON style. The comments of the hand-written `data.js` are not kept.

Letting visitors share their edits with each other would need a server or an online database. This site has none, by design.

## Design problems

The list lives in `js/data.js`, in `TEARDOWN_META.problems`. It is empty for now, and the Problems page says the list is being written. Each problem looks like this:

```js
{ id: "fair-failure",
  name: "Make failure feel fair",
  question: "How do I let the player die without making them quit?",
  idea: "One or two sentences about what is at stake." }
```

A system answers a problem when its `problems` list includes the id:

```js
{ name: "Bonfires", layer: "System", what: "", why: "", effect: "", problems: ["fair-failure"] }
```

Once the list has problems, the editor shows a checkbox per problem on every system, so new teardowns can be tagged without touching the file.

## Contributions

Anyone can send a teardown, or changes to one, without the site needing a server. Submissions arrive as GitHub issues and are published only after review.

**Turn it on:** set `repo` in `js/data.js` to the public repository of the site, for example `repo: "https://github.com/USER/game-teardowns"`. While it is empty, the editor only offers "Download file" and the Contribute page says sending is not open yet.

**Contributor:**

1. Writes or edits a teardown in the editor and puts their name (and an optional `https://` link) in "Written by".
2. Saves and presses **Send to the site**. A short teardown goes inside the GitHub message. A long one is copied to the clipboard, and the message says where to paste it. If the browser blocks copying, the file is downloaded instead.
3. Presses **Open GitHub** and submits the issue. A free GitHub account is needed.

**Maintainer (you):**

1. Copies the text from the issue (or downloads the file) and loads it in **Editor, Import**. It accepts the downloaded file, the text pasted with or without the surrounding message, a bare teardown or a list. If the address is already used, it asks whether to replace that teardown or keep the import as a copy.
2. Reviews it, then exports `data.js` and publishes as usual.

Teardowns with an author show "By name" (linked when there is a link) on their page. The rest show the site author, linked to the portfolio.

**Download file** in the editor saves any teardown as `teardown-<address>.json`, also useful as a backup or to move a teardown to another browser with Import.

## My profile

A taste profile built from what a person loves, in any medium.

- **Favorites**: up to four games, movies, series and songs, each looked up on Wikidata (or added as typed). Their genres are kept with them. A song without genres borrows the genres of its artist. They can be reordered, and the first of each kind is marked as the top pick.
- **Covers**: the lead image of each favorite's English Wikipedia article (box art, poster, single cover), loaded from Wikimedia's servers. Where there is none, a generated pattern is shown instead. Teardown pages still use no game assets.
- **Banner**: the image behind the name. Automatic (the first favorite with a cover), any chosen favorite, or the pattern only.
- **Taste**: the genres are read as six design traits (Tension, Challenge, Story, Discovery, Strategy, Action) with simple keyword rules in `js/profile.js`. The result is shown as a radar chart, bars and a short archetype such as "The Explorer, with a taste for challenge". Items added without genres do not count.
- **Personal accent**: one of six colors. It recolors the whole site for that person, in both themes.
- **Recommendations**: teardowns ranked by how well their tags and genre match the taste, with the favorite that explains each one.
- **Picked for you**: "Find games for me" looks up games on Wikidata from four sources, each with the reason and the favorite behind it:
  - *Like your games*: games that share genres with your favorite games.
  - *From what you watch*: games based on your movies and series, or set in the same franchise or world.
  - *Same mood as your shows*: games in genres that match the mood words of your movies and series (horror, science fiction, mystery and so on).
  - *Music you would like*: games scored by your favorite artists, or by composers who work in the genres of your songs.

  Up to six per source, with variety (no more than two from the same composer or favorite before repeating). Results are kept with the profile, can be filtered by source, and each game can be added to the diary as "Want to play".
- **Share**: a link that carries the profile itself (name, bio, favorites and traits). Whoever opens it sees the card, a match percentage against their own profile, both shapes on the radar and the favorites they share.

Saved only in this browser (localStorage `gt-profile`). Recommending other people's profiles automatically needs accounts and a server, which the site does not have yet. The share link is the way to compare for now.

The avatars, and the posters of favorites without a cover, are generated patterns drawn from a hash of the name or title. The shared link also carries the cover addresses, so the profile looks the same for whoever opens it.

## Diary

A log for players who want to notice why a game works.

- **Add a game** by searching Wikidata, by title only, or from the teardowns. Each game has a status: playing, finished, dropped or want to play.
- **Note moments** while you play: what happened, what you felt, what caused it, the layer and the intensity from 0 to 10. Feelings and causes are suggested from your earlier notes, and from the systems of the matching teardown if there is one. Moments can be edited, reordered and deleted.
- Each game draws an **intensity curve** from its moments, with the average and the peak.
- **Create teardown draft** turns the moments into a draft in the editor: the moments become the pacing curve, and every cause becomes a system to describe.
- The diary page shows **patterns** across all your games once there are three moments: the feelings you note most, the layers that cause them, causes that repeat and your most intense moments.

Like the editor, the diary is saved only in this browser (localStorage `gt-diary`). Syncing it across devices needs user accounts, which the site does not have yet.

## Design notes

- One accent color (orange) on a neutral grey scale, with a separately tuned dark theme. All colors are CSS variables at the top of `css/style.css`.
- Type: Archivo for interface and headings, Source Serif 4 italic for the human voice (the second half of the home headline, the author note, the player-fantasy quote, the sign-off), and the system monospace font for small data labels.
- The home page greets a returning visitor by name, with their top picks and their best match in the library; a new visitor gets an invitation to build a profile instead.
- Teardown pages show an estimated reading time and a thin reading-progress bar under the header. Page changes fade in, except when the system asks for reduced motion.
- Every diagram (loops, pacing curves, thumbnails, icons) is an SVG generated from `js/data.js`, so a new teardown gets all of them automatically.

## Folder structure

```
index.html             page shell
css/style.css          all styles
css/fonts-file.css     fonts embedded for file:// (generated, see below)
js/data.js             all content (edit this to add or change a teardown)
js/app.js              routing, rendering, SVG diagrams and the local store
js/editor.js           editor, add-a-game page, Wikidata search, export
js/diary.js            diary: games, moments, curve, patterns, teardown drafts
js/profile.js          taste profile, recommendations, shared profiles
tools/make-file-fonts.py   regenerates css/fonts-file.css
assets/fonts/          Archivo and Source Serif 4 (SIL Open Font License)
favicon.svg
.nojekyll
```

### Why there is a second font file

Browsers block font files on a page opened straight from a folder (`file://`). To get around this, `index.html` loads `css/fonts-file.css`, which contains the same fonts embedded as text, but only when the address starts with `file://`. On GitHub Pages or a local server, the normal `.woff2` files are used. If you change a font, run `python tools/make-file-fonts.py` to regenerate it.

`assets/fonts/source-serif.woff2` (the upright Source Serif) is no longer used by the design and can be deleted.

## Preview on your computer

Open `index.html` in a browser. It works from a folder because the content is in a JavaScript file, not loaded with `fetch`.

If you prefer a local server, run this inside the folder and open http://localhost:8000:

```
python -m http.server 8000
```

## Publish on GitHub Pages

1. Create a new repository on GitHub, for example `game-teardowns`.
2. Upload every file and folder from this project, keeping the structure. With GitHub Desktop: add the folder as a local repository, commit and publish. With the website: use "Add file" and then "Upload files", and drag the contents of the folder.
3. In the repository, open **Settings**, then **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose the `main` branch and the `/ (root)` folder, then save.
5. After a minute the site is live at `https://YOUR-USER.github.io/game-teardowns/`.

To link it from the portfolio, add a normal link to that address.

## Add a new teardown

The easiest way is the editor (**Editor**, then **Add a game**), followed by **Export data.js**. To do it by hand instead:

1. Open `js/data.js`.
2. Copy one full game object inside `window.TEARDOWNS` and paste it after the last one, separated by a comma.
3. Change every field. The slug must be unique and use only lowercase letters, numbers and hyphens.
4. Save and reload. The game appears on the home page, in the stats, in the tag filters and in the comparison table, with its thumbnail, loop diagram and pacing chart drawn automatically. The hero chart shows the first three games.

If a game has a missing or wrong field, the site skips it and writes the reason in the browser console (press F12 and open the Console tab).

### Template

```js
{
  slug: "game-name",
  title: "Game Name",
  studio: "Studio",
  year: "2020",
  genre: "Genre",
  tags: ["Tag one", "Tag two"],
  hook: "One sentence about the main idea of the design.",
  compare: {
    tension: "", failure: "", info: "",
    progression: "", feedback: "", onboarding: ""
  },
  summary: "A short paragraph about what the game does.",
  fantasy: "What the player gets to feel or be.",
  facts: [{ k: "Perspective", v: "" }],

  coreLoop: {
    note: "A sentence about how the loop repeats.",
    steps: [                       // 3 to 8 steps, in order
      { label: "Short name", detail: "What happens.", feeling: "What the player feels." }
    ]
  },

  systems: [
    // layer: Mechanic, System, Content, Narrative or Presentation
    { name: "", layer: "Mechanic", what: "", why: "", effect: "" }
  ],

  feedback: { visual: [""], audio: [""], mechanical: [""] },

  onboarding: { summary: "", steps: [""], difficulty: "" },

  pacing: {
    label: "What the curve represents. Say it is your own reading.",
    points: [                      // 3 or more points, v goes from 0 to 10
      { phase: "Name", v: 3, note: "What happens here." }
    ]
  },

  tensions: [{ title: "", text: "" }],

  takeaways: [
    { feeling: "", source: "", adaptation: "", project: "", test: "" }
  ],

  // optional, added by the editor's Wikidata search
  source: { wikidata: "Q00000", wikipedia: "https://en.wikipedia.org/wiki/..." }
  // optional on each system: problems: ["problem-id"] (see "Design problems")
  // optional: author: { name: "Name", link: "https://..." } for contributed teardowns
}
```

## Notes on content

- All diagrams are original. No screenshots, art or other assets from the games are used.
- The pacing values are subjective estimates of intensity, not measurements.
- Game titles belong to their respective owners.
- Basic facts fetched by the editor come from [Wikidata](https://www.wikidata.org) (public domain, CC0). Teardowns created that way link to their Wikidata entry.

## Credits

Fonts: [Archivo](https://github.com/Omnibus-Type/Archivo) and [Source Serif 4](https://github.com/adobe-fonts/source-serif), both under the SIL Open Font License. The license files are in `assets/fonts/`. Icons and diagrams are original.
