// src/Modal.js
import React, { useState } from 'react';
import './App.css';
import './Modal.css';

function Modal({ isOpen, onClose, computador }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Scheduling:', {
      computador,
      startTime,
      endTime,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Agendar Computador: {computador?.porta}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="startTime">Início:</label>
            <input
              type="datetime-local"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="endTime">Fim:</label>
            <input
              type="datetime-local"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit">Agendar</button>
            <button type="button" onClick={onClose}>Fechar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Modal;
