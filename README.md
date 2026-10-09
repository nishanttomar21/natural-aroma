# Natural Aroma website — plain HTML, CSS and JavaScript

A rebuild of the Natural Aroma website (originally made with Durable), written
with **only HTML, CSS and JavaScript**: no frameworks, no packages and no build
step. The files in this folder *are* the website. Upload them to any web host
and it works.

**Live site:** <https://nishanttomar21.github.io/natural-aroma/> (GitHub Pages,
published from the `main` branch of this repository).

**It matches the original.** Every page was measured against your saved pages
at four screen widths (390, 768, 1024 and 1440 pixels): the page heights, and
the font, size, colour and position of every piece of text, card, button and
form field, are identical.

---

## 1. Look at it on your computer

**Quick look:** double-click `index.html`. You can browse every page, and all
the content shows.

**Full preview (recommended):** browsers block JavaScript files that are opened
straight from the disk, so the animations and the contact form only run when
the site is served by a small local web server (a program that shows your
folder at an address like `http://localhost:8080`). Pick one:

```bash
# Python (already installed on macOS and Linux)
python3 -m http.server 8080

# or Node.js
npx serve .
```

Then open <http://localhost:8080> in your browser.

---

## 2. What's in the folder

```
index.html            Home page
about.html            About Us
products.html         Our Products
blog.html             Blog
contact.html          Contact Us (with the quote form)
404.html              "Page not found" page (hosts show it automatically)
robots.txt            Tells search engines they may read the site
sitemap.xml           List of pages for search engines

assets/
  css/
    main.css          Loads the other style files in order (the only one pages link to)
    tokens.css        Design values: colours, spacing, font sizes, corner radius
    base.css          Fonts, browser reset and text styles (.type-*)
    components.css    Small reusable parts: buttons, separators, carousel, FAQ, form fields
    layout.css        Page container, sections, header, mobile menu and footer
    sections.css      One block per kind of page section (hero, pricing, FAQ section, …)
    motion.css        Scroll reveal, rolling-letter effect, reduced motion
  js/
    main.js           Starts every feature below
    modules/          One file per feature (menu, carousels, FAQ, quote form, …)
    utils/            Shared helpers
  fonts/              Fraunces and Open Sans (+ their licences)
  images/             Photos
  icons/favicon.svg   Browser-tab icon

partials/             The shared header and footer (see "Editing")
templates/            Starting point for a blog post
scripts/              Two optional helper scripts (need Node.js 18+)
```

### How the code is organised

- **CSS** goes from general to specific: design values → reset → small
  components → page layout → sections → animation. Class names follow
  **BEM** (*Block, Element, Modifier*), a naming convention that makes it
  clear what each class belongs to: `.faq` (block), `.faq__question`
  (an element inside it), `.faq--green` (a variation of it).
- **Spacing grows smoothly with the screen.** Every gap and padding is a
  multiple of one unit, `--u`, which is 4px on phones and 6px on wide
  screens. Text sizes scale the same way. This is how the original works.
- **JavaScript only adds polish** (this approach is called *progressive
  enhancement*). The pages, the phone menu, the FAQs, swiping the carousels
  and the form all work with JavaScript switched off. Each feature is a
  separate module that looks for HTML marked with a `data-` attribute (for
  example `data-carousel`) and enhances it. If one feature fails, the others
  keep working.
- **Conventions:** files are named in `kebab-case`; each JavaScript module
  exports one `init…()` function; fixed values are `UPPER_CASE` constants at
  the top of the file; every file starts with a comment explaining what it
  does. `.editorconfig` keeps indentation consistent in any editor.

---

## 3. Editing

**Text and images:** edit the `.html` file of the page directly. Each section
starts with a comment such as `<!-- FAQ -->`.

**Header and footer:** they appear on every page. Edit them once in
`partials/header.html` or `partials/footer.html`, then copy them into all
pages with:

```bash
node scripts/sync-partials.mjs
```

(`{{root}}` in a partial becomes the right path back to the site's main
folder for each page. The script also marks the link to the current page for
screen readers. `node scripts/sync-partials.mjs --check` only reports pages
that are out of date.)

**Adding a blog post:**

1. Copy `templates/blog-post.html` to `blog/your-post-name.html`.
2. Fill in everything marked `TODO` (title, date, cover photo, paragraphs)
   and remove the `noindex` line near the top.
