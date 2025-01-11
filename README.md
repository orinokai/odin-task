# Odin Task

A lightweight backend for a headless web application that includes basic auth and data retrieval. The backend is written in Typescript, which is compiled to Javascript and runs on Node.js.


## Installation

Install dependencies, build the app and start the server:

```bash
  npm install
  npm run build
  npm run start
```
    
## Usage/Examples

```javascript
import Component from 'my-project'

function App() {
  return <Component />
}
```


## API Reference

#### Get all items

```http
  GET /api/items
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key |

#### Get item

```http
  GET /api/items/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of item to fetch |

#### add(num1, num2)

Takes two numbers and returns the sum.


## Running Tests

To run tests, run the following command

```bash
  npm run test
```


## Design choices

### Framework and libraries

I opted to use the Express framework because it is widely known and the problem domain is quite generic. Fastify is an alternative that has built in structured validation, which could have been useful, but it adds boilerplate and the requirements mention simplicity, so I went with Express.

### Auth implementation

The Passport library is used to implement local, password-based authentication as per the requirements. Using an established library mitigates risk (compared to rolling my own) and provides a common, standard set of APIs, which is useful for maintainability and extensibility, e.g. if further auth strategies need to be added in the future. An alternative approach is the use of a 3rd party auth provider (e.g. Auth0, Firebase Auth), which might be worth considering as part of a wider cloud-based infra strategy, but didn't seem relevant in the context of the task.

## Areas for improvement

dotenv

