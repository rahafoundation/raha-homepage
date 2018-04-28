const handlebars = require("handlebars");
const handlebarsLayouts = require("handlebars-layouts");
const glob = require("glob-promise");
const colors = require("colors/safe");
const path = require("path");
const fs = require("fs");
const util = require("util");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
const mkdirAsync = util.promisify(fs.mkdir);

const TEMPLATE_EXTENSION = ".hbs";
const OUTPUT_DIR = process.argv[2];

async function compileTemplates() {
  const [pagesToCompile, partialsFiles] = await Promise.all([
    glob(`${__dirname}/../src/pages/**/*${TEMPLATE_EXTENSION}`),
    glob(`${__dirname}/../src/partials/**/*${TEMPLATE_EXTENSION}`)
  ]);

  // create the handlebars compiler
  const compiler = handlebars.create();
  compiler.registerHelper(handlebarsLayouts(compiler));

  // add the partials
  // naming scheme matches the directory structure in `src/partials`.
  await Promise.all(
    partialsFiles.map(async templateFile => {
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
    })
  );

  // compile the pages
  return await Promise.all(
    pagesToCompile.map(async templateFile => {
      const relPath = path.relative(
        path.join(__dirname, "..", "src", "pages"),
        templateFile
      );
      const uri = `${relPath.substr(
        0,
        relPath.length - TEMPLATE_EXTENSION.length
      )}.html`;

      return {
        uri,
        html: compiler.compile(await readFileAsync(templateFile, "utf8"))()
      };
    })
  );
}

async function outputTemplates(templates) {
  if (!(await existsAsync(OUTPUT_DIR))) {
    await mkdirAsync(OUTPUT_DIR);
  }

  await Promise.all(
    templates.map(
      async ({ uri, html }) =>
        await writeFileAsync(path.join(OUTPUT_DIR, uri), html)
    )
  );
}

console.info(colors.gray(`Will output to ${OUTPUT_DIR}`));
console.info(colors.gray("Compiling Handlebars templates..."));
compileTemplates()
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
    process.exit(-1);
  });
