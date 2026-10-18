/* Hand-drawn SVG dress illustrations — placeholder art until real photography is supplied */
let _dressUid = 0;
function _rng(seed){ let a = seed * 2654435761 >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const DRESS_SHAPES = {
  gown: {
    parts: ['M118 80 Q150 106 182 80 C187 108 178 128 182 152 C202 250 234 340 252 410 Q150 432 48 410 C66 340 98 250 118 152 C122 128 113 108 118 80 Z'],
    detail: `<path d="M118 80 Q150 106 182 80" fill="none" stroke="ACC" stroke-width="2"/><path d="M116 152 Q150 162 184 152" fill="none" stroke="ACC" stroke-width="2.4"/><path d="M150 164 C150 250 140 330 128 412" stroke="ACC" stroke-opacity=".35" fill="none"/><path d="M150 164 C150 250 160 330 172 412" stroke="ACC" stroke-opacity=".35" fill="none"/>`
  },
  lehnga: {
    parts: ['M118 80 Q150 104 182 80 L197 106 Q189 120 185 128 H115 Q111 120 103 106 Z', 'M118 136 H182 C198 232 246 332 264 412 Q150 434 36 412 C54 332 102 232 118 136 Z'],
    extra: `<path d="M184 82 C240 118 268 222 238 336 L220 330 C242 232 214 140 166 100 Z" fill="DUP" fill-opacity=".55" stroke="ACC" stroke-width="1.4"/>`,
    detail: `<path d="M118 80 Q150 104 182 80" fill="none" stroke="ACC" stroke-width="2"/><path d="M115 128 H185" stroke="ACC" stroke-width="2.4"/><path d="M118 136 H182" stroke="ACC" stroke-width="2.4"/><path d="M150 140 C150 250 138 340 120 420" stroke="ACC" stroke-opacity=".3" fill="none"/><path d="M150 140 C150 250 162 340 180 420" stroke="ACC" stroke-opacity=".3" fill="none"/>`
  },
  pishwas: {
    parts: ['M118 80 Q150 106 182 80 C187 108 178 128 182 152 C206 250 250 340 270 414 Q150 438 30 414 C50 340 94 250 118 152 C122 128 113 108 118 80 Z', 'M118 80 L82 192 Q78 204 91 205 L102 202 L131 118 Z', 'M182 80 L218 192 Q222 204 209 205 L198 202 L169 118 Z'],
    detail: `<path d="M118 80 Q150 106 182 80" fill="none" stroke="ACC" stroke-width="2"/><path d="M116 152 Q150 160 184 152" fill="none" stroke="ACC" stroke-width="2.4"/><path d="M150 108 V414" stroke="ACC" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="2 5"/><path d="M84 196 L104 200" stroke="ACC" stroke-width="3"/><path d="M216 196 L196 200" stroke="ACC" stroke-width="3"/>`
  },
  sharara: {
    parts: ['M116 80 Q150 102 184 80 L204 114 L196 264 H104 L96 114 Z', 'M108 258 H150 L152 412 Q100 428 40 412 Q78 340 108 258 Z', 'M150 258 H192 Q222 340 260 412 Q200 428 148 412 Z'],
    extra: `<path d="M120 84 C66 124 52 232 78 338 L96 332 C80 236 96 148 142 100 Z" fill="DUP" fill-opacity=".55" stroke="ACC" stroke-width="1.4"/>`,
    detail: `<path d="M116 80 Q150 102 184 80" fill="none" stroke="ACC" stroke-width="2"/><path d="M104 264 H196" stroke="ACC" stroke-width="2.4"/><path d="M150 100 V262" stroke="ACC" stroke-opacity=".5" stroke-dasharray="2 5"/><path d="M130 258 L124 410" stroke="ACC" stroke-opacity=".3" fill="none"/><path d="M170 258 L176 410" stroke="ACC" stroke-opacity=".3" fill="none"/>`
  }
};

function dressSVG(g, opts = {}) {
  const id = 'dr' + (++_dressUid);
  const sh = DRESS_SHAPES[g.type] || DRESS_SHAPES.gown;
  const acc = g.acc || '#E2BC6A';
  const rnd = _rng(g.id ? g.id.split('').reduce((a, c) => a + c.charCodeAt(0), 7) : 3);
  const clip = sh.parts.map(p => `<path d="${p}"/>`).join('');
  const fills = sh.parts.map(p => `<path d="${p}" fill="url(#${id}g)"/>`).join('');
  const outlines = sh.parts.map(p => `<path d="${p}" fill="none" stroke="${acc}" stroke-opacity=".55" stroke-width="1.2"/>`).join('');
  let sparkles = '';
  for (let i = 0; i < 26; i++) {
    const x = 60 + rnd() * 180, y = 90 + rnd() * 320, r = 0.9 + rnd() * 1.7;
    sparkles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${acc}" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`;
  }
  const dup = g.c2;
  const extra = (sh.extra || '').replace(/DUP/g, dup).replace(/ACC/g, acc);
  const detail = sh.detail.replace(/ACC/g, acc);
  return `<svg class="dress-svg" viewBox="0 0 300 440" role="img" aria-label="${g.name || 'Dress illustration'}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${g.c1}"/><stop offset="1" stop-color="${g.c2}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".42" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <pattern id="${id}p" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M8 2 L14 8 L8 14 L2 8 Z" fill="none" stroke="${acc}" stroke-opacity=".5" stroke-width=".8"/><circle cx="8" cy="8" r="1.1" fill="${acc}" fill-opacity=".7"/></pattern>
    <pattern id="${id}h" width="12" height="14" patternUnits="userSpaceOnUse"><path d="M6 1 C9 5 9 9 6 13 C3 9 3 5 6 1Z" fill="${acc}" fill-opacity=".8"/></pattern>
    <clipPath id="${id}c">${clip}</clipPath>
  </defs>
  <g class="hanger" fill="none" stroke="#a89877" stroke-width="2" stroke-linecap="round"><path d="M150 44 V34 a8 8 0 1 0 -8 -8"/><path d="M150 44 L58 77 Q51 80 59 82 H241 Q249 80 242 77 Z"/></g>
  ${fills}
  <g clip-path="url(#${id}c)">
    <rect width="300" height="440" fill="url(#${id}p)" opacity=".42"/>
    <rect x="0" y="372" width="300" height="70" fill="url(#${id}h)" opacity=".85"/>
    <rect x="0" y="366" width="300" height="3" fill="${acc}" opacity=".9"/>
    <rect width="300" height="440" fill="url(#${id}s)"/>
    ${sparkles}
  </g>
  ${extra}
  ${outlines}
  ${detail}
</svg>`;
}
