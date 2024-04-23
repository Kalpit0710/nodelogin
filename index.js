import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Connect to MongoDB using environment variable for connection URI
mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Database Connected"))
.catch((e) => console.error("Database connection error:", e));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;

    try {
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded._id);
            next();
        } else {
            res.render("login");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).send("Internal Server Error");
    }
};

app.get("/", isAuthenticated, (req, res) => {
    console.log(req.user);
    res.render("logout", { name: req.user.name });
});

// Other routes...

app.listen(process.env.PORT || 5000, () => {
    console.log("Server is running on port", process.env.PORT || 5000);
});
