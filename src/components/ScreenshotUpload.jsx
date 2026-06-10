import { useRef } from 'react';

export default function ScreenshotUpload({
  playerId,
  screenshotUrl,
  isProcessing,
  progress,
  disabled,
  onSelectFile,
}) {
  const inputRef = useRef(null);

  function handleChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      onSelectFile(playerId, file);
    }
    event.target.value = '';
  }

  return (
    <div className="screenshot-upload">
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
  );
}
