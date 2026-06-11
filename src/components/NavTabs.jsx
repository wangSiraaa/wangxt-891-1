import React from 'react';

function NavTabs({ activeTab, onTabChange, role }) {
  const tabs = [
    { id: 'tools', label: '🔧 工具列表', roles: ['resident', 'admin', 'maintainer'] },
    { id: 'cart', label: '🛒 借用篮', roles: ['resident'] },
    { id: 'records', label: '📋 借用记录', roles: ['resident', 'admin', 'maintainer'] },
    { id: 'maintenance', label: '🔩 维修管理', roles: ['maintainer', 'admin'] },
    { id: 'leaderboard', label: '🏆 排行榜', roles: ['resident', 'admin', 'maintainer'] },
    { id: 'logs', label: '📝 操作日志', roles: ['admin'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(role));

  return (
    <nav className="nav-tabs">
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default NavTabs;
