const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const uri = "mongodb+srv://kalpit677:puranpur@jrp.mpoq8pc.mongodb.net/?retryWrites=true&w=majority&appName=JRP";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

mongoose.connect(uri, clientOptions)
    .then(() => console.log("Database Connected"))
    .catch((err) => {
        console.error("Error connecting to database:", err.message);
        process.exit(1); // Exit the process if unable to connect
    });

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

    if (token) {
        try {
            const decoded = jwt.verify(token, "santiobskabkjdn");
            req.user = await User.findById(decoded._id);
            next();
        } catch (err) {
            res.render("login");
        }
    } else {
        res.render("login");
    }
};

app.get("/", isAuthenticated, (req, res) => {
    console.log(req.user);
    res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    if (!user) return res.redirect("/register");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render("login", { message: "Incorrect Password" });

    const token = jwt.sign({ _id: user._id }, "santiobskabkjdn");
    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });

    res.redirect("/");
});

app.get("/register", async (req, res, next) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = jwt.sign({ _id: user._id }, "santiobskabkjdn");
    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });

    res.redirect("/");
});

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    });

    res.redirect("/");
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});
