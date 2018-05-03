const handlebars = require("handlebars");
const handlebarsLayouts = require("handlebars-layouts");
const glob = require("glob-promise");
const colors = require("colors/safe");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const util = require("util");

const generateHreflangsTemplate = require("./generateHreflangsTemplate");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
const mkdirpAsync = util.promisify(mkdirp);

const TEMPLATE_EXTENSION = ".hbs";
const OUTPUT_DIR = process.argv[2];
const LOCALES_DIR = process.argv[3];

async function compileTemplates(localesDir, outputDir) {
  const [pagesToCompile, partialsFiles] = await Promise.all([
    glob(`${__dirname}/../src/pages/**/*${TEMPLATE_EXTENSION}`),
    glob(`${__dirname}/../src/partials/**/*${TEMPLATE_EXTENSION}`)
  ]);

  // create the handlebars compiler
  const compiler = handlebars.create();
  compiler.registerHelper(handlebarsLayouts(compiler));

  // add the partials
  await Promise.all([
    // for partials in `src/` naming scheme matches the directory structure in
    // `src/partials`, prepended with `raha/` for disambiguation with any libs
    // we might use.
    ...partialsFiles.map(async templateFile => {
      const relPath = path.relative(
        path.join(__dirname, "..", "src", "partials"),
        templateFile
      );
      const templateName = `raha/${relPath.substr(
        0,
        relPath.length - TEMPLATE_EXTENSION.length
      )}`;

      compiler.registerPartial(
        templateName,
        await readFileAsync(templateFile, "utf8")
      );
    }),
    // also generate the hreflangs partial. Any other future generated partials
    // can be added like this one.
    (async () => {
      compiler.registerPartial(
        "raha/generated/hreflangs",
        await generateHreflangsTemplate(localesDir)
      );
    })()
  ]);

  // compile the pages
  return await Promise.all(
    pagesToCompile.map(async templateFile => {
      const relPath = path.relative(
        path.join(__dirname, "..", "src", "pages"),
        templateFile
      );

      const fileName = path
        .basename(relPath)
        .substr(0, relPath.length - TEMPLATE_EXTENSION.length);
      const pathWithoutExtension = path.join(path.dirname(relPath), fileName);

      // if not an index.html file, create it as a folder with an index.html
      // file inside of it, so that urls can be addressed as
      // /path/to/page, rather than /path/to/page.htm
      const uri =
        fileName === "index"
          ? `${pathWithoutExtension}.html`
          : path.join(pathWithoutExtension, "index.html");

      console.log(fileName, pathWithoutExtension, uri);

      return {
        uri,
        html: compiler.compile(await readFileAsync(templateFile, "utf8"))()
      };
    })
  );
}

async function outputTemplates(templates) {
  if (!(await existsAsync(OUTPUT_DIR))) {
    await mkdirpAsync(OUTPUT_DIR);
  }

  await Promise.all(
    templates.map(async ({ uri, html }) => {
      await mkdirpAsync(path.join(OUTPUT_DIR, path.dirname(uri)));
      await writeFileAsync(path.join(OUTPUT_DIR, uri), html);
    })
  );
}

console.info(colors.gray(`Will output to ${OUTPUT_DIR}`));
console.info(colors.gray("Compiling Handlebars templates..."));
compileTemplates(LOCALES_DIR, OUTPUT_DIR)
  .then(async templates => {
    console.info(colors.green("Templates compiled successfully"));
    console.info(colors.gray("Outputting to files..."));
    await outputTemplates(templates);
  })
  .then(() => {
    console.info(colors.green("Compiled successfully"));
  })
  .catch(err => {
    console.error(colors.red("Compilation failed, aborting"));
    console.error(err);
    process.exit(1);
  });
