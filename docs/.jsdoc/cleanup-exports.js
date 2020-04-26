exports.handlers = {
  newDoclet: function (e) {
    e.doclet.name = e.doclet.name.replace('exports.', '');
    e.doclet.longname = e.doclet.longname.replace('exports.', '');

    if (typeof e.doclet.meta.code.name === 'string') {
      e.doclet.meta.code.name = e.doclet.meta.code.name.replace('exports.', '');
    }
  },
};
