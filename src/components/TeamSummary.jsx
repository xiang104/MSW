import { formatMesos, LOST_ITEM_MODE } from '../utils/calculator';

export default function TeamSummary({ summary }) {
  const showLostItemTotal = summary.lostItemMode === LOST_ITEM_MODE.SELF_ABSORB;

  return (
    <section className="team-summary">
      <h2>團隊結算摘要</h2>
      <div className="team-summary__grid">
        <div className="stat-card">
          <span className="stat-card__label">
            {summary.isTaxEnabled ? '拍賣收入總計 (扣 3%)' : '拍賣收入總計'}
          </span>
          <strong className="stat-card__value">
            {formatMesos(summary.totalActualAuctionIncome)}
          </strong>
        </div>
        {showLostItemTotal && (
          <div className="stat-card">
            <span className="stat-card__label">搞丟道具賠償總計</span>
            <strong className="stat-card__value">
              {formatMesos(summary.totalLostItemValue)}
            </strong>
          </div>
        )}
        <div className="stat-card">
          <span className="stat-card__label">代墊成本總計</span>
          <strong className="stat-card__value">{formatMesos(summary.totalAdvanceCost)}</strong>
        </div>
        <div className="stat-card stat-card--accent">
          <span className="stat-card__label">團隊總淨利</span>
          <strong className="stat-card__value">{formatMesos(summary.teamNetProfit)}</strong>
        </div>
        <div className="stat-card stat-card--gold">
          <span className="stat-card__label">基本分紅 (每人)</span>
          <strong className="stat-card__value">{formatMesos(summary.basicDividend)}</strong>
        </div>
      </div>
    </section>
  );
}
