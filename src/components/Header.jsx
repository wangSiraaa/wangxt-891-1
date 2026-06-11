import React from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function Header() {
  const { state, currentUser, dispatch, getOverdueRecords } = useAppState();

  const handleRoleChange = (e) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: e.target.value });
  };

  const overdueCount = getOverdueRecords().length;

  return (
    <header className="app-header">
      <div>
        <h1>🛠️ 社区共享工具借还台</h1>
        <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
          邻里互助，工具共享，共建美好社区
        </p>
      </div>
      <div className="role-selector">
        <label>当前身份：</label>
        <select value={state.currentUserId} onChange={handleRoleChange}>
          {state.users.map(user => (
            <option key={user.id} value={user.id}>
              {user.avatar} {user.name} 
              ({user.role === 'admin' ? '管理员' : user.role === 'maintainer' ? '维修志愿者' : '居民'})
            </option>
          ))}
        </select>
        {overdueCount > 0 && currentUser?.role === 'resident' && (
          <span className="overdue-badge">{overdueCount} 笔逾期</span>
        )}
      </div>
    </header>
  );
}

export default Header;
