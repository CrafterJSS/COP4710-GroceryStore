// /app.js, the main application file
// Credit: Jonathan Svensson, Maggie Liott
//
// Additional credits:
// - Some code derived from Web Dev Simplified's tutorials on web development
// -- Fullstack development series https://www.youtube.com/playlist?list=PLZlA0Gpn_vH8jbFkBjOuFjhxANC63OmXM
// -- Web App Security/Authentication series https://www.youtube.com/playlist?list=PLZlA0Gpn_vH9yI1hwDVzWqu5sAfajcsBQ

// Environment variables and express initialization
require("dotenv").config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const port = process.env.PORT || 8080;

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

//FIXME: const indexRouter = require('./routes/index')

//FIXME: Update to use a database instead
const users = [];

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));
app.use(flash());
app.use(
  session({
    secret: "this is very secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//FIXME: app.use('/', indexRouter)

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index", { name: req.user.name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login");
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/logout", checkAuthenticated);

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

app.post("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

/* app.get("/search", (req, res) => {
    db.query(
        "SELECT team_abbreviation, wins, losses FROM teams",
        (err, result) => {
            console.log(result.rows);
            res.render("search", { data: result.rows });
        }
    );
}); */

app.get("/search", async (req, res) => {
  const result = await db.query("SELECT NOW()");
  console.log(result.rows);
  res.render("search", { data: result.rows });
});

//FIXME:
app.get("/users", (req, res) => {
  res.json(users);
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

// PostgreSQL
const db = require("./db");
const { render } = require("ejs");

// Verifies the connection to the postgres database and returns a SELECT NOW() query
db.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  client.query(
    "SELECT $1::text as connected",
    ["Connection to postgres successful!"],
    (err, result) => {
      if (err) {
        return console.error("Error executing query", err.stack);
      }
      console.log();
      console.log(result.rows[0].connected);
      client.query("SELECT NOW()", (err, res) => {
        if (err) {
          return console.error("Error executing query", err.stack);
        }
        console.log(res.rows[0]);
        console.log();
        release();
      });
    }
  );
});

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
  console.log(`App listening on port ${port}`);
});
