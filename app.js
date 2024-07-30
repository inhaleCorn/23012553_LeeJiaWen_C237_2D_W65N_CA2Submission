const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'c237_temporiumapp',
    host: 'db4free.net',
    user: 'inhalecorn',
    password: 'Derpypandas4721:>',
    database: 'temporium'

});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enable static files
app.use(express.static(path.join(__dirname, 'public')));

// Enable form processing
app.use(express.urlencoded({ extended: false }));

// Define routes
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM posts';
    // Fetch data from MySQL
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving posts');
        }
        // Render HTML page with data
        res.render('index', { posts: results });
    });
});

app.get('/post/:id', (req, res) => {
    const postId = req.params.id;
    const sql = 'SELECT * FROM posts WHERE postId = ?';
    // Fetch data from MySQL based on the post ID
    connection.query(sql, [postId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving post by ID');
        }
        // Check if any post with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the post data
            res.render('post', { post: results[0] });
        } else {
            // If no post with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Post not found');
        }
    });
});

app.get('/post/:username', (req, res) => {
    const username = req.params.username;
    const sql = 'SELECT * FROM posts WHERE username = ?';
    // Fetch data from MySQL based on the username
    connection.query(sql, [username], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving user posts');
        }
        // Render HTML page with user's posts data
        res.render('post', { username: username, post: results });
    });
});

app.get('/login', (req, res) => {
    res.render('login', { message: req.query.message || '' }); // Pass message from query parameter
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM posts WHERE username = ?';
    connection.query(sql, [username], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            res.redirect('/login?message=Database error. Please try again later.');
        } else {
            if (results.length > 0) {
                const user = results[0];
                if (user.password === password) {
                    // Successful login
                    res.redirect('/'); // Replace '/' with your actual landing page route
                } else {
                    // Incorrect password
                    res.redirect('/login?message=Invalid username or password.');
                }
            } else {
                // Username not found in database
                res.redirect('/login?message=Invalid username or password.');
            }
        }
    });
});

// Route for rendering the add post form
app.get('/addPost', (req, res) => {
    res.render('addPost');
});

// Route for handling add post form submission
app.post('/addPost', upload.single('image'), (req, res) => {
    const { username, caption } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // Save only the filename
    } else {
        image = null;
    }

    const sql = 'INSERT INTO posts (username, image, caption) VALUES (?, ?, ?)';
    connection.query(sql, [username, image, caption], (error, results) => {
        if (error) {
            console.error("Error adding post:", error);
            res.status(500).send('Error adding post');
        } else {
            res.redirect('/');
        }
    });
});

// Route for rendering the edit post form
app.get('/editPost/:id', (req, res) => {
    const postId = req.params.id;
    const sql = 'SELECT * FROM posts WHERE postId = ?';
    connection.query(sql, [postId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving post by ID');
        }
        if (results.length > 0) {
            res.render('editPost', { post: results[0] });
        } else {
            res.status(404).send('Post not found');
        }
    });
});

// Route for handling edit post form submission
app.post('/editPost/:id', upload.single('image'), (req, res) => {
    const postId = req.params.id;
    const { username, caption } = req.body;
    let image = req.body.currentImage;

    if (req.file) {
        image = req.file.filename;
    }

    const sql = 'UPDATE posts SET username = ?, image = ?, caption = ? WHERE postId = ?';
    connection.query(sql, [username, image, caption, postId], (error, results) => {
        if (error) {
            console.error("Error updating post:", error);
            res.status(500).send('Error updating post');
        } else {
            res.redirect('/');
        }
    });
});

// Route for deleting a post
app.get('/deletePost/:id', (req, res) => {
    const postId = req.params.id;
    const sql = 'DELETE FROM posts WHERE postId = ?';
    connection.query(sql, [postId], (error, results) => {
        if (error) {
            console.error("Error deleting post:", error);
            res.status(500).send('Error deleting post');
        } else {
            res.redirect('/');
        }
    });
});

// Route for the Contact Us page
app.get('/contact', (req, res) => {
    res.render('contact');
});

// Handle form submission from Contact Us page
app.post('/submit-contact', (req, res) => {
    const { name, email, message } = req.body;
    console.log('Received contact form submission:');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Message:', message);

    const sql = 'INSERT INTO feedbacks (name, email, message) VALUES (?, ?, ?)';
    connection.query(sql, [name, email, message], (error, results) => {
        if (error) {
            console.error("Error adding feedback:", error);
            res.status(500).send('Error submitting feedback');
        } else {
            console.log('Feedback submitted successfully');
            res.redirect('/contact');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
