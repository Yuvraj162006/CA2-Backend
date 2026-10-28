
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();

app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/libraryDB")
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB error:", err.message));

// Book schema
const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    available: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Book = mongoose.model("Book", bookSchema);


// 1. new book add krenge
app.post("/api/books", async (req, res) => {
    try {
        const { title, author, category } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        if (!author || !author.trim() ||
            !category || !category.trim()) {
            return res.status(400).json({
                message: "Author and category are required"
            });
        }

        const book = new Book({
            title,
            author,
            category
        });

        await book.save();

        res.status(201).json({
            message: "Book added successfully",
            book
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


// 2. Get books with pagination
app.get("/api/books", async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 5);

        const skip = (page - 1) * limit;

        const books = await Book.find()
            .skip(skip)
            .limit(limit);

        const total = await Book.countDocuments();

        res.status(200).json({
            currentPage: page,
            totalBooks: total,
            totalPages: Math.ceil(total / limit),
            books
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
});


// 3. Update book availability
app.patch("/api/books/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { available } = req.body;

        if (typeof available !== "boolean") {
            return res.status(400).json({
                message: "Available must be true or false"
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const book = await Book.findByIdAndUpdate(
            id,
            { available },
            { new: true, runValidators: true }
        );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book availability updated",
            book
        });

    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});