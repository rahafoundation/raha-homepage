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
        (await readFileAsync(templateFile)).toString()
      );
    })
  );

  // compile the pages
  return pagesToCompile.map(templateFile => {
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
      html: compiler.compile(fs.readFileSync(templateFile).toString())()
    };
  });
}

async function outputTemplates(templates) {
  if (!(await existsAsync(OUTPUT_DIR))) {
    mkdirAsync(OUTPUT_DIR);
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
    console.log(colors.green("Templates compiled successfully"));
    console.log(colors.gray("Outputting to files..."));
    outputTemplates(templates);
  })
  .then(() => {
    console.log(colors.green("Compiled successfully"));
  })
  .catch(err => {
    console.log(colors.red("Compilation failed, aborting"));
    throw err;
  });
