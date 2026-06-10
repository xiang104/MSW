import { useCallback, useEffect, useRef } from 'react';

function getClipboardImageFile(clipboardData) {
  if (!clipboardData?.files?.length) return null;

  return Array.from(clipboardData.files).find((file) => file.type.startsWith('image/')) ?? null;
}

export default function ScreenshotUpload({
  playerId,
  screenshotUrl,
  isProcessing,
  progress,
  disabled,
  onSelectFile,
}) {
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleImageUpload = useCallback(
    (file) => {
      if (!file || disabled || isProcessing) return;
      onSelectFile(playerId, file);
    },
    [disabled, isProcessing, onSelectFile, playerId]
  );

  function handleChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    event.target.value = '';
  }

  const handlePaste = useCallback(
    (event) => {
      if (disabled || isProcessing) return;

      const imageFile = getClipboardImageFile(event.clipboardData);
      if (!imageFile) return;

      event.preventDefault();
      handleImageUpload(imageFile);
    },
    [disabled, isProcessing, handleImageUpload]
  );

  function handleContainerMouseDown(event) {
    if (event.target.closest('input, button, a')) return;
    containerRef.current?.focus();
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    container.addEventListener('paste', handlePaste);
    return () => container.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div
      ref={containerRef}
      className="screenshot-upload"
      tabIndex={0}
      onMouseDown={handleContainerMouseDown}
      aria-label="截圖上傳區，可點擊後使用 Ctrl + V 貼上圖片"
    >
      <div className="screenshot-upload__actions">
        <input
          ref={inputRef}
          className="screenshot-upload__input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          disabled={disabled || isProcessing}
        />
        <button
          type="button"
          className="btn btn--outline screenshot-upload__btn"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? `辨識中 ${progress}%` : '上傳截圖'}
        </button>

        {screenshotUrl && (
          <a
            className="screenshot-upload__preview"
            href={screenshotUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img src={screenshotUrl} alt="拍賣截圖預覽" />
            <span>查看截圖</span>
          </a>
        )}
      </div>

      <p className="screenshot-upload__hint">
        💡 建議按 Win + Shift + S 僅截取「純金額數字」，辨識更精準！（支援直接 Ctrl + V 貼上圖片）
      </p>
    </div>
  );
}
