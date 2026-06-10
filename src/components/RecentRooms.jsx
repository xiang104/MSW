import { getRoomHistory } from '../utils/roomHistory';

export default function RecentRooms({ onJoinRoom, refreshKey = 0 }) {
  const history = getRoomHistory();

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="recent-rooms">
      <span className="recent-rooms__label">最近加入的房間</span>
      <div className="recent-rooms__list">
        {history.map((item) => (
          <button
            key={`${item.code}-${refreshKey}`}
            type="button"
            className="recent-rooms__item"
            onClick={() => onJoinRoom(item.code)}
            title={`加入 ${item.code}`}
          >
            <strong>{item.name}</strong>
            <span>{item.code}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
