import React from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function Leaderboard() {
  const { getLeaderboard, state } = useAppState();
  const leaderboard = getLeaderboard();

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>🏆 借用排行榜</h2>
          <span style={{ fontSize: '14px', color: '#666' }}>
            按借用次数排名
          </span>
        </div>

        <ul className="leaderboard-list">
          {leaderboard.map(user => (
            <li key={user.id} className="leaderboard-item">
              <div className={`leaderboard-rank ${user.rank <= 3 ? `top${user.rank}` : ''}`}>
                {user.rank}
              </div>
              <div style={{ fontSize: '24px', marginRight: '10px' }}>{user.avatar}</div>
              <div className="leaderboard-name">
                {user.name}
                <div style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
                  按时归还率：{user.borrowCount > 0 
                    ? Math.round(user.onTimeReturn / user.borrowCount * 100) 
                    : 0}%
                </div>
              </div>
              <div className="leaderboard-count">
                {user.borrowCount} 次
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>📊 社区数据概览</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600' }}>{state.tools.length}</div>
            <div style={{ fontSize: '13px', opacity: '0.9' }}>共享工具</div>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #f093fb, #f5576c)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600' }}>
              {state.users.filter(u => u.role === 'resident').length}
            </div>
            <div style={{ fontSize: '13px', opacity: '0.9' }}>社区居民</div>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600' }}>{state.borrowRecords.length}</div>
            <div style={{ fontSize: '13px', opacity: '0.9' }}>累计借用</div>
          </div>
          <div style={{ padding: '16px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', borderRadius: '8px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600' }}>
              {state.tools.filter(t => t.status === 'available' && !t.locked).length}
            </div>
            <div style={{ fontSize: '13px', opacity: '0.9' }}>可借工具</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
