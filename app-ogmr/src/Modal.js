// src/Modal.js
import React, { useState } from 'react';
import './App.css';
import './Modal.css';

function Modal({ isOpen, onClose, computador }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const scheduleData = {
      porta: computador?.porta,
      login: computador?.login,
      startTime,
      endTime,
    };

    try {
      if (new Date(startTime) >= new Date(endTime)) {
        return alert('Tempo de início menor que tempo de fim.');
      }
      const response = await fetch('http://localhost:5000/agendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        console.log('Scheduled successfully:', await response.json());
        onClose();
      } else {
        console.error('Failed to schedule:', await response.json());
      }
    } catch (error) {
      console.error('Error scheduling:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Agendando...' : 'Agendar'}
            </button>
            <button type="button" onClick={onClose}>Fechar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Modal;
