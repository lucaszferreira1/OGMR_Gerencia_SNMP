import React, { useState, useEffect } from 'react';
import {useLocation} from 'react-router-dom';
import './Computadores.css';
import Modal from './Modal';

function Computadores() {
  const [computadoresData, setComputadoresData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComputador, setSelectedComputador] = useState(null);
  const location = useLocation();
  const login = location.state?.login;

  // Fetch data from server on component mount
  useEffect(() => {
    const fetchComputadores = async () => {
      try {
        const response = await fetch('http://localhost:5000/computadores', {
          method: 'POST', // Use POST since we're sending data in the body
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login }), // Send login as JSON
        });

        if (!response.ok) {
          throw new Error('Failed to fetch computadores');
        }

        const data = await response.json();
        setComputadoresData(data);
      } catch (error) {
        console.error('Error fetching computadores data:', error);
      }
    };

    if (login) fetchComputadores(); // Only fetch if login is available
  }, [login]);

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
  const toggleStatus = async (porta) => {
    try {
      const computador = computadoresData.find((c) => c.porta === porta);
      const updatedStatus = computador.status ? false : true;
      // Update on the server
      const response = await fetch(`http://localhost:5000/computadores/single/${porta}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus , login: login}),
      });

      if (response.ok) {
        // Update local state
        setComputadoresData((prevData) =>
          prevData.map((computador) =>
            computador.porta === porta ? { ...computador, status: updatedStatus } : computador
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login }),
      });

      if (response.ok) {
        setComputadoresData((prevData) =>
          prevData.map((computador) =>
            computador.status ? { ...computador, status: false , login: login} : computador
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login }),
      });

      if (response.ok) {
        setComputadoresData((prevData) =>
          prevData.map((computador) =>
            !computador.status ? { ...computador, status: true , login: login} : computador
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
        {computadoresData
          .slice() // Create a copy to avoid mutating the original state
          .sort((a, b) => a.porta - b.porta) // Sort by port number
          .map((computador) => (
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
                    onClick={() => toggleStatus(computador.porta)} 
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
