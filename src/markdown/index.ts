import { readMetadata, VFM, type StringifyMarkdownOptions } from '@wooseopkim/vfm';
import * as fs from 'fs';
import vfile from 'vfile';
import mixed from '../vivliostyle.config';
import convertParagraphs from './plugins/convert-paragraphs';
import ignoreLists from './plugins/ignore-lists';

const config = mixed.raw;
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

for (const file of config.entry) {
  if (!file.endsWith('.md')) {
    continue;
  }
  const buffer = fs.readFileSync(file)
  const md = buffer.toString();
  const processor = VFM(options, readMetadata(md));
  const virtualFile = vfile({ path: file, contents: md });
  const processed = processor.processSync(virtualFile);
  const result = String(processed);
  fs.writeFileSync(file.replace(/\.md$/, '.html'), result);
}
