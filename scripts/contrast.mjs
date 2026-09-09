// WCAG contrast for the text/background pairs used in the UI.
const hex = (h) => { h = h.replace('#',''); return [0,2,4].map(i => parseInt(h.slice(i,i+2),16)/255); };
const blend = (fg, a, bg) => fg.map((c,i) => c*a + bg[i]*(1-a));
const lum = (c) => { const f = (v) => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; const [r,g,b] = c.map(f); return 0.2126*r+0.7152*g+0.0722*b; };
const ratio = (a, b) => { const [l1,l2] = [lum(a), lum(b)].sort((x,y)=>y-x); return (l1+0.05)/(l2+0.05); };
const white = hex('#ffffff'), pageBg = hex('#f0f2f8');
const pairs = [
  ['text/primary on card', '#22242f', white],
  ['text/secondary on card', '#3e414b', white],
  ['text/tertiary on card (labels, axis)', '#61656c', white],
  ['text/tertiary on page bg (subtitle)', '#61656c', pageBg],
  ['success badge text on surface', '#007a43', blend(hex('#0ac06e'), 0.2, white)],
  ['danger badge text on surface', '#b42318', blend(hex('#d92d20'), 0.2, white)],
  ['anomaly delta (text/danger) on card', '#d92d20', white],
  ['anomaly delta on active surface', '#d92d20', blend(hex('#ff6644'), 0.06, white)],
  ['anomaly-strong text on white (pill number)', '#d1431a', white],
  ['white on anomaly-strong (number chip)', '#ffffff', hex('#d1431a')],
  ['tooltip flag text on ink', '#ff8f73', hex('#22242f')],
  ['tomato marker vs white (graphic, 3:1)', '#ff6644', white],
  ['white on tab active', '#ffffff', hex('#586be4')],
  ['toggle inactive text on tab bg', '#61656c', hex('#f9f9f9')],
  ['white on brand mark', '#ffffff', hex('#22242f')],
];
for (const [name, fg, bg] of pairs) {
  const r = ratio(hex(fg), Array.isArray(bg) ? bg : hex(bg));
  console.log((r >= 4.5 ? 'PASS ' : r >= 3 ? 'LARGE' : 'FAIL ').padEnd(6), r.toFixed(2).padStart(5), name);
}
