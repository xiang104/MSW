import { formatMesos } from '../utils/calculator';

export default function SettlementList({ players }) {
  const payers = players.filter((p) => p.action === 'pay');
  const receivers = players.filter((p) => p.action === 'receive' && p.actionAmount > 0);
  const balanced = players.filter((p) => p.actionAmount === 0);

  return (
    <section className="settlement">
      <header className="settlement__header">
        <h2>最終交易結算清單</h2>
        <p>依多退少補計算：需交出或獲得的楓幣差額</p>
      </header>

      <div className="settlement__columns">
        <div className="settlement__column settlement__column--pay">
          <h3>需交出楓幣</h3>
          {payers.length === 0 ? (
            <p className="settlement__empty">無需交出的玩家</p>
          ) : (
            <ul>
              {payers.map((player) => (
                <li key={player.id} className="settlement__item">
                  <span className="settlement__name">{player.name}</span>
                  <span className="settlement__amount">{formatMesos(player.actionAmount)}</span>
                  <span className="settlement__tag">交出</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="settlement__column settlement__column--receive">
          <h3>需獲得楓幣</h3>
          {receivers.length === 0 ? (
            <p className="settlement__empty">無需獲得的玩家</p>
          ) : (
            <ul>
              {receivers.map((player) => (
                <li key={player.id} className="settlement__item">
                  <span className="settlement__name">{player.name}</span>
                  <span className="settlement__amount">{formatMesos(player.actionAmount)}</span>
                  <span className="settlement__tag">獲得</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {balanced.length > 0 && (
        <div className="settlement__balanced">
          <span>已平衡：</span>
          {balanced.map((player) => (
            <span key={player.id} className="settlement__balanced-name">
              {player.name}
            </span>
          ))}
        </div>
      )}

      <table className="settlement__table">
        <thead>
          <tr>
            <th>玩家</th>
            <th>虛擬持有</th>
            <th>最終目標</th>
            <th>差額</th>
            <th>動作</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className={`settlement__row settlement__row--${player.action}`}>
              <td>{player.name}</td>
              <td>{formatMesos(player.virtualHeldAmount)}</td>
              <td>{formatMesos(player.finalTarget)}</td>
              <td>{formatMesos(player.actionAmount)}</td>
              <td>
                {player.actionAmount === 0
                  ? '已平衡'
                  : player.action === 'pay'
                    ? '需交出'
                    : '需獲得'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
