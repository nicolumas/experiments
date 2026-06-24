# Adding a project to Onsite alignment

The `onsite-alignment/` page is a hub. Each project is a self-contained
subfolder, and the hub lists them from a data array.

## To add a new project

1. **Copy this folder** to a new, kebab-case name (no spaces):
   ```
   cp -R _template my-new-project
   ```

2. **Edit `my-new-project/index.html`** — search for `EDIT:` comments:
   - title, category/tag, project name (breadcrumb), hero copy
   - the tiles (one per deck / prototype / doc / Figma link)
   - drop the project's own files (decks, prototypes, images) into the folder
     and point the tiles at them with relative links.

3. **Add a card to the hub.** Open `../index.html` and add one entry to the
   `projects` array near the bottom:
   ```js
   {
     title: "My New Project",
     tag: "Category · type",
     href: "my-new-project/",
     img: "<lumas showimg code, e.g. ime117>",   // or remove the .shot if no image
     status: "ready",                              // "ready" | "draft"
     desc: "One sentence about the project."
   }
   ```
   The card and the project count update automatically.

## Notes
- Shared brand fonts: `onsite-alignment/assets/lumas-fonts.css`
  (referenced from a project as `../assets/lumas-fonts.css`).
- Artwork thumbnails on the hub use `https://img.lumas.com/showimg_<code>_desktop.jpg`.
- Keep folder/file names free of spaces where possible (the older
  `live with it/` folder works but must be URL-encoded as `live%20with%20it/`).
- This `_template` folder is not listed on the hub (it's not in the array).
