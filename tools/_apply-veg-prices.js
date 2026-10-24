const fs = require('fs');
const path = require('path');
const seedPath = path.resolve('miniprogram/utils/seed.js');
delete require.cache[require.resolve(seedPath)];
const s = require(seedPath);

// 模板价(元/kg) = 订货模板报价单(元/斤) × 2
const TPL = {
  '卷心菜':4.2,'卷心菜块':4.2,'土豆丝':6.4,'土豆块':6.4,'大白菜丝':7.0,
  '杏鲍菇丁':13.8,'番茄块':20.2,'胡萝卜丝':7.2,'胡萝卜片':7.2,'茭白丝':20.0,
  '西兰花':15.2,'青菜段':7.6,'香菇丁':21.8,'香菇丝':21.2,'胡萝卜块':7.6,
  '番茄':20.2,'姜':11.6,'蒜':15.2,'葱':15.4
};

const changes = [];
s.SEED_MATERIALS.forEach(m => {
  if (TPL[m.name] !== undefined && m.price !== TPL[m.name]) {
    changes.push('MAT ' + m._id + ' ' + m.name + ' ' + m.price + '->' + TPL[m.name]);
    m.price = TPL[m.name];
  }
});
s.SEED_DISHES.forEach(d => {
  let tc = 0;
  (d.bomList || []).forEach(b => {
    if (TPL[b.name] !== undefined) {
      const np = TPL[b.name];
      const nc = +(np * b.useNum).toFixed(4);
      if (b.price !== np || b.cost !== nc) {
        changes.push('BOM ' + d._id + ' ' + d.dishName + ' / ' + b.name + ' p' + b.price + '->' + np + ' c' + b.cost + '->' + nc);
      }
      b.price = np; b.cost = nc;
    }
    tc += (Number(b.cost) || 0);
  });
  d.totalCost = +tc.toFixed(3);
  const sp = Number(d.sellPrice) || 0;
  if (sp > 0) { d.profit = +(sp - d.totalCost).toFixed(3); d.grossRate = +(d.profit / sp).toFixed(4); }
  else { d.profit = -d.totalCost; d.grossRate = 0; }
});

function arrText(name, arr) {
  const items = arr.map(o => {
    const j = JSON.stringify(o, null, 2);
    return j.split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');
  });
  return 'const ' + name + ' = [\n' + items.join(',\n') + '\n];';
}
let src = fs.readFileSync(seedPath, 'utf8');
function replaceBlock(name, nb) {
  const re = new RegExp('const ' + name + ' = \\[[\\s\\S]*?\\n\\];', 'm');
  if (!re.test(src)) throw new Error('not found ' + name);
  return src.replace(re, nb);
}
src = replaceBlock('SEED_MATERIALS', arrText('SEED_MATERIALS', s.SEED_MATERIALS));
src = replaceBlock('SEED_DISHES', arrText('SEED_DISHES', s.SEED_DISHES));
fs.writeFileSync(seedPath, src, 'utf8');
console.log('CHANGES(' + changes.length + '):');
changes.forEach(c => console.log('  ' + c));
console.log('written');
