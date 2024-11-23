import React, { useState, useEffect } from 'react';
import './Computadores.css';
import Modal from './Modal';

function Computadores() {
  const [computadoresData, setComputadoresData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComputador, setSelectedComputador] = useState(null);

  // Fetch data from server on component mount
  useEffect(() => {
    const fetchComputadores = async () => {
      try {
        const response = await fetch('http://localhost:5000/computadores'); // Replace with your server endpoint
        const data = await response.json();
        setComputadoresData(data);
      } catch (error) {
        console.error('Error fetching computadores data:', error);
      }
    };

    fetchComputadores();
  }, []);

  // Handle agendar button click
  const handleAgendarClick = (computador) => {
    setSelectedComputador(computador);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedComputador(null);
  };

  // Toggle status and update the backend
  const toggleStatus = async (id) => {
    try {
      const computador = computadoresData.find((c) => c.id === id);
      const updatedStatus = computador.status ? false : true;
      // Update on the server
      const response = await fetch(`http://localhost:5000/computadores/single/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus }),
      });

      if (response.ok) {
        // Update local state
        setComputadoresData((prevData) =>
          prevData.map((computador) =>
            computador.id === id ? { ...computador, status: updatedStatus } : computador
          )
        );
      } else {
        console.error('Error updating status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Block all active computadores
  const blockAllActive = async () => {
    try {
      const response = await fetch('http://localhost:5000/computadores/block-all', {
        method: 'PUT',
      });

      if (response.ok) {
        setComputadoresData((prevData) =>
          prevData.map((computador) =>
            computador.status ? { ...computador, status: false } : computador
          )
        );
      } else {
        console.error('Error blocking all active computadores');
      }
    } catch (error) {
      console.error('Error blocking all active computadores:', error);
    }
  };

  // Unblock all blocked computadores
  const unblockAllBlocked = async () => {
    try {
      const response = await fetch('http://localhost:5000/computadores/unblock-all', {
        method: 'PUT',
      });

      if (response.ok) {
        setComputadoresData((prevData) =>
          prevData.map((computador) =>
            !computador.status ? { ...computador, status: true } : computador
          )
        );
      } else {
        console.error('Error unblocking all blocked computadores');
      }
    } catch (error) {
      console.error('Error unblocking all blocked computadores:', error);
    }
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
          <div key={computador.id} className={'computador-card'}>
            <div className="computador-icon">💻</div>
            <div className="computador-info">
              <p>Porta: {computador.porta}</p>
              <p>Status:  
              <span className={`status ${computador.status ? 'st-ativo' : 'st-bloqueado'}`}></span>
              </p>
            </div>
            <div className="computador-actions">
              <button 
                className={computador.status ? 'ativo' : 'bloqueado'}
                onClick={() => toggleStatus(computador.id)} 
              >
                {computador.status ? 'Bloquear' : 'Desbloquear'}
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
