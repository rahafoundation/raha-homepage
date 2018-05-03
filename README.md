# raha-homepage

[The public website of the Raha Foundation.](https://raha.io)

NOTE: this is not yet published to the root domain, raha.io; instead it is
served from next-amp.raha.io.

## Develop

```bash
# To run the site
yarn serve

# To deploy the site. This happens automatically on a successful merge.
yarn deploy

# To run lint
yarn lint
```

## Architecture

It's a static [Google AMP](https://www.ampproject.org/) site; the AMP subset of
HTML in the `src/` directory, written in handlebars templates and with an
internationalization layer. This gets built into a static site with very fast
performance.

### Handlebars

The [Handlebars templating language](http://handlebarsjs.com/) is used primarily
to allow for partial templates. `yarn build` calls its command line tool to turn
the handlebars files into matching HTML ones, matching the directory structure
of the `src/pages/` directory.

You can invoke a template by adding the partial to the `src/partials` directory
(say, `./src/partials/path/to/mySpecialHeader`), and then in any handlebars
file, you can inject it by inputting `{{> raha/path/to/mySpecialHeader}}`.

This project also uses [Handlebars
Layouts](https://github.com/shannonmoeller/handlebars-layouts) for a bit less
repetition in layout code.

### Translations

After the handlebars templates are built, the
[`static-i18n`](https://github.com/claudetech/node-static-i18n) tool is used to
populate i18n placeholders into the actual generated HTML files from the `src/`
directory.

All translations are in JSON files in the `locales/` directory. To add support
for a language, simply add a locale json file for that language, named after its
[language
code](https://support.google.com/webmasters/answer/189077).

On build, lint will inform you if there are missing translations and prevent a
build; if you don't have translations ready for that text, just put the English
text in each other locale file for now, and add a note about it to
`locales/MISSING_TRANSLATIONS` for record-keeping.

### Static Assets

You can refer to static assets with relative links, i.e.
`/assets/lib/icons/favicons/favicon.ico`. When the build script runs, the entire
`assets/` dir gets copied into the root of the website and served statically
alongside everything else. Nothing magical here!

### Hosting

It's hosted on github pages; deploying just pushes the `build/` directory to the
`gh-pages` branch.

# Enjoy!
