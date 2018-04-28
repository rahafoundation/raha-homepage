const path = require("path");
const glob = require("glob-promise");
const colors = require("colors/safe");

const LOCALES_DIR = path.resolve(process.argv[2]);
const enLocale = require(path.join(LOCALES_DIR, "en.json"));

/**
 * Gets all leaves keys, dot separated.
 * Errors if it finds any keys with a dot in it.
 */
function getObjectLeafKeys(obj, prefix = "") {
  return Object.keys(obj).reduce((memo, key) => {
    if (key.includes(".")) {
      throw new Error(
        "Keys must not include dots, or else static-i18n will break."
      );
    }
    const keyToAdd = prefix === "" ? key : `${prefix}.${key}`;
    if (typeof obj[key] === "object") {
      return [...memo, ...getObjectLeafKeys(obj[key], keyToAdd)];
    }
    return [...memo, keyToAdd];
  }, []);
}

function nestedKeyHasLocaleString(obj, deepKey) {
  const searchResult = deepKey
    .split(".")
    .reduce(
      (memo, curKey) =>
        !!memo && typeof memo === "object" && curKey in memo
          ? memo[curKey]
          : false,
      obj
    );
  if (!searchResult) return false;
  return typeof searchResult === "string";
}

async function checkLocaleFiles() {
  const localeFiles = await glob(`${LOCALES_DIR}/**/!(en).json`);
  const enLocaleKeys = getObjectLeafKeys(enLocale);

  let problemFound = false;

  localeFiles.forEach(localeFile => {
    const curLocale = require(localeFile);
    const curLocaleKeys = getObjectLeafKeys(curLocale);

    // type: { [enLocaleKey: string]: boolean }
    // values represent whether or not they are in the current locale.
    const keyPresenceMapping = enLocaleKeys.reduce(
      (memo, key) => ({
        ...memo,
        [key]: nestedKeyHasLocaleString(curLocale, key)
      }),
      {}
    );

    const missingKeys = Object.keys(keyPresenceMapping).filter(
      key => keyPresenceMapping[key] === false
    );

    if (missingKeys.length > 0) {
      console.error(
        colors.red(`Locale file ${localeFile} is missing the following keys`)
      );
      console.error(colors.blue(JSON.stringify(missingKeys)));
      problemFound = true;
    }

    const extraneousKeys = curLocaleKeys.filter(
      key => !enLocaleKeys.includes(key)
    );
    if (extraneousKeys.length > 0) {
      console.error(
        colors.red(
          `Locale file ${localeFile} contains extraneous keys that aren't present in the primary local, en:`
        )
      );
      console.error(colors.blue(JSON.stringify(extraneousKeys)));
      problemFound = true;
    }
  });

  if (problemFound) {
    throw new Error("Keys in locales are inconsistent, aborting.");
  }
}

checkLocaleFiles()
  .then(() => {
    console.info(colors.green("Success: Locales are valid and match!"));
  })
  .catch(err => {
    console.error(colors.red("Error: Locales failed lint."));
    console.error(err);
    process.exit(1);
  });
