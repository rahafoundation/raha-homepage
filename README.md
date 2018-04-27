# raha-homepage

[The public website of Raha.io.](next-amp.raha.io)

NOTE: this is not yet published to the root domain, raha.io; instead it is
served from next-amp.raha.io.

## Develop

```bash
# To run the site
yarn serve

# To deploy the site
yarn deploy
```

## Architecture

It's a static [Google AMP](https://www.ampproject.org/) site; the AMP subset of
HTML in the `src/` directory, written in mustache templates and with an
internationalization layer. This gets built into a static site with very fast
performance.

### Mustache

The [Mustache templating language](http://mustache.github.io/) is used primarily
to allow for partial templates. `yarn build` calls its command line tool to
turn the mustache files into matching HTML ones, matching the directory
structure of the `src/pages/` directory.

You can invoke a template by adding the partial to the `src/partials` directory
(say, `./src/partials/mySpecialHeader`), and then in any mustache file, you
can inject it by inputting `{{> mySpecialHeader}}`.

A couple limitations:

1.  Note that Mustache won't error on build if you gave it a nonexistent name; it
    just won't inject anything there.
1.  Because of how simple Mustache is, every partial must have unique names. Even
    if they are in different subdirectories of the `src/partials` dir. Mustache
    just names partials based on their file names.

Mustache can also do things like injecting variables into the templates, but
that's not really useful for us since we're not running it in a dynamic
javascript context, so we don't pass it any input variables
(`/src/mustacheView.json` is totally empty). Really, the only point is partials,
but thankfully Mustache is so simple it does little else.

### Translations

After the mustache templates are built, the
[`static-i18n`](https://github.com/claudetech/node-static-i18n) tool is used to
populate i18n placeholders into the actual generated HTML files from the `src/`
directory.

All translations are in JSON files in the `locales/` directory. To add support
for a language, simply add a locale json file for that language. Please ensure
there are translations available for every language.

### Static Assets

You can refer to static assets with relative links, i.e.
`/assets/lib/icons/favicons/favicon.ico`. When the build script runs, the entire
`assets/` dir gets copied into the root of the website and served statically
alongside everything else. Nothing magical here!

### Hosting

It's hosted on github pages; deploying just pushes the `build/` directory
to the `gh-pages` branch.

# Enjoy!
