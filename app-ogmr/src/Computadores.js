// src/Computadores.js
import React, { useState } from 'react';
import './Computadores.css';
import Modal from './Modal';

const initialComputadoresData = [
  { id: 1, porta: 'COM1', status: 'Ativo', isActive: true },
  { id: 2, porta: 'COM2', status: 'Bloqueado', isActive: false },
  { id: 3, porta: 'COM3', status: 'Ativo', isActive: true },
  { id: 4, porta: 'COM4', status: 'Ativo', isActive: false },
  { id: 5, porta: 'COM5', status: 'Ativo', isActive: false },
  { id: 6, porta: 'COM6', status: 'Bloqueado', isActive: true },
  { id: 7, porta: 'COM7', status: 'Ativo', isActive: true },
  { id: 8, porta: 'COM8', status: 'Bloqueado', isActive: false },
];

function Computadores() {
  const [computadoresData, setComputadoresData] = useState(initialComputadoresData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComputador, setSelectedComputador] = useState(null);

  const handleAgendarClick = (computador) => {
    setSelectedComputador(computador);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedComputador(null);
  };

  const toggleStatus = (id) => {
    setComputadoresData((prevData) =>
      prevData.map((computador) =>
        computador.id === id
          ? { 
              ...computador, 
              status: computador.status === 'Ativo' ? 'Bloqueado' : 'Ativo'
            }
          : computador
      )
    );
  };

  const blockAllActive = () => {
    setComputadoresData((prevData) =>
      prevData.map((computador) =>
        computador.status === 'Ativo' ? { ...computador, status: 'Bloqueado'} : computador
      )
    );
  };

  const unblockAllBlocked = () => {
    setComputadoresData((prevData) =>
      prevData.map((computador) =>
        computador.status === 'Bloqueado' 
          ? { ...computador, status: 'Ativo'} 
          : computador
      )
    );
  };

  return (
    <div className="computadores-container">
      <h2>Página de Computadores</h2>
      <button className="block-all-button" onClick={blockAllActive}>
        Bloquear Todos
      </button>
      <button className="unblock-all-button" onClick={unblockAllBlocked}>
        Desbloquear Todos
      </button>
      <br></br><br></br>
      <div className="computadores-list">
        {computadoresData.map((computador) => (
          <div key={computador.id} className={`computador-card ${!computador.isActive ? (computador.status === 'Bloqueado' ? 'card-inativo-bloqueado' : 'card-inativo-ativo') : ''}`}>
            <div className="computador-icon">💻</div>
            <div className="computador-info">
              <p>Porta: {computador.porta}</p>
              <p>Status:  
              <span className={`status ${computador.isActive ? (computador.status === 'Ativo' ? 'st-ativo' : 'st-bloqueado') : 'st-inativo'}`}></span>
              </p>
            </div>
            <div className="computador-actions">
              <button 
                className={computador.status === 'Ativo' ? 'bloqueado' : 'ativo'}
                onClick={() => toggleStatus(computador.id)} 
              >
                {computador.status === 'Bloqueado' ? 'Desbloquear' : 'Bloquear'}
              </button>
              <button 
                className="agendar" 
                onClick={() => handleAgendarClick(computador)}
              >
                Agendar
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        computador={selectedComputador} 
      />
    </div>
  );
}

export default Computadores;
