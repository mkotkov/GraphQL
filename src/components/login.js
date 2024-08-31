import React, { useState } from 'react';
import axios from 'axios';
import '../css/login.css'; 

const BASE_URL = 'https://01.kood.tech/api';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');  // Здесь вводится как имя пользователя, так и email
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
  
    const encodedCredentials = btoa(`${username}:${password}`);
    console.log('Encoded credentials:', encodedCredentials);
  
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/signin`,
        {},
        {
          headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json', // Добавьте этот заголовок, если требуется API
          },
        }
      );

      console.log('Server response:', response); // Логируем полный ответ сервера

      // Получаем токен из response.data
      const token = response.data;
      
      console.log('Received token:', token); // Проверка, что токен получен

      if (token) {
        localStorage.setItem('jwt', token);
        console.log('Token saved in localStorage:', localStorage.getItem('jwt')); // Проверка сохранения
        setToken(token);
      } else {
        setError('Failed to retrieve token');
      }
    } catch (err) {
      console.error('Error during authentication:', err.response?.data || err.message);
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className='login-container'>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username or Email"  // Подсказка, что можно вводить и имя пользователя, и email
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
};

export default Login;
