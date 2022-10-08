import { readMetadata, VFM, type Metadata, type StringifyMarkdownOptions } from '@wooseopkim/vfm';
import * as fs from 'fs';
import vfile from 'vfile';
import { raw as config } from '../vivliostyle.config';
import convertParagraphs from './plugins/convert-paragraphs';
import ignoreLists from './plugins/ignore-lists';

const options: StringifyMarkdownOptions = {
  style: config.theme,
  title: config.title,
  language: config.language,
  plugins: {
    postMarkdown: [
      [ignoreLists],
    ],
    postHtml: [
      [convertParagraphs],
    ],
  },
  ...config.vfm,
};

for (const { path } of config.entry) {
  if (!path?.endsWith('.md')) {
    continue;
  }
  const buffer = fs.readFileSync(path);
  const md = buffer.toString();
  const originalMetadata = readMetadata(md);
  const metadata: Metadata = {
    ...(originalMetadata ?? {}),
    meta: [
      ...(originalMetadata.meta ?? []),
      [
        {
          name: 'name',
          value: 'author',
        },
        {
          name: 'content',
          value: /([^/]+)\/[^/]+\.\w+/.exec(path)?.[1] ?? '',
        },
      ],
    ],
  };
  const processor = VFM(options, metadata);
  const virtualFile = vfile({ path, contents: md });
  const processed = processor.processSync(virtualFile);
  const result = String(processed);
  fs.writeFileSync(path.replace(/\.md$/, '.html'), result);
}
