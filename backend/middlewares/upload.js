// backend/middlewares/upload.js
import multer from "multer"; // Corrected to import

const storage = multer.memoryStorage(); // Store files in memory for Cloudinary upload
const upload = multer({ storage: storage });

export default upload; // Ensure this is a default export
