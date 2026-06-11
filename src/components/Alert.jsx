import React from 'react';

function Alert({ type, message }) {
  const typeClass = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-danger',
  }[type] || 'alert-info';

  return (
    <div className={`alert ${typeClass}`}>
      {message}
    </div>
  );
}

export default Alert;