3. Add a card for it in `blog.html` (an example card is in a comment there).
4. Add its address to `sitemap.xml`.
5. Run `node scripts/sync-partials.mjs`.

---

## 4. Before going live (checklist)

1. **Save the remaining photos.** 18 images (team portraits, customer logos and
   a few photos) are still loaded from Durable's storage. Run this **before**
   cancelling Durable, while those images still exist:

   ```bash
   node scripts/download-images.mjs
   ```

   It saves them into `assets/images/` and updates the pages. If some
   downloads fail, just run it again.

2. **Connect the contact form.** The form sends through **Formspree**, a form
   service with a free plan that emails you each request:
   1. Create an account at <https://formspree.io> and a new form.
   2. Copy the form's ID (it looks like `xyzabcde`).
   3. In `contact.html`, replace `YOUR_FORM_ID` in
      `action="https://formspree.io/f/YOUR_FORM_ID"` with it.

   Until then, sending shows a message asking visitors to call 08045802014.
   (Any similar service works too: put its address in `action`.)

3. **Replace the placeholders that were already on the original site:**
   - `email@mybusiness.com` and `+12345678900` (contact page, and the
     "Call us" / "Request a quote" / "Call for consultation" buttons).
   - Social links in `partials/footer.html` (they point to the
     Facebook/Instagram/LinkedIn home pages).
   - The 8 sample customer logos on the blog page.
   - The photo beside the home page FAQ: on the original it shows a fire
     truck, which doesn't match its description.
   - The pricing buttons on the products page open the home page (as on the
     original); you may want them to open `contact.html`.

4. **Your own domain (optional).** `robots.txt` and `sitemap.xml` use the
   GitHub Pages address. If you move to your own domain, see
   "Using your own domain" below.

---

## 5. Putting it online

**It is already online with GitHub Pages.** Every change pushed to the `main`
branch is published automatically, usually within a minute or two (watch
progress under the repository's **Actions** tab). The empty `.nojekyll` file
tells GitHub to publish the files exactly as they are.

`404.html` is the "page not found" page. Hosts show it for any address that
doesn't exist, so its links start from the site's base path
(`/natural-aroma/`) instead of being relative.

### Using your own domain

1. In the repository on GitHub: **Settings → Pages → Custom domain**, enter
   the domain and follow GitHub's DNS instructions.
2. In `404.html` (inside `<head>`) and in `scripts/lib/site.mjs`
   (`SITE_BASE_PATH`), change `/natural-aroma/` to `/`, then run
   `node scripts/sync-partials.mjs`.
3. Change the addresses in `sitemap.xml` and `robots.txt` to the new domain.

### Other hosts

Any static host works, because the site is just files (`partials/`,
`scripts/`, `templates/` and this README aren't needed online, but they do
no harm). At the root of a domain, apply step 2 above first.

- **Netlify:** drag the folder onto <https://app.netlify.com/drop>.
- **Cloudflare Pages / Vercel:** create a project and upload the folder (no
  build command, output folder = the folder itself).
- **Ordinary web hosting (cPanel, FTP):** upload the files into `public_html`.

---

## 6. Differences from the original

The look is the same; these small differences are deliberate or unavoidable:

- **Mobile menu:** your saved pages only contain the closed menu, so the open
  menu (a panel under the header) was styled to match the site.
- **"What are you sourcing?"** uses the browser's own dropdown. The closed
  field looks identical; the opened list is the device's standard list, which
  is easier to use on phones.
- **The form** sends through Formspree instead of Durable (see the checklist).
- **Buttons that jump to a section of the same page** ("Read the latest",
  "Browse products", "Browse all posts") scroll there smoothly instead of
  reloading the page, and stop just below the header.
- **Accessibility improvements:** a "Skip to content" link for keyboard
  users, labels for screen readers, arrow-key support for the carousels, and
  calmer motion for people who turn on "reduce motion" on their device.
- The copyright year updates itself every year.
- Durable's preview banner and "Built with Durable" badge are gone.

**Browser support:** current versions of Chrome, Edge, Safari and Firefox
(and those from the last couple of years). Much older browsers still show all
the content, with fewer animations.

## 7. Licences

Fraunces and Open Sans are free fonts under the SIL Open Font License (files
in `assets/fonts/`). Icons are Google Material Icons (Apache 2.0) plus the
Facebook, Instagram and LinkedIn marks. The text and photos are your own
website's content.
