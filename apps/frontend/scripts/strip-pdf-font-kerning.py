from pathlib import Path

from fontTools.ttLib import TTFont

PDF_FONT_DIRECTORY = Path(__file__).resolve().parent.parent / 'public' / 'fonts' / 'pdf'
CAIRO_PDF_FONT_PATTERN = 'cairo-arabic-*.woff'


def strip_kerning(path: Path) -> int:
    font = TTFont(path, recalcTimestamp=False)
    emptied = 0
    for record in font['GPOS'].table.FeatureList.FeatureRecord:
        if record.FeatureTag == 'kern':
            record.Feature.LookupListIndex = []
            record.Feature.LookupCount = 0
            emptied += 1
    font.save(path)
    return emptied


def main() -> None:
    paths = sorted(PDF_FONT_DIRECTORY.glob(CAIRO_PDF_FONT_PATTERN))
    if not paths:
        raise SystemExit(f'No {CAIRO_PDF_FONT_PATTERN} files found in {PDF_FONT_DIRECTORY}')
    for path in paths:
        print(f'{path.name}: emptied {strip_kerning(path)} kern feature records')


if __name__ == '__main__':
    main()
