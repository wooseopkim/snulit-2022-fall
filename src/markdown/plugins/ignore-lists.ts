import { Plugin } from 'unified';

const ignoreLists: Plugin = function () {
  if (!this.Parser) return;

  const { blockTokenizers } = this.Parser.prototype;
  blockTokenizers.list = () => false;
};

export default ignoreLists;
