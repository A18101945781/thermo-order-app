const fs=require('fs');
const app=fs.readFileSync('miniprogram/app.js','utf8');
const sto=fs.readFileSync('miniprogram/utils/storage.js','utf8');
// 1. app.js 里引用的 storage.xxx
const used=new Set();
app.replace(/\bstorage\.([A-Za-z_$][\w$]*)/g,(m,n)=>{used.add(n);return m});
// storage.js 导出的方法
const exported=new Set();
const m=sto.match(/module\.exports\s*=\s*\{([\s\S]*?)\n\}/);
if(m){ m[1].replace(/([A-Za-z_$][\w$]*)\s*:/g,(x,n)=>{exported.add(n);return x}) }
console.log('=== app.js 调用的 storage 方法 vs storage.js 导出 ===');
const missing=[...used].filter(n=>!exported.has(n));
console.log('  app.js 调用 '+used.size+' 个；storage.js 导出 '+exported.size+' 个');
console.log('  ❌ 缺失: '+(missing.length?missing.join(', '):'无'));
console.log('');
// 2. app.js 里 require 的模块是否都存在
console.log('=== app.js require 检查 ===');
app.replace(/require\((['"])([^'"]+)\1\)/g,(x,q,p)=>{
  const path=require('path').resolve('miniprogram', p);
  let ok=false;
  [path, path+'.js', path+'.json'].forEach(f=>{ if(fs.existsSync(f)) ok=true });
  if(!ok) console.log('  ❌ 找不到: '+p);
  return x;
});
console.log('  （无输出即全部存在）');
console.log('');
// 3. seed 注入块概览
console.log('=== app.js 启动流程（onLaunch 内的分支）===');
const ln=app.split('\n');
ln.forEach((l,i)=>{ if(/onLaunch|seed_injected_v6|SEED_DISHES\.forEach|saveMaterial|saveDish|setStorageSync/.test(l)) console.log('  '+(i+1)+': '+l.trim().slice(0,110)) });
