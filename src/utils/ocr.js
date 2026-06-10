import Tesseract from 'tesseract.js';
import { formatMesos } from './calculator';

const MIN_AMOUNT = 1_000_000;
const OCR_WHITELIST = '0123456789,';

export function extractLargeAmounts(text) {
  if (!text) return [];

  const matches = String(text).match(/\d[\d,]*/g) || [];
  const amounts = matches
    .map((token) => Number(token.replace(/,/g, '')))
    .filter((value) => Number.isFinite(value) && value > MIN_AMOUNT);

  return [...new Set(amounts)].sort((a, b) => b - a);
}

export async function recognizeMesosFromImage(file, onProgress) {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text' && onProgress) {
        onProgress(Math.round((message.progress || 0) * 100));
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_char_whitelist: OCR_WHITELIST,
    });

    const { data } = await worker.recognize(file);
    const amounts = extractLargeAmounts(data.text);

    return {
      text: data.text,
      amounts,
      primaryAmount: amounts[0] ?? null,
    };
  } finally {
    await worker.terminate();
  }
}

export function confirmRecognizedAmount(amount) {
  if (!amount) return false;
  return window.confirm(`辨識出金額 ${formatMesos(amount)}，是否加入計算？`);
}
