const fs = require('fs');
const path = require('path');

// Custom Jest resolver to support NodeNext-style relative imports with `.js` extensions
// during ts-jest execution (where the actual sources are `.ts`).
//
// Rules:
// - Only rewrites *relative* requests ending in `.js`
// - Only rewrites when a sibling `.ts` file exists next to the requested `.js`
// - Falls back to Jest's default resolver for everything else (including node_modules)

module.exports = (request, options) => {
  if ((request.startsWith('./') || request.startsWith('../')) && request.endsWith('.js')) {
    const tsRequest = request.slice(0, -3) + '.ts';

    // `options.basedir` is the directory of the file doing the import.
    const candidate = path.resolve(options.basedir, tsRequest);
    if (fs.existsSync(candidate)) {
      return options.defaultResolver(tsRequest, options);
    }
  }

  return options.defaultResolver(request, options);
};
