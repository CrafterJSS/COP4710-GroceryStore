// /app.js, the main application file
// Credit: Jonathan Svensson, Maggie Liott
//
// Additional credits:
// - Some code derived from Web Dev Simplified's tutorials on web development
// -- Fullstack development series https://www.youtube.com/playlist?list=PLZlA0Gpn_vH8jbFkBjOuFjhxANC63OmXM
// -- Web App Security/Authentication series https://www.youtube.com/playlist?list=PLZlA0Gpn_vH9yI1hwDVzWqu5sAfajcsBQ

// Imports
require("dotenv").config();
const fs = require("fs");
const express = require("express");
const { render } = require("ejs");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const port = process.env.PORT || 8080;
const { exec } = require("child_process");
const initializePassport = require("./auth/passport-config");

// Only use database authentication if set to true
const users = [
  {
    id: 1,
    name: "Manager",
    email: "manager@grocerystore.com",
    password: "$2b$10$2dhIGmTfMxZw0i8JQ6HJcufcW9wkIt8aIphkK7rn0d0A/718z5ZFO",
  },
];
if (process.env.USE_DB_AUTH == 1) {
  initializePassport(
    passport,
    async (email) => {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      return result.rows[0];
    },
    async (id) => {
      const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0];
    }
  );
} else {
  initializePassport(
    passport,
    (email) => {
      const user = users.find((user) => user.email === email);
      console.log(user);
      return user;
    },
    (id) => {
      return users.find((user) => user.id === id);
    }
  );
}

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

//
// Routes
//

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
    const id = await Date.now();
    if (process.env.USE_DB_AUTH == 1) {
      db.query(
        "INSERT INTO users(id, name, email, password) VALUES($1, $2, $3, $4)",
        [id, req.body.name, req.body.email, hashedPassword]
      );
    } else {
      users.push({
        id: id.toString(),
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });
    }
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

app.get("/search", checkAuthenticated, async (req, res) => {
  if (req.query.q) {
    const result = await db.query(
      "SELECT * FROM products WHERE name ILIKE $1 OR brand ILIKE $1",
      ["%" + req.query.q + "%"]
    );
    console.log("/search: results for '" + req.query.q + "':");
    console.log(result.rows);
    console.log();
    res.render("search", { data: result.rows, q: req.query.q });
  } else {
    console.log("/search: No query provided\n");
    res.render("search", { q: req.query.q });
  }
});

app.get("/stores", async (req, res) => {
  const result = await db.query("SELECT * FROM stores");
  console.log("/stores");
  console.log(result.rows);
  console.log();
  res.render("stores", { data: result.rows });
});

app.get("/password", checkAuthenticated, async (req, res) => {
  res.render("password");
});

app.post("/password", checkAuthenticated, async (req, res) => {
  //if (bcrypt.compare(req.body.oldPassword, req.user.password))
});

// Employees route
app.get("/employee", checkEmployeeAuthenticated, async (req, res) => {
  if (req.query.q) {
    const result = await db.query(
      "SELECT * FROM products WHERE name ILIKE $1 OR brand ILIKE $1",
      ["%" + req.query.q + "%"]
    );
    console.log("/employee/search: results for '" + req.query.q + "':");
    console.log(result.rows);
    console.log();
    res.render("employee", {
      name: req.user.name,
      data: result.rows,
      q: req.query.q,
    });
  } else {
    console.log("/employee/search: No query provided\n");
    res.render("employee", { name: req.user.name, q: req.query.q });
  }
});

app.get(
  "/employee/newproduct",
  checkEmployeeAuthenticated,
  async (req, res) => {
    res.render("employee/newproduct", { response: null });
  }
);

app.post(
  "/employee/newproduct",
  checkEmployeeAuthenticated,
  async (req, res) => {
    await db.query(
      "INSERT INTO products(upc, name, brand, price, qty) VALUES($1, $2, $3, $4, $5)",
      [
        req.body.upc,
        req.body.name,
        req.body.brand,
        req.body.price,
        req.body.qty,
      ]
    );
    res.redirect("/employee/newproduct");
  }
);

app.get(
  "/employee/updateproduct",
  checkEmployeeAuthenticated,
  async (req, res) => {
    res.render("employee/updateproduct");
  }
);

app.post(
  "/employee/updateproduct",
  checkEmployeeAuthenticated,
  async (req, res) => {
    await db.query("UPDATE products SET price = $2, qty = $3 WHERE upc = $1", [
      req.body.upc,
      req.body.price,
      req.body.qty,
    ]);
    res.redirect("/employee/updateproduct");
  }
);

// FIXME:
// // New Employee route
// app.get("employee/new", checkEmployeeAuthenticated, (req, res) => {
//   res.render("employee/new");
// });

// // Create new employee route
// app.post("/", (req, res) => {
//   res.send("Create");
// });

// FIXME: debugging
app.get("/users", async (req, res) => {
  if (process.env.USE_DB_AUTH == 1) {
    const results = await db.query("SELECT * FROM users");
    res.send(results.rows);
  } else {
    res.json(users);
  }
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

async function checkEmployeeAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    const results = await db.query(
      "SELECT EXISTS (SELECT id FROM employees WHERE id = $1) AS is_employee",
      [req.user.id]
    );
    if (results.rows[0].is_employee) {
      console.log("Employee authenticated successfully");
      return next();
    } else {
      console.log("Employee authentication failed: not employee");
      res.redirect("/");
    }
  } else {
    console.log("Employee authentication failed: not logged in");
    res.redirect("/login");
  }
}

//
// PostgreSQL
//

const db = require("./db");

// Some incredibly messy code which verifies the connection to the postgres database and initializes it
db.connect(async (err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  await client.query(
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
  if (process.env.INIT_DB == 1) {
    if (
      fs.existsSync("products.csv") &&
      fs.existsSync("manages.csv") &&
      fs.existsSync("stores.csv")
    ) {
      await console.log("DB: Initializing tables");
      await client.query("DROP TABLE IF EXISTS products");
      await client.query("DROP TABLE IF EXISTS users CASCADE");
      await client.query("DROP TABLE IF EXISTS employees");
      await client.query("DROP TABLE IF EXISTS stores");
      await client.query("DROP TABLE IF EXISTS manages");
      await console.log("DB: Dropped tables");
      await client.query(
        "CREATE TABLE products (upc char(12) PRIMARY KEY, name varchar(50), brand varchar(30), price numeric(7, 2), qty int, CONSTRAINT product_price_chk CHECK(price > 0), CONSTRAINT product_qty_chk CHECK(qty >= 0))"
      );
      await client.query(
        "CREATE TABLE users (id BIGINT PRIMARY KEY, name TEXT, email TEXT, password TEXT)"
      );
      await client.query(
        "CREATE TABLE stores (storeid BIGINT PRIMARY KEY, city TEXT, state char(2))"
      );
      await client.query(
        "CREATE TABLE manages (id BIGINT PRIMARY KEY, CONSTRAINT id_fk FOREIGN KEY(id) REFERENCES users(id));"
      );
      await client.query(
        "CREATE TABLE employees (id BIGINT PRIMARY KEY, CONSTRAINT id_fk FOREIGN KEY(id) REFERENCES users(id));"
      );
      await console.log("DB: Created tables");
      await exec(
        `psql -d postgres -c "\\copy Products FROM STDIN WITH DELIMITER ','CSV HEADER;" < products.csv`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
          }
        }
      );
      await exec(
        `psql -d postgres -c "\\copy Stores FROM STDIN WITH DELIMITER ','CSV HEADER;" < stores.csv`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
          }
          exec(
            `psql -d postgres -c "\\copy Users FROM STDIN WITH DELIMITER ','CSV HEADER;" < manages.csv`,
            (error, stdout, stderr) => {
              if (error) {
                console.error(`exec error: ${error}`);
              }
              client.query("INSERT INTO employees(id) SELECT id FROM users");
              client.query("INSERT INTO manages(id) SELECT id FROM users");
            }
          );
        }
      );
      await console.log("DB: initialized tables");
      await console.log("DB: Done!");
    } else {
      await console.error("DB: .csv files not found");
    }
  } else {
    await console.log("DB: skipping initialization");
  }
});

// Start listening to requests on the set port
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
