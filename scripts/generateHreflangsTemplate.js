const glob = require("glob-promise");
const colors = require("colors/safe");
const path = require("path");
const fs = require("fs");
const util = require("util");

const writeFileAsync = util.promisify(fs.writeFile);

async function getLanguages(localesDir) {
  const localeFiles = await glob(`${localesDir}/!(en).json`);
  return localeFiles
    .map(file => path.basename(file))
    .map(fileName => fileName.substr(0, fileName.length - ".json".length));
}

function linkTagForLanguage(lang) {
  return `<link rel="alternate" hreflang="${lang}" href="https://raha.io/${lang}">`;
}

async function generateHreflangsTemplate(localesDir) {
  const locales = await getLanguages(localesDir);
  return locales.map(l => linkTagForLanguage(l)).join("\n");
}

module.exports = generateHreflangsTemplate;
