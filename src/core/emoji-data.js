// Emoji for the art browser, built from Unicode ranges so the list stays small in the source.
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i));
const list = (...parts) => parts.flat();

export const EMOJI_GROUPS = [
  { id: 'faces', label: 'Faces', items: list(range(0x1f600, 0x1f64a), range(0x1f910, 0x1f92f), range(0x1f970, 0x1f976), ['\u{1f978}', '\u{1f979}']) },
  { id: 'hands', label: 'People', items: list(range(0x1f44a, 0x1f450), range(0x1f64c, 0x1f64f), ['\u{1f4aa}', '\u{1f9e0}', '\u{1f440}', '\u{1f441}', '\u{1f9b7}', '\u{1f451}', '\u{1f3a9}', '\u{1f393}', '\u{1f9d9}', '\u{1f9da}', '\u{1f9db}', '\u{1f9dc}', '\u{1f9de}', '\u{1f47b}', '\u{1f47d}', '\u{1f47e}', '\u{1f916}', '\u{1f480}', '\u{1f47c}', '\u{1f385}']) },
  { id: 'animals', label: 'Animals', items: list(range(0x1f400, 0x1f43e), range(0x1f980, 0x1f9ae)) },
  { id: 'nature', label: 'Nature', items: list(range(0x1f300, 0x1f320), range(0x1f330, 0x1f344), ['\u{1f525}', '\u{1f4a7}', '\u{1f30a}', '\u{2744}', '\u{26a1}', '\u{2600}', '\u{2601}', '\u{1f308}', '\u{2b50}', '\u{1f31f}', '\u{2728}']) },
  { id: 'food', label: 'Food', items: list(range(0x1f345, 0x1f37f), range(0x1f950, 0x1f96b), ['\u{1f9c0}', '\u{1f9c1}', '\u{1f9c3}', '\u{1f9c7}', '\u{1f9c6}']) },
  { id: 'activity', label: 'Play', items: list(range(0x1f3a0, 0x1f3ca), range(0x1f3cf, 0x1f3d3), ['\u{26bd}', '\u{26be}', '\u{1f94a}', '\u{1f3af}', '\u{1f3b2}', '\u{1f9e9}', '\u{1f3c6}', '\u{1f947}', '\u{1f948}', '\u{1f949}']) },
  { id: 'travel', label: 'Travel', items: list(range(0x1f680, 0x1f6a4), range(0x1f6a5, 0x1f6b5), ['\u{1f3e0}', '\u{1f3e2}', '\u{1f3f0}', '\u{26f0}', '\u{1f3d6}', '\u{1f5fc}', '\u{1f5fd}', '\u{1f5ff}', '\u{1f3a1}', '\u{1f3a2}']) },
  { id: 'objects', label: 'Objects', items: list(range(0x1f4a1, 0x1f4ff), range(0x1f50a, 0x1f53d), ['\u{1f4a3}', '\u{1f48e}', '\u{1f4b0}', '\u{1f511}', '\u{1f512}', '\u{1f527}', '\u{1f528}', '\u{1f9f2}', '\u{1f9ea}', '\u{1f52e}', '\u{1f9ff}', '\u{1f9f8}']) },
  { id: 'hearts', label: 'Hearts', items: list(['\u{2764}', '\u{1f9e1}', '\u{1f49b}', '\u{1f49a}', '\u{1f499}', '\u{1f49c}', '\u{1f5a4}', '\u{1f90d}', '\u{1f90e}'], range(0x1f493, 0x1f49f), ['\u{1f48b}', '\u{1f4af}', '\u{2763}']) },
  { id: 'symbols', label: 'Symbols', glyph: true, items: Array.from('★☆♥♦♣♠✿❀❁❂❃❄❅❆✦✧❖☯☮☭☢☣♻⚡☀☁☂☃⚓⚔✈☎✉✂✎✔✖✘♪♫☺☹☠✡☸✝☦☪♈♉♊♋♌♍♎♏♐♑♒♓◆●■▲▼◀▶←↑→↓↔⇄©®™§¶∞≈≠±×÷ΩπΣΔ€£¥₿¢$%&@#?!') },
];
