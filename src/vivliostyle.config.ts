import { ArticleEntryObject } from '@vivliostyle/cli/dist/schema/vivliostyleConfig.schema';
import { readMetadata } from '@wooseopkim/vfm';
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
      .map((dir) => ({
        dir,
        priority: (() => {
          const index = fs.readFileSync(path.join(root, dir, 'index.md'));
          const { meta } = readMetadata(index.toString());
          const value = meta?.find((attributes) => attributes.find(({ name, value }) => name === 'name' && value === 'priority'))
            ?.find(({ name }) => name === 'content')
            ?.value
          return Number(value ?? 0);
        })()
      }))
      .flatMap(({ dir, priority }) => (
        fs.readdirSync(path.join(root, dir))
          .filter((file) => file.endsWith(`.${extension}`))
          .sort((a, b) => {
            const filenames = [a, b].map((x) => filenamePattern.exec(x)?.[1]);
            if (filenames[0] === index) {
              return Number.NEGATIVE_INFINITY;
            };
            if (filenames[1] === index) {
              return Number.POSITIVE_INFINITY;
            };
            const [p, q] = filenames.map((x) => fs.readFileSync(path.join(root, dir, `${x}.md`)))
              .map((x) => readMetadata(x.toString()))
              .map((x) => x.meta?.find((attributes) => attributes.find(({ name, value }) => name === 'name' && value === 'priority')))
              .map((x) => x?.find(({ name }) => name === 'content'))
              .map((x) => Number(x?.value ?? 0));
            return (p ?? 0) - (q ?? 0);
          })
          .map((file) => {
            const filename = filenamePattern.exec(file)?.[1];
            return ({
              path: path.join(root, dir, file),
              title: filename === index ? dir : filename,
              priority,
            });
          })
      ))
      .map((entry) => entry as Partial<ArticleEntryObject> & { priority: number })
      .concat({ rel: 'contents', theme: 'src/toc.css', priority: Number.MIN_SAFE_INTEGER + 1 }) // keep MIN_SAFE_INTEGER for the cover
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .map(({ priority, ...rest }) => ({ ...rest }));
    return [
      {
        path: path.join(root, 'cover.md'),
        theme: 'src/cover.css',
      },
      {
        path: path.join(root, 'blank.md'),
      },
      {
        path: path.join(root, 'title.md'),
      },
      ...entries,
    ];
  })(),
  output: [
    {
      path: './build/book.pdf',
    },
  ],
  workspaceDir: '.vivliostyle',
  toc: true,
  tocTitle: '목차',
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
