import Tesseract from 'tesseract.js';
import { formatMesos } from './calculator';

const MIN_AMOUNT = 1_000_000;
const OCR_WHITELIST = '0123456789,. ';
const PRICE_PATTERN = /\d{1,3}(?:[.,\s]\d{3})+\b/g;

export function parseOcrPrices(text) {
  console.log('OCR 原始辨識文字: ', text);

  if (!text) return null;

  const matches = text.match(PRICE_PATTERN);
  if (!matches) return null;

  const amounts = matches
    .map((token) => Number(token.replace(/[.,\s]/g, '')))
    .filter((value) => Number.isFinite(value) && value >= MIN_AMOUNT);

  if (amounts.length === 0) return null;

  const expression = amounts.map(String).join('+');
  const total = amounts.reduce((sum, num) => sum + num, 0);

  return {
    amounts,
    expression,
    total,
  };
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
    const parsed = parseOcrPrices(data.text);

    return {
      text: data.text,
      amounts: parsed?.amounts ?? [],
      expression: parsed?.expression ?? null,
      total: parsed?.total ?? null,
    };
  } finally {
    await worker.terminate();
  }
}

export function confirmRecognizedTotal(total) {
  if (!total) return false;
  return window.confirm(`辨識出多筆金額總和：${formatMesos(total)}，是否帶入計算？`);
}
