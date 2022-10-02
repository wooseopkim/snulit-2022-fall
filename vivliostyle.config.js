// @ts-check

const fs = require('fs');
const path = require('path');

/** @type {import('@vivliostyle/cli').VivliostyleConfigSchema} */
const vivliostyleConfig = {
  title: '청년문학 제21호', // populated into 'publication.json', default to 'title' of the first entry or 'name' in 'package.json'.
  author: '서울대학교 총문학연구회', // default to 'author' in 'package.json' or undefined
  language: 'ko',
  // readingProgression: 'rtl', // reading progression direction, 'ltr' or 'rtl'.
  size: 'A4',
  theme: 'style.css', // .css or local dir or npm package. default to undefined
  image: 'ghcr.io/vivliostyle/cli:5.6.2',
  // entry: [ // **required field**
    // 'introduction.md', // 'title' is automatically guessed from the file (frontmatter > first heading)
    // {
    //   path: 'epigraph.md',
    //   title: 'おわりに', // title can be overwritten (entry > file),
    //   theme: '@vivliostyle/theme-whatever' // theme can be set individually. default to root 'theme'
    // },
    // 'glossary.html' // html is also acceptable
  // ], // 'entry' can be 'string' or 'object' if there's only single markdown file
  entry: (() => {
    const root = path.join(__dirname, 'assets');
    const firstEntry = 'index';
    const filenamePattern = /.+\/([^/.]+).\w+/;

    return fs.readdirSync(root)
      .filter((file) => fs.statSync(path.join(root, file)).isDirectory())
      .flatMap((dir) => (
        fs.readdirSync(path.join(root, dir))
          .map((file) => path.join(root, dir, file))
          .sort((a, b) => {
            const x = filenamePattern.exec(a)?.[1];
            const y = filenamePattern.exec(b)?.[1];
            if (x === firstEntry) {
              return Number.NEGATIVE_INFINITY;
            };
            if (y === firstEntry) {
              return Number.POSITIVE_INFINITY;
            };
            return a.localeCompare(b);
          })
      ));
  })(),
  // entryContext: './manuscripts', // default to '.' (relative to 'vivliostyle.config.js')
  output: [ // path to generate draft file(s). default to '{title}.pdf'
  //   './output.pdf', // the output format will be inferred from the name.
  //   {
  //     path: './book',
  //     format: 'webpub',
  //   },
    {
      path: './build/book.pdf',
      renderMode: 'docker',
    },
  ],
  workspaceDir: '.vivliostyle', // directory which is saved intermediate files.
  toc: false, // whether generate and include ToC HTML or not, default to 'false'.
  // cover: './cover.png', // cover image. default to undefined.
  vfm: { // options of VFM processor
   replace: [ // specify replace handlers to modify HTML outputs
  //     {
  //       // This handler replaces {current_time} to a current local time tag.
  //       test: /{current_time}/,
  //       match: (_, h) => {
  //         const currentTime = new Date().toLocaleString();
  //         return h('time', { datetime: currentTime }, currentTime);
  //       },
  //     },
   ],
    hardLineBreaks: true, // converts line breaks of VFM to <br> tags. default to 'false'.
  //   disableFormatHtml: true, // disables HTML formatting. default to 'false'.
  },
};

module.exports = vivliostyleConfig;
