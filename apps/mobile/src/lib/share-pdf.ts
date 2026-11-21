import { File, Paths } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';

const PDF_MIME_TYPE = 'application/pdf';
const PDF_UTI = 'com.adobe.pdf';
const UNSAFE_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]+/g;
const NO_MARGINS = { top: 0, right: 0, bottom: 0, left: 0 };

interface SharePdfInput {
  html: string;
  pageSize: { width: number; height: number };
  fileName: string;
  fallbackFileName: string;
  dialogTitle: string;
}

function safePdfFileName(name: string, fallbackName: string): string {
  const safeName = name.replace(UNSAFE_FILE_NAME_CHARACTERS, ' ').trim();
  return `${safeName || fallbackName}.pdf`;
}

async function renameInCache(uri: string, fileName: string): Promise<string> {
  const destination = new File(Paths.cache, fileName);
  await new File(uri).move(destination, { overwrite: true });
  return destination.uri;
}

export async function sharePdf({
  html,
  pageSize,
  fileName,
  fallbackFileName,
  dialogTitle,
}: SharePdfInput): Promise<void> {
  const { uri } = await printToFileAsync({
    html,
    width: pageSize.width,
    height: pageSize.height,
    margins: NO_MARGINS,
  });
  const fileUri = await renameInCache(uri, safePdfFileName(fileName, fallbackFileName));
  await shareAsync(fileUri, { mimeType: PDF_MIME_TYPE, UTI: PDF_UTI, dialogTitle });
}
