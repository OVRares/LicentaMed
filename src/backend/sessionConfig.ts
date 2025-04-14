import session from "express-session";
import dotenv from "dotenv";


dotenv.config();

const sessionConfig = session({
  secret: process.env
.SESSION_SECRET || "default", 
  resave: false, 
  saveUninitialized: false, 
  cookie: {
    secure: false, 
    httpOnly: true, 
    maxAge: 3600000, 
  },
});

export default sessionConfig;