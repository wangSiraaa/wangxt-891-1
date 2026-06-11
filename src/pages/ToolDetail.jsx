import React from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function ToolDetail({ toolId, onClose, showAlert }) {
  const { getToolById, getCategoryById, currentUser, dispatch, canBorrowTool, hasOverdueRecords, state } = useAppState();
  
  const tool = getToolById(toolId);
  const category = getCategoryById(tool?.categoryId);

  if (!tool) return null;

  const statusLabel = {
    available: '可借用',
    borrowed: '已借出',
    damaged: '已损坏',
    maintenance: '维修中',
    locked: '已锁定',
  }[tool.status] || tool.status;

  const handleAddToCart = () => {
    if (currentUser?.role !== 'resident') {
      showAlert('warning', '只有居民身份才能借用工具');
      return;
    }
    
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

  const handleLock = () => {
    if (tool.locked) {
      dispatch({ type: 'UNLOCK_TOOL', payload: { toolId } });
      showAlert('success', '工具已解锁');
    } else {
      dispatch({ type: 'LOCK_TOOL', payload: { toolId } });
      showAlert('success', '工具已锁定');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>工具详情</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="tool-detail-header">
            <div className="tool-detail-image">{tool.image}</div>
            <div className="tool-detail-info">
              <h2>{tool.name}</h2>
              <span className={`tool-status ${tool.locked ? 'locked' : tool.status}`}>
                {tool.locked ? '已锁定' : statusLabel}
              </span>
              <p style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
                {tool.description}
              </p>
            </div>
          </div>

          <div className="tool-detail-meta">
            <div>
              <span>分类</span>
              <span>{category?.icon} {category?.name}</span>
            </div>
            <div>
              <span>押金</span>
              <span style={{ color: '#e74c3c' }}>¥{tool.deposit}</span>
            </div>
            <div>
              <span>累计借用</span>
              <span>{tool.totalBorrows} 次</span>
            </div>
            <div>
              <span>工具编号</span>
              <span>{tool.id}</span>
            </div>
          </div>

          {currentUser?.role === 'resident' && (
            <div style={{ marginTop: '20px' }}>
              {tool.status === 'available' && !tool.locked && (
                hasOverdueRecords(currentUser.id) ? (
                  <div className="alert alert-warning">
                    您有逾期未归还的工具，当前只能预约不能借出。请先归还逾期工具。
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary btn-block"
                    onClick={handleAddToCart}
                    disabled={!canBorrowTool(tool.id, currentUser.id)}
                  >
                    {state.borrowCart.some(item => item.toolId === tool.id) 
                      ? '已在借用篮中' 
                      : '加入借用篮'}
                  </button>
                )
              )}
              {tool.status === 'borrowed' && (
                <div className="alert alert-info">该工具已被借出，请耐心等待归还</div>
              )}
              {tool.status === 'damaged' && (
                <div className="alert alert-danger">该工具已损坏，正在等待维修</div>
              )}
              {tool.status === 'maintenance' && (
                <div className="alert alert-warning">该工具正在维修中</div>
              )}
              {tool.locked && (
                <div className="alert alert-danger">该工具已被管理员锁定，暂不可借用</div>
              )}
            </div>
          )}

          {currentUser?.role === 'admin' && (
            <div style={{ marginTop: '20px' }}>
              <button 
                className={`btn ${tool.locked ? 'btn-success' : 'btn-warning'} btn-block`}
                onClick={handleLock}
              >
                {tool.locked ? '解锁工具' : '锁定工具'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolDetail;
