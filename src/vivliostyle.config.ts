import { ArticleEntryObject } from '@vivliostyle/cli/dist/schema/vivliostyleConfig.schema';
import * as fs from 'fs';
import * as path from 'path';

interface Target {
  extension: string;
  root: string;
}
const raw: Target = {
  extension: 'md',
  root: path.join(__dirname, '..', 'assets'),
};
const compiled: Target = {
  extension: 'html',
  root: path.join(__dirname, 'assets'),
};

const buildConfig = (target: Target) => ({
  title: '청년문학 제21호',
  author: '서울대학교 총문학연구회',
  language: 'ko',
  size: 'A5',
  theme: 'src/style.css',
  image: 'ghcr.io/vivliostyle/cli:5.6.2',
  entry: (() => {
    const { extension, root } = target;
    const index = 'index';
    const filenamePattern = /([^/.]+).\w+$/;

    if (!fs.existsSync(root)) {
      console.log(`root '${root}' does not exist.`);
      return [];
    }
    const entries = fs.readdirSync(root)
      .filter((file) => fs.statSync(path.join(root, file)).isDirectory())
      .flatMap((dir) => (
        fs.readdirSync(path.join(root, dir))
          .filter((file) => file.endsWith(`.${extension}`))
          .sort((a, b) => {
            const x = filenamePattern.exec(a)?.[1];
            const y = filenamePattern.exec(b)?.[1];
            if (x === index) {
              return Number.NEGATIVE_INFINITY;
            };
            if (y === index) {
              return Number.POSITIVE_INFINITY;
            };
            return a.localeCompare(b);
          })
          .map((file) => {
            const filename = filenamePattern.exec(file)?.[1];
            return ({
              path: path.join(root, dir, file),
              title: filename === index ? dir : filename,
            });
          })
      ))
      .map((entry) => entry as Partial<ArticleEntryObject> & { priority: number })
      .concat({ rel: 'contents', theme: 'src/toc.css', priority: Number.MIN_SAFE_INTEGER + 1 }) // keep MIN_SAFE_INTEGER for the cover
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .map(({ priority, ...rest }) => ({ ...rest }));
    console.log('Read entries:', entries);
    return entries;
  })(),
  output: [
    {
      path: './build/book.pdf',
      renderMode: 'docker',
    },
  ],
  workspaceDir: '.vivliostyle',
  toc: true,
  vfm: {
    hardLineBreaks: true,
  },
});

export = {
  // when used by vivliostyle, use compiled assets
  ...buildConfig(compiled),
  // when used by build scripts, use raw assets
  raw: buildConfig(raw),
};
