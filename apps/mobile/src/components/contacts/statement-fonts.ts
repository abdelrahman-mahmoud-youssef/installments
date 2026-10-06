import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

export const STATEMENT_FONT_FAMILIES = {
  latin: 'IBM Plex Sans',
  arabic: 'Cairo',
} as const;

type StatementFontFamily = (typeof STATEMENT_FONT_FAMILIES)[keyof typeof STATEMENT_FONT_FAMILIES];

interface StatementFontFace {
  family: StatementFontFamily;
  weight: number;
  source: number;
}

const LATIN_FACES: StatementFontFace[] = [
  { family: 'IBM Plex Sans', weight: 400, source: require('@expo-google-fonts/ibm-plex-sans/400Regular/IBMPlexSans_400Regular.ttf') },
  { family: 'IBM Plex Sans', weight: 600, source: require('@expo-google-fonts/ibm-plex-sans/600SemiBold/IBMPlexSans_600SemiBold.ttf') },
  { family: 'IBM Plex Sans', weight: 700, source: require('@expo-google-fonts/ibm-plex-sans/700Bold/IBMPlexSans_700Bold.ttf') },
];

const ARABIC_FACES: StatementFontFace[] = [
  { family: 'Cairo', weight: 400, source: require('@expo-google-fonts/cairo/400Regular/Cairo_400Regular.ttf') },
  { family: 'Cairo', weight: 600, source: require('@expo-google-fonts/cairo/600SemiBold/Cairo_600SemiBold.ttf') },
  { family: 'Cairo', weight: 700, source: require('@expo-google-fonts/cairo/700Bold/Cairo_700Bold.ttf') },
];

const AMOUNT_FONT_WEIGHT = 700;

const fontFaceCache = new Map<number, Promise<string>>();

async function readFontAsBase64(source: number): Promise<string> {
  const asset = await Asset.fromModule(source).downloadAsync();
  if (!asset.localUri) {
    throw new Error('Statement font is unavailable');
  }
  return new File(asset.localUri).base64();
}

function fontFaceRule(face: StatementFontFace): Promise<string> {
  const cached = fontFaceCache.get(face.source);
  if (cached) {
    return cached;
  }
  const rule = readFontAsBase64(face.source).then(
    (base64) =>
      `@font-face { font-family: '${face.family}'; font-weight: ${face.weight}; src: url(data:font/ttf;base64,${base64}) format('truetype'); }`,
  );
  rule.catch(() => fontFaceCache.delete(face.source));
  fontFaceCache.set(face.source, rule);
  return rule;
}

export async function loadStatementFontFaces(isRTL: boolean): Promise<string> {
  const faces = isRTL
    ? [...ARABIC_FACES, ...LATIN_FACES.filter((face) => face.weight === AMOUNT_FONT_WEIGHT)]
    : LATIN_FACES;
  const rules = await Promise.all(faces.map(fontFaceRule));
  return rules.join('\n');
}
