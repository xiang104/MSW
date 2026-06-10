import { useCallback, useState } from 'react';
import { compressScreenshot } from '../utils/imageCompression';
import { confirmRecognizedTotal, recognizeMesosFromImage } from '../utils/ocr';
import { appendExpressionToSellPrice } from '../utils/sellPrice';
import { uploadRoomScreenshot } from '../utils/storageUpload';

export function useScreenshotUpload({ roomCode, onPlayerUpdate }) {
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [progress, setProgress] = useState(0);

  const processScreenshot = useCallback(
    async (playerId, file) => {
      if (!file) return;

      setActivePlayerId(playerId);
      setProgress(0);

      try {
        const compressedFile = await compressScreenshot(file);
        const ocrResult = await recognizeMesosFromImage(compressedFile, setProgress);

        let sellPriceUpdater = null;
        if (
          ocrResult.expression &&
          ocrResult.total &&
          confirmRecognizedTotal(ocrResult.total)
        ) {
          sellPriceUpdater = (currentSellPrice) =>
            appendExpressionToSellPrice(currentSellPrice, ocrResult.expression);
        }

        let screenshotUrl = null;
        if (roomCode) {
          screenshotUrl = await uploadRoomScreenshot(roomCode, playerId, compressedFile);
        }

        onPlayerUpdate(playerId, {
          sellPriceUpdater,
          screenshotUrl,
        });
      } catch (error) {
        window.alert(error.message || '截圖處理失敗，請稍後再試。');
      } finally {
        setActivePlayerId(null);
        setProgress(0);
      }
    },
    [roomCode, onPlayerUpdate]
  );

  return {
    activePlayerId,
    progress,
    processScreenshot,
  };
}
