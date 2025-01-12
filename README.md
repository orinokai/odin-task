# Odin Auth Task

A lightweight backend for a headless web application that includes basic auth and data retrieval. The backend is written in Typescript, which is compiled to Javascript and runs on Node.js 18 and up.


## Installation

Install dependencies, build the app and start the server:

```bash
  npm install
  npm run build
  npm start
```


## API Reference

#### Register

```http
  POST /api/auth/register
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. Username |
| `password` | `string` | **Required**. Password |

#### Login

```http
  POST /api/auth/login
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username` | `string` | **Required**. Username |
| `password` | `string` | **Required**. Password |

#### Logout

```http
  POST /api/auth/logout
```

#### Profile

```http
  GET /api/auth/profile
```


## Running Tests

To run tests, use the following command

```bash
  npm test
```


## Design choices

### Framework and libraries

I opted for the [Express](https://expressjs.com) framework because the problem domain is relatively generic and Express is widely known and used. Fastify is an alternative that has built in structured validation, which could have been useful, but it adds boilerplate and the requirements mention simplicity, so I went with Express.

### Auth implementation

I used the [Passport](https://www.passportjs.org) library to implement local, password-based authentication as per the requirements. Using an established library mitigates risk (compared to rolling my own) and provides a common, standard set of APIs, which is useful for maintainability and extensibility, e.g. if further auth strategies need to be added in the future. An alternative approach would have been to use a 3rd party auth provider (e.g. Auth0, Firebase Auth), which would be worth considering as part of a wider cloud-based infra strategy, but didn't seem relevant in the context of the task.

### Session management

Stateful sessions are used to maintain user authentication state across requests by storing the session ID in a http-only cookie. I felt this was the simplest approach given the requirements, but an alternative approach would have been to use stateless sessions, e.g. using JWT, which is potentially more performant and scalable if the app were to be scaled out to multiple servers in a geographically distributed environment.

### Security

The app is protected with [standard security headers](https://github.com/helmetjs/helmet?tab=readme-ov-file#helmet) and rate limiting to mitigate common attacks. In addition, the session cookie is marked as http-only, secure and same-site to mitigate the risk of cross-site scripting (XSS) and cross-site request forgery (CSRF) attacks. User input is validated to prevent NoSQL injection attacks and passwords are hashed using bcrypt before being stored in the database.

## Areas for improvement

### Additional features

The app could be extended to support additional features such as:
- Integration with a transactional email service, e.g. account verification emails
- Multi-factor authentication
- Password recovery
- Social login (e.g. Google, Facebook, etc.)
- Audit trail (e.g. logging user actions)
- etc.

### Security

The use of stateful sessions means that the app could be developed further to support features such as session eviction and key rotation.

Global rate limiting could be considered to mitigate the risk of DDoS attacks. Similarly, request payload size limits could be considered to prevent memory exhaustion attacks.

### Performance and scaling

Moving the session store to an in-memory store, e.g. Redis, would improve performance and scalability because the main bottleneck is the session/user lookup on every request.

### Compliance

The app could be extended to support GDPR compliance by adding a data retention policy and implementing data deletion requests.

### Reliability

In a production environment, backups should be configured and the app should be extended to support observability by adding metrics, logs and tracing. This would allow for monitoring and alerting, giving visibility into the app's health and performance.
