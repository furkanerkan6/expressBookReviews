const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const book = books[req.params.isbn];
  if (book) {
    return res.status(200).json(book);
  }
  return res.status(404).json({ message: `Book with ISBN ${req.params.isbn} not found` });
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, title: books[isbn].title, reviews: books[isbn].reviews }));

  if (result.length > 0) {
    return res.status(200).json({ booksbyauthor: result });
  }
  return res.status(404).json({ message: `No books found by author ${req.params.author}` });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, author: books[isbn].author, reviews: books[isbn].reviews }));

  if (result.length > 0) {
    return res.status(200).json({ booksbytitle: result });
  }
  return res.status(404).json({ message: `No books found with title ${req.params.title}` });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const book = books[req.params.isbn];
  if (book) {
    return res.status(200).json(book.reviews);
  }
  return res.status(404).json({ message: `Book with ISBN ${req.params.isbn} not found` });
});

/* ------------------------------------------------------------------
 * Tasks 10-13: the same lookups done asynchronously with Axios,
 * using Promise callbacks and async/await so multiple clients
 * are served without blocking each other.
 * ------------------------------------------------------------------ */

// Task 10: get all books — async/await
const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch books: ${error.message}`);
  }
};

// Task 11: search by ISBN — Promise callbacks
const getBookByISBN = (isbn) => {
  return axios
    .get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Failed to fetch book ${isbn}: ${error.message}`);
    });
};

// Task 12: search by author — async/await
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch books by ${author}: ${error.message}`);
  }
};

// Task 13: search by title — async/await
const getBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch books titled ${title}: ${error.message}`);
  }
};

// Routes that expose the async versions
public_users.get('/async/books', async (req, res) => {
  try {
    res.status(200).json(await getAllBooks());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

public_users.get('/async/isbn/:isbn', (req, res) => {
  getBookByISBN(req.params.isbn)
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ message: error.message }));
});

public_users.get('/async/author/:author', async (req, res) => {
  try {
    res.status(200).json(await getBooksByAuthor(req.params.author));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

public_users.get('/async/title/:title', async (req, res) => {
  try {
    res.status(200).json(await getBooksByTitle(req.params.title));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
