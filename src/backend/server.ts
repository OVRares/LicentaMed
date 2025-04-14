import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db";
import bcrypt from "bcrypt";
import sessionConfig from "./sessionConfig";
import crypto from "crypto";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import chatRoutes from "./chatRoutes";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('chatRoutes typeof:', typeof chatRoutes);
console.log('chatRoutes.hasOwnProperty("use"):', chatRoutes && chatRoutes.hasOwnProperty('use'));

app.use(
  sessionConfig
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"))
);


const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
];

app.use(
  cors({
    origin: (origin, callback) => {
     
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); 
      } else {
        callback(new Error("Not allowed by CORS")); 
      }
    },
    credentials: true, 
  })
)

app.use(express.json());

app.use('/api/chat', chatRoutes);


app.post("/upload", upload.single("image"), async (req, res) => {
  const { officeId } = req.body;

  if (!req.file) {
 res.status(400).json({ error: "No file uploaded" });
 return;
  }

  const filename = req.file.filename;

  await pool.query(
    "UPDATE doc_office SET image_url = ? WHERE office_id = ?",
    [filename, officeId]
  );

  res.status(200).json({ message: "Upload successful", filename });
});

app.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { user_nume, user_prenume, user_varsta, user_id, user_email, user_parola } = req.body;

  if (!user_nume || !user_prenume || !user_varsta || !user_id || !user_email || !user_parola) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    
    const saltRounds = 10; 
    const user_hashed_password = await bcrypt.hash(user_parola, saltRounds);
    const confirmationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO users_reg (id, nume, prenume, varsta, email, parola, confirmare, conf_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user_id, user_nume,  user_prenume, user_varsta, user_email,user_hashed_password, 0, confirmationToken]
    );

    

    res.status(201).json({ message: "User signed up successfully!", confirmationToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sign up user" });
  }
});


app.post("/signupDoc", async (req: Request, res: Response): Promise<void> => {
  const { user_nume, user_prenume, user_id, user_spec, user_spec_id, user_email, user_parola, user_off_id } = req.body;

  if (!user_nume || !user_prenume || !user_id || !user_email || !user_parola || !user_spec || !user_spec_id || !user_off_id) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    
    const saltRounds = 10; 
    const user_hashed_password = await bcrypt.hash(user_parola, saltRounds);

    await pool.query(
      "INSERT INTO users_doc (id, nume, prenume, email, spec, spec_id, office_id, parola) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user_id, user_nume, user_prenume, user_email, user_spec, user_spec_id, user_off_id, user_hashed_password]
    );

    res.status(201).json({ message: "User signed up successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to sign up user" });
  }
});


app.get("/confirmEmail", async (req: Request, res: Response) :Promise<void> => {
  const token  = req.query.token as string;

  if (!token) {
    res.status(400).send("Invalid confirmation link.");
    return 
  }

  try {
  
    const [rows]: any = await pool.query("SELECT * FROM users_reg WHERE conf_token = ?", [token]);

    if (rows.length === 0) {
       res.status(400).send("Invalid or expired confirmation link.");
       return;
    }

    await pool.query("UPDATE users_reg SET confirmare = 1, conf_token = NULL WHERE conf_token = ?", [token]);

    res.redirect("http://localhost:5173/confirmation?status=success");
  } catch (error) {
    console.error(" Email confirmation error:", error);
    res.redirect("http://localhost:5173/confirmation?status=error");
  }
});


