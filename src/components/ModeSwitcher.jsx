export default function ModeSwitcher({ currentMode, onChange }) {
  return (
    <section className="mode-switcher">
      <button
        type="button"
        className={`mode-switcher__btn ${currentMode === 'local' ? 'mode-switcher__btn--active' : ''}`}
        onClick={() => onChange('local')}
      >
        單機快速結算
      </button>
      <button
        type="button"
        className={`mode-switcher__btn ${currentMode === 'room' ? 'mode-switcher__btn--active' : ''}`}
        onClick={() => onChange('room')}
      >
        建立 / 加入多人房間
      </button>
    </section>
  );
}
