// 2. Updated book.controller.js - Add better logging
const Book = require('./book.model');

const postABook = async (req, res) => {
  try {
    console.log('📝 Received request body:', req.body);
    console.log('📁 Received file:', req.file);
    
    const { title, description, category, trending, oldPrice, newPrice } = req.body;
    
    // Get the uploaded file path
    const coverImage = req.file ? req.file.filename : null;
    console.log('🖼️ Cover image filename:', coverImage);
    
    if (!coverImage) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    const newBook = new Book({
      title,
      description,
      category,
      trending: trending === 'true' || trending === true,
      coverImage, // This stores just the filename
      oldPrice: Number(oldPrice),
      newPrice: Number(newPrice)
    });

    const savedBook = await newBook.save();
    console.log('✅ Book saved successfully:', {
      id: savedBook._id,
      title: savedBook.title,
      coverImage: savedBook.coverImage
    });
    
    res.status(201).json({ 
      message: "Book created successfully", 
      book: savedBook 
    });
  } catch (error) {
    console.error("❌ Error creating book:", error);
    res.status(500).json({ message: "Failed to create book", error: error.message });
  }
};

const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    console.log(`📚 Retrieved ${books.length} books`);
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Error fetching books" });
  }
};

const getSingleBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    console.log('📖 Retrieved single book:', book.title);
    res.status(200).json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ message: "Error fetching book" });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // If a new image is uploaded, use it
    if (req.file) {
      updateData.coverImage = req.file.filename;
      console.log('🖼️ New image uploaded:', req.file.filename);
    }
    
    // Handle boolean conversion for trending
    if (updateData.trending !== undefined) {
      updateData.trending = updateData.trending === 'true' || updateData.trending === true;
    }
    
    // Convert prices to numbers
    if (updateData.oldPrice) updateData.oldPrice = Number(updateData.oldPrice);
    if (updateData.newPrice) updateData.newPrice = Number(updateData.newPrice);

    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    console.log('✅ Book updated successfully:', updatedBook.title);
    res.status(200).json({
      message: "Book updated successfully",
      book: updatedBook
    });
  } catch (error) { 
    console.error("Error updating book:", error);
    res.status(500).json({ message: "Error updating book" });
  }
};

const deleteABook = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);
    
    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    console.log('🗑️ Book deleted successfully:', deletedBook.title);
    res.status(200).json({
      message: "Book deleted successfully",
      book: deletedBook
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Error deleting book" });
  }
};

module.exports = {
  postABook,
  getAllBooks,
  getSingleBook,
  updateBook,
  deleteABook
};





// //book.controller.js

// const Book = require('./book.model');

// // Create a new book
// const postABook = async (req, res) => {
//     try {
//         const newBook = new Book({ ...req.body });
//         await newBook.save();
//         return res.status(200).send({ message: "Book posted successfully", book: newBook });
//     } catch (error) {
//         console.error("Error creating book", error);
//         return res.status(500).send({ message: "Failed to create book" });
//     }
// };

// // Get all books
// const getAllBooks = async (req, res) => {
//     try {
//         const books = await Book.find().sort({ createdAt: -1 });
//         return res.status(200).send(books);
//     } catch (error) {
//         console.error("Error fetching books", error);
//         return res.status(500).send({ message: "Failed to fetch books" });
//     }
// };

// // Get a single book
// const getSingleBook = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const book = await Book.findById(id);
//         if (!book) {
//             return res.status(404).send({ message: "Book not found" });
//         }
//         return res.status(200).send(book);
//     } catch (error) {
//         console.error("Error fetching book", error);
//         return res.status(500).send({ message: "Failed to fetch book" });
//     }
// };

// // Update book data
// const updateBook = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
//         if (!updatedBook) {
//             return res.status(404).send({ message: "Book not found" });
//         }
//         return res.status(200).send({
//             message: "Book updated successfully",
//             book: updatedBook
//         });
//     } catch (error) {
//         console.error("Error updating a book", error);
//         return res.status(500).send({ message: "Failed to update book" });
//     }
// };

// // Delete book data 
// const deleteABook = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const deletedBook = await Book.findByIdAndDelete(id);
//         if (!deletedBook) {
//             return res.status(404).send({ message: "Book not found" });
//         }
//         return res.status(200).send({
//             message: "Book deleted successfully",
//             book: deletedBook
//         });
//     } catch (error) {
//         console.error("Error deleting a book", error);
//         return res.status(500).send({ message: "Failed to delete book" });
//     }
// };

// module.exports = {
//     postABook,
//     getAllBooks,
//     getSingleBook,
//     updateBook,
//     deleteABook
// };






