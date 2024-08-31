import { gql } from '@apollo/client';

export const USER_PROFILE = gql`
  query GetUserProfile($id: Int!) {
    user(where: { id: { _eq: $id } }) {
      id
      login
      firstName
      lastName
    }
  }
`;