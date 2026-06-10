import {
  formatMesos,
  calculateTotal,
  LOST_ITEM_MODE,
} from '../utils/calculator';

function NumberField({ label, hint, value, onChange, min = 0 }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {hint && <span className="field__hint">{hint}</span>}
      <input
        className="field__input"
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function AuctionTotalField({ inputId, value, isTaxEnabled, onChange }) {
  const parsedTotal = calculateTotal(value);

  return (
    <div className="field auction-total-field">
      <label className="field__label" htmlFor={inputId}>
        拍賣場總賣價 (楓幣)
      </label>
      <span className="field__hint">支援加總算式，例如 5000+12000+3000</span>
      <input
        id={inputId}
        className="field__input field__input--expression"
        type="text"
        inputMode="text"
        value={value}
        placeholder="0 或 5000+12000"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="auction-total-confirm">
        <p className="auction-total-confirm__main">
          💰 本次寶物總額為：<strong>{formatMesos(parsedTotal)}</strong> 楓幣
        </p>
        {isTaxEnabled && (
          <p className="auction-total-confirm__tax">(結算將自動扣除 3% 手續費)</p>
        )}
      </div>
    </div>
  );
}

export default function PlayerCard({ index, player, result, lostItemMode, isTaxEnabled, onChange }) {
  const isSelfAbsorbMode = lostItemMode === LOST_ITEM_MODE.SELF_ABSORB;

  return (
    <article className="player-card">
      <header className="player-card__header">
        <span className="player-card__index">P{index}</span>
        <input
          className="player-card__name"
          type="text"
          value={player.name}
          onChange={(e) => onChange(player.id, 'name', e.target.value)}
          placeholder={`玩家 ${index}`}
        />
      </header>

      <div className="player-card__fields">
        <AuctionTotalField
          inputId={`auction-total-${player.id}`}
          value={player.auctionTotal ?? ''}
          isTaxEnabled={isTaxEnabled}
          onChange={(v) => onChange(player.id, 'auctionTotal', v)}
        />
        <NumberField
          label="白金剪刀數量"
          value={player.scissorsCount}
          onChange={(v) => onChange(player.id, 'scissorsCount', v)}
        />
        <NumberField
          label="里程匯率"
          hint="1000 萬楓幣可換的里程數"
          value={player.mileageRate}
          onChange={(v) => onChange(player.id, 'mileageRate', v)}
          min={1}
        />
        <NumberField
          label="搞丟道具價值 (楓幣)"
          hint={
            isSelfAbsorbMode
              ? '原價賠償，不扣 3% 手續費'
              : '目前模式不計入結算，僅供記錄'
          }
          value={player.lostItemValue ?? 0}
          onChange={(v) => onChange(player.id, 'lostItemValue', v)}
        />
      </div>

      <dl className="player-card__stats">
        <div>
          <dt>{isTaxEnabled ? '實際拍賣收入 (扣 3%)' : '實際拍賣收入'}</dt>
          <dd>{formatMesos(result.actualAuctionIncome)}</dd>
        </div>
        {isSelfAbsorbMode && result.effectiveLostItemValue > 0 && (
          <div>
            <dt>搞丟道具賠償</dt>
            <dd>{formatMesos(result.effectiveLostItemValue)}</dd>
          </div>
        )}
        <div>
          <dt>虛擬持有金額</dt>
          <dd>{formatMesos(result.virtualHeldAmount)}</dd>
        </div>
        <div>
          <dt>單把剪刀成本</dt>
          <dd>{formatMesos(result.scissorsUnitCost)}</dd>
        </div>
        <div>
          <dt>個人代墊成本</dt>
          <dd>{formatMesos(result.advanceCost)}</dd>
        </div>
        <div className="player-card__stats-highlight">
          <dt>最終目標金額</dt>
          <dd>{formatMesos(result.finalTarget)}</dd>
        </div>
      </dl>
    </article>
  );
}
