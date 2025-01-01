import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { I18nextProvider } from 'react-i18next';

import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import store from './store';
import i18n from './i18n';

// GraphQL API endpoint
const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHQL_API_ENDPOINT,
});

// Set up authentication headers for GraphQL requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('authToken');
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Create the Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Example of a complex type policy for a paginated query
          allPosts: {
            keyArgs: false,
            merge(existing = { posts: [], hasNextPage: true }, incoming) {
              return {
                ...incoming,
                posts: [...existing.posts, ...incoming.posts],
              };
            },
          },
          // ... more type policies for other queries
        },
      },
      // ... type policies for other types
    },
  }),
  // ... other Apollo Client options (e.g., connectToDevTools, defaultOptions)
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <Provider store={store}>
        <HelmetProvider>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </HelmetProvider>
      </Provider>
    </ApolloProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();