# COP4710-GroceryStore
Database Design final project by Jonathan Svensson and Maggie Liott

## Prerequites:
- Node.js (the project was developed against the current LTS release)
- A PostgreSQL instance (the project will connect based on the environment variables provided in a `.env` file
  - Note: for reasons unknown, the `node-postgres` package **does not work** unless the database user has a specified password

## Instructions:
1. Run `npm install` from the project root directory
2. Run `npm start` to run the application which can be acessed from `localhost:8080` in the browser. 

The following environment variables can be specified in a `.env` file:
- `PGUSER=postgres` PostgreSQL username
- `PGPASSWORD=password` PostgreSQL password
- `PGDATABASE=postgres` Name of PostgreSQL database
- `PGHOST=localhost` Hostname of PostgreSQL server
- `PGPORT=5432` Port where PostgreSQL is running
- `PORT=8080` Port to run the application on. If not specified, defaults to `8080`
- `USE_DB_AUTH=1` Whether or not to enable database storage of users. If set to 0 it will only use a local array
- `INIT_DB=1` If set to 1, the application will re-create the database tables and fill them with data specified in the `products.csv`, `stores.csv`, and `manages.csv` files.

## Screenshots:
Login:

![login page](/screenshots/login.png)

Register:

![register page](/screenshots/register.png)

Search:

![register page](/screenshots/search.png)

Stores:

![register page](/screenshots/stores.png)

Employee Page:

![register page](/screenshots/employee.png)

New Product Page:

![register page](/screenshots/newproduct.png)