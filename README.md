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
HTML in the `src/` directory, with an internationalization layer. This produces
very fast performance.

### Translations

When the site is built, the [`static-i18n`]() tool is used to populate
i18n placeholders into the actual generated HTML files from the `src/`
directory.

All translations are in JSON files in the `locales/` directory. To add support
for a language, simply add a locale json file for that language. Please ensure
there are translations available for every language.

### Hosting

It's hosted on github pages; deploying just pushes the `build/` directory
to the `gh-pages` branch.

# Enjoy!
