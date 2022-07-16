// /app.js, the main application file
// Some code derived from Web Dev Simplified's tutorials on fullstack development https://www.youtube.com/watch?v=qj2oDkvc4dQ&list=PLZlA0Gpn_vH8jbFkBjOuFjhxANC63OmXM&index=6

// Environment variables and express initialization
require('dotenv').config()
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const app = express()
const port = process.env.PORT || 8080

const indexRouter = require('./routes/index')

app.set('view engine', 'ejs')
app.set('view', 'views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(express.static('public'))

app.use('/', indexRouter)

// PostgreSQL
const db = require('./db')

// Verifies the connection to the postgres database and returns a SELECT NOW() query
db.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack)
    }
    client.query('SELECT $1::text as connected', ['Connection to postgres successful!'], (err, result) => {
        if (err) {
            return console.error('Error executing query', err.stack)
        }
        console.log()
        console.log(result.rows[0].connected)
        client.query('SELECT NOW()', (err, res) => {
            if (err) {
                return console.error('Error executing query', err.stack)
            }
            console.log(res.rows[0])
            console.log()
            release()
        })
    })
})

/* const { Client } = require('pg');

(async () => {
  const client = new Client();
  await client.connect();
  const res = await client.query('SELECT $1::text as connected', ['Connection to postgres successful!']);
  console.log(res.rows[0].connected);
  await client.end();
})();

db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log(err.stack)
    } else {
        console.log(res.rows[0])
    }
});
 */

/*
app.get('/', (req, res) => {
  // res.send('Hello World!')
})
*/

// Start listening to requests on the set port
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
