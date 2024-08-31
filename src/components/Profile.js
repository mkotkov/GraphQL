import React from 'react';
import { useQuery } from '@apollo/client';
import {jwtDecode} from 'jwt-decode'; // Исправленный импорт
import { USER_PROFILE } from './apiConect';
import '../css/profile.css';

const Profile = () => {
  const token = localStorage.getItem('jwt');

  let userId;
  try {
    if (!token || token.split('.').length !== 3) {
      throw new Error('Invalid token format');
    }

    const decodedToken = jwtDecode(token);

    if (
      decodedToken['https://hasura.io/jwt/claims'] &&
      decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']
    ) {
      userId = parseInt(
        decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id'],
        10
      );
    } else {
      throw new Error('Invalid claims in token');
    }
  } catch (e) {
    console.error('Error decoding token:', e);
    userId = null;
  }

  const { loading, error, data } = useQuery(USER_PROFILE, {
    skip: !userId, // Пропуск запроса, если нет userId
    variables: { id: userId },
  });

  if (userId === null) {
    return <p>No valid token found.</p>; // Если userId не удалось извлечь
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  if (!data || !data.user || data.user.length === 0) {
    return <p>No user data found.</p>; // Если данные пользователя не найдены
  }

  const { login, firstName, lastName } = data.user[0];

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    window.location.reload();
  };

  return (
    <><header className="header">
      <div className="logo">
        <h1>GQL</h1>
      </div>
      <div className="user-container">
        <span className="login ">
          <p>{login}</p>
        </span>
        <button className="logout-button" onClick={handleLogout}>
        <span class="material-symbols-outlined">
        logout
        </span>
        </button>
      </div>
    </header>
    <div className='title'>
        <h2>Welcome, {firstName} {lastName} </h2>
    </div></>
  );
};

export default Profile;
