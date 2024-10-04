import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Computadores from './Computadores';

function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate(); // Hook para redirecionamento

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login && senha) {
      setMensagem('Login bem-sucedido!');
      navigate('/computadores'); // Redireciona para a página de computadores
    } else {
      setMensagem('Por favor, preencha todos os campos.');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Página de Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login">Login:</label>
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="senha">Senha:</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
          {mensagem && <p className="mensagem">{mensagem}</p>}
        </form>
      </div>
    </div>
  );
}

// Componente principal com roteamento
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/computadores" element={<Computadores />} />
      </Routes>
    </Router>
  );
}

export default App;
