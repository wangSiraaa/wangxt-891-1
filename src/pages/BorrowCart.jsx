import React, { useState } from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function BorrowCart({ showAlert }) {
  const { state, currentUser, dispatch, getCartTotal, hasOverdueRecords } = useAppState();
  const [dueDays, setDueDays] = useState(7);
  const [showConfirm, setShowConfirm] = useState(false);

  const cartItems = state.borrowCart;
  const totalDeposit = getCartTotal();

  const handleRemove = (toolId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { toolId } });
    showAlert('info', '已从借用篮移除');
  };

  const handleCheckout = () => {
    if (!currentUser || currentUser.role !== 'resident') {
      showAlert('danger', '只有居民才能借用工具');
      return;
    }

    if (cartItems.length === 0) {
      showAlert('warning', '借用篮为空');
      return;
    }

    if (hasOverdueRecords(currentUser.id)) {
      showAlert('danger', '您有逾期未归还的工具，无法借出');
      return;
    }

    setShowConfirm(true);
  };

  const confirmCheckout = () => {
    dispatch({ 
      type: 'CHECKOUT_BORROW', 
      payload: { userId: currentUser.id, dueDays } 
    });
    setShowConfirm(false);
    showAlert('success', `成功借出 ${cartItems.length} 件工具，预计 ${dueDays} 天后归还`);
  };

  if (!currentUser || currentUser.role !== 'resident') {
    return (
      <div className="card">
        <div className="card-header">
          <h2>🛒 借用篮</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          只有居民身份可以使用借用篮功能
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>🛒 借用篮</h2>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {cartItems.length} 件工具
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            借用篮是空的，快去挑选工具吧～
          </div>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={item.toolId} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.toolName}</div>
                  <div className="cart-item-deposit">押金 ¥{item.deposit}</div>
                </div>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(item.toolId)}
                >
                  移除
                </button>
              </div>
            ))}

            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>工具数量</span>
                <span>{cartItems.length} 件</span>
              </div>
              <div className="cart-summary-row">
                <span>借用期限</span>
                <span>{dueDays} 天</span>
              </div>
              <div className="cart-summary-total cart-summary-row">
                <span>押金总计</span>
                <span>¥{totalDeposit}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label>调整借用期限（天）</label>
              <select value={dueDays} onChange={e => setDueDays(Number(e.target.value))}>
                <option value={3}>3 天</option>
                <option value={7}>7 天</option>
                <option value={14}>14 天</option>
                <option value={30}>30 天</option>
              </select>
            </div>

            {hasOverdueRecords(currentUser.id) && (
              <div className="alert alert-danger">
                您有逾期未归还的工具，请先归还后再借用新工具。
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  dispatch({ type: 'CLEAR_CART' });
                  showAlert('info', '借用篮已清空');
                }}
              >
                清空借用篮
              </button>
              <button 
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleCheckout}
                disabled={hasOverdueRecords(currentUser.id)}
              >
                确认借出
              </button>
            </div>
          </>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认借出</h3>
              <button className="modal-close" onClick={() => setShowConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>即将借出以下工具：</p>
              <ul style={{ margin: '12px 0 12px 20px' }}>
                {cartItems.map(item => (
                  <li key={item.toolId} style={{ marginBottom: '6px' }}>
                    {item.toolName} - 押金 ¥{item.deposit}
                  </li>
                ))}
              </ul>
              <div className="alert alert-info">
                <strong>借用期限：</strong>{dueDays} 天<br/>
                <strong>押金总计：</strong>¥{totalDeposit}<br/>
                <small>请按时归还，逾期将影响您的借用权限</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmCheckout}>
                确认借出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BorrowCart;
