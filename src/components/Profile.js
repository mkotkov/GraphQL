import React from 'react';
import { useQuery, gql } from '@apollo/client';
import {jwtDecode} from 'jwt-decode'; // Исправленный импорт

const USER_PROFILE = gql`
  query GetUserProfile($id: Int!) {
    user(where: { id: { _eq: $id } }) {
      id
      login
    }
  }
`;

const Profile = () => {
  const token = localStorage.getItem('jwt');

  // Проверка токена перед декодированием
  console.log('Token from localStorage:', token);

  let userId;
  try {
    if (!token || token.split('.').length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const decodedToken = jwtDecode(token);
    console.log('Decoded Token:', decodedToken); // Логируем декодированный токен

    // Проверяем наличие необходимых данных в декодированном токене
    if (decodedToken['https://hasura.io/jwt/claims'] && decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id']) {
      userId = parseInt(decodedToken['https://hasura.io/jwt/claims']['x-hasura-user-id'], 10);
    } else {
      throw new Error('Invalid claims in token');
    }
  } catch (e) {
    console.error('Error decoding token:', e);
    userId = null;
  }

  const { loading, error, data } = useQuery(USER_PROFILE, {
    skip: !userId,  // Пропуск запроса, если нет userId
    variables: { id: userId },
  });

  if (userId === null) {
    return <p>No valid token found.</p>;  // Если userId не удалось извлечь
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  if (!data || !data.user || data.user.length === 0) {
    return <p>No user data found.</p>;  // Если данные пользователя не найдены
  }

  const { login } = data.user[0];

  return (
    <div>
      <h2>User Profile</h2>
      <p>Login: {login}</p>
    </div>
  );
};

export default Profile;
