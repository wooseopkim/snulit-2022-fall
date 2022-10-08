import { readMetadata, VFM, type StringifyMarkdownOptions } from '@wooseopkim/vfm';
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
  const processor = VFM(options, readMetadata(md));
  const virtualFile = vfile({ path, contents: md });
  const processed = processor.processSync(virtualFile);
  const result = String(processed);
  fs.writeFileSync(path.replace(/\.md$/, '.html'), result);
}
