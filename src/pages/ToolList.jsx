import React, { useState } from 'react';
import { useAppState } from '../store/AppStateContext.jsx';
import ToolCard from '../components/ToolCard.jsx';

function ToolList({ onToolClick, showAlert }) {
  const { state, currentUser, dispatch, canBorrowTool, hasOverdueRecords } = useAppState();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTools = state.tools.filter(tool => {
    if (selectedCategory !== 'all' && tool.categoryId !== selectedCategory) return false;
    if (searchTerm && !tool.name.includes(searchTerm) && !tool.description.includes(searchTerm)) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'available' && (tool.status !== 'available' || tool.locked)) return false;
      if (statusFilter !== 'available' && tool.status !== statusFilter) return false;
    }
    return true;
  });

  const handleAddToCart = (toolId) => {
    if (currentUser?.role !== 'resident') {
      showAlert('warning', '只有居民身份才能借用工具');
      return;
    }
    
    const tool = state.tools.find(t => t.id === toolId);
    if (tool.locked) {
      showAlert('danger', '该工具已被管理员锁定，暂不可借用');
      return;
    }
    
    if (tool.status !== 'available') {
      showAlert('warning', '该工具当前不可借用');
      return;
    }
    
    if (hasOverdueRecords(currentUser.id)) {
      showAlert('warning', '您有逾期未归还的工具，只能预约不能借出');
      return;
    }
    
    if (state.borrowCart.some(item => item.toolId === toolId)) {
      showAlert('warning', '该工具已在借用篮中');
      return;
    }
    
    dispatch({ type: 'ADD_TO_CART', payload: { toolId } });
    showAlert('success', '已加入借用篮');
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>工具列表</h2>
          <span style={{ fontSize: '14px', color: '#666' }}>
            共 {filteredTools.length} 件工具
          </span>
        </div>
        
        <div className="filter-section">
          <input
            type="text"
            placeholder="搜索工具名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">全部分类</option>
            {state.categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">全部状态</option>
            <option value="available">可借用</option>
            <option value="borrowed">已借出</option>
            <option value="damaged">已损坏</option>
            <option value="maintenance">维修中</option>
            <option value="locked">已锁定</option>
          </select>
        </div>
      </div>

      <div className="tool-grid">
        {filteredTools.map(tool => (
          <div key={tool.id} style={{ position: 'relative' }}>
            <ToolCard tool={tool} onClick={onToolClick} />
            {currentUser?.role === 'resident' && (
              <button
                className="btn btn-primary btn-sm"
                style={{ 
                  position: 'absolute', 
                  bottom: '70px', 
                  right: '12px',
                  display: canBorrowTool(tool.id, currentUser.id) ? 'block' : 'none'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(tool.id);
                }}
                disabled={!canBorrowTool(tool.id, currentUser.id)}
              >
                加入借用篮
              </button>
            )}
            {currentUser?.role === 'resident' && 
             tool.status === 'available' && 
             !tool.locked &&
             hasOverdueRecords(currentUser.id) && (
              <div style={{ 
                position: 'absolute', 
                bottom: '70px', 
                right: '12px',
                background: '#ffc107',
                color: '#333',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
              }}>
                仅可预约
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          暂无符合条件的工具
        </div>
      )}
    </div>
  );
}

export default ToolList;