app.post("/checkEmail", async (req: Request, res: Response): Promise<void> => {
  const { user_email } = req.body;

  if (!user_email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const [rows]: any = await pool.query("SELECT email FROM users_doc WHERE email = ?", [user_email]);
    res.status(200).json({ exists: rows.length > 0 });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/signupDoctorWithOffice", async (req, res) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const {
      office_id,
      office_nume,
      office_judet,
      office_oras,
      office_adr,
      office_tel,
      office_spec,
      user_id,
      user_nume,
      user_prenume,
      user_email,
      user_spec,
      user_spec_id,
      user_parola,
    } = req.body;


    const saltRounds = 10; 
    const user_hashed_password = await bcrypt.hash(user_parola, saltRounds);

    await conn.query(
      "INSERT INTO users_doc (id, nume, prenume, email, spec, spec_id, office_id, parola) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [user_id, user_nume, user_prenume, user_email, user_spec, user_spec_id, office_id, user_hashed_password]
    );

    await conn.query(
      "INSERT INTO doc_office (office_id, nume, judet, oras, adresa, tel, spec) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [office_id, office_nume, office_judet, office_oras, office_adr, office_tel, office_spec]
    );


   
    await conn.commit();
    res.status(201).json({ message: "Doctor and office registered successfully!" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  } finally {
    conn.release();
  }
});

app.get("/fetchOffices", async (req: Request, res: Response): Promise<void> => {
  const { q, judet, spec } = req.query;

  let sql = "SELECT o.office_id, o.nume AS office_nume, o.oras, o.judet , o.adresa, o.tel, o.spec, d.nume AS doctor_nume, d.prenume AS doctor_prenume FROM doc_office o LEFT JOIN users_doc d ON o.office_id = d.office_id WHERE 1=1";
  const params: any[] = [];

  if (q) {
    sql += " AND LOWER(o.nume) LIKE ?";
    params.push(`%${(q as string).toLowerCase()}%`);
  }

  if (judet) {
    sql += " AND o.judet = ?";
    params.push(judet);
  }

  if (spec) {
    sql += " AND FIND_IN_SET(?, o.spec)"; // If specialty is stored as comma-separated
    params.push(spec);
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch offices" });
  }
});



app.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { user_email, user_parola } = req.body;

  console.log("Incoming Request Body:", req.body);

  if (!user_email || !user_parola) {
    res.status(400).json({ error: "user_email and user_parola are required" });
    return;
  }

  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users_reg WHERE email = ?",
      [user_email]
    );


    console.log("Query Result:", rows);

    if (rows.length === 0) {
      res.status(404).json({ error: "Invalid email or password" });
      return;
    }
    const user = rows[0];
    const hashedPassword = user.parola;

    console.log("User Retrieved:", user);

    const isMatch = await bcrypt.compare(user_parola, hashedPassword);

    if (isMatch) {
      req.session.user = {uid:user.id, email:user.email, role:'reg'};

      console.log("Session User:", req.session.user);
      console.log("Session Login ID", req.session.id);
      console.log("Session User Role", req.session.user.role);

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({exists:false, error: "Internal server error" });
        }
        res.status(200).json({ exists:true, message: "Login successful", user: req.session.user });
      });

      
    } else {
      res.status(401).json({ exists: false, error: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/loginDoc", async (req: Request, res: Response): Promise<void> => {
  const { user_email, user_parola } = req.body;

  console.log("Incoming Request Body:", req.body);

  if (!user_email || !user_parola) {
    res.status(400).json({ error: "user_email and user_parola are required" });
    return;
  }

  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users_doc WHERE email = ?",
      [user_email]
    );


    console.log("Query Result:", rows); // Log query results

    if (rows.length === 0) {
      res.status(404).json({ error: "Invalid email or password" });
      return;
    }
    const user = rows[0];
    const hashedPassword = user.parola;

    console.log("User Retrieved:", user);

    const isMatch = await bcrypt.compare(user_parola, hashedPassword);

    if (isMatch) {
      req.session.user = {uid:user.id, email:user.email, role:'doc'};

      console.log("Session User:", req.session.user);
      console.log("Session Login ID", req.session.id);
      console.log("Session User Role", req.session.user.role);

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({exists:false, error: "Internal server error" });
        }
        res.status(200).json({ exists:true, message: "Login successful", user: req.session.user });
      });

      
    } else {
      res.status(401).json({ exists: false, error: "Invalid email or password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.get("/session", (req: Request, res: Response):void => {
  console.log("Session Main ID: ", req.session.id);
  console.log("Session user in /main: ",req.session.user)
  if (!req.session.user) {
   
    res.status(401).json({exists:false, error: "Unauthorized access. Please log in." });
    return;
  }

  res.status(200).json({ exists:true,
    message: "Session data retrieved successfully",
    user: req.session.user,
  });
});


app.post("/logout", (req: Request, res: Response): void => {
  if (!req.session.user) {
    res.status(400).json({ error: "User is not logged in." });
    return;
  }

  console.log("Logging out user:", req.session.user);

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to log out." });
    }

    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful." });
  });
});







app.listen(PORT, () => {
  console.log(`Server-ul ruleaza pe http://localhost:${PORT}`);
});