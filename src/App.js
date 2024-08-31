import React, { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './components/ApolloClient';
import Login from './components/login';
import Profile from './components/Profile';
import Graph from './components/Graph';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt'));
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const userIdFromToken = decodedToken['https://hasura.io/jwt/claims']?.['x-hasura-user-id'];
        setUserId(userIdFromToken ? parseInt(userIdFromToken, 10) : null);
      } catch (e) {
        console.error('Error decoding token:', e);
        setUserId(null);
      }
    } else {
      setUserId(null);
    }
  }, [token]);

  return (
    <ApolloProvider client={client}>
      <div className="App">
        {!token ? (
          <Login setToken={setToken} />
        ) : (
          <>
            {userId !== null ? (
              <>
                <Profile userId={userId} />
                <Graph userId={userId} />
              </>
            ) : (
              <p>Invalid token. Please log in again.</p>
            )}
          </>
        )}
      </div>
    </ApolloProvider>
  );
}

export default App;
