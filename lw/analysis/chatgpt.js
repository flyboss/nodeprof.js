((sandbox) => {
  let fs = require('fs');
  let path = require('path');

  let output = [];
  let iidToLocation = new Map();

  function getLoc(iid) {
    return iidToLocation.has(iid) ? iidToLocation.get(iid) : J$.iidToLocation(iid);
  }

  function valueToStr(val) {
    try {
      if (val === undefined) return 'undefined';
      if (val === null) return 'null';
      if (typeof val === 'object') return 'Object';
      if (typeof val === 'function') return 'Function';
      return JSON.stringify(val);
    } catch (e) {
      return '[Unserializable]';
    }
  }

  sandbox.addAnalysis({
    getFieldPre: function (iid, base, offset, val) {
      iidToLocation.set(iid, J$.iidToLocation(iid));
      output.push({
        type: 'read',
        loc: getLoc(iid),
        base: valueToStr(base),
        prop: offset,
        value: valueToStr(val)
      });
    },

    putFieldPre(iid, base, offset, val, isComputed, isOpAssign) {
      iidToLocation.set(iid, J$.iidToLocation(iid));
      output.push({
        type: 'write',
        loc: getLoc(iid),
        base: valueToStr(base),
        prop: offset,
        value: valueToStr(val)
      });
    },

    endExecution: function () {
      const outFile = path.join(__dirname, '../results/chatgpt_trace.json');
      fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
      console.log('Trace saved to', outFile);
    }

  })


})(J$);
