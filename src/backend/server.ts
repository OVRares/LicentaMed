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
import fs from "fs";

import { RowDataPacket } from "mysql2/promise";

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

function generateAppId() {
  const digits = Math.floor(100000000 + Math.random() * 900000000);
  return `APP${digits}`;
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const IV_LENGTH = 16; 

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}


app.post("/uploadProfilePicture", upload.single("image"), async (req, res) => {
  const { doctorId } = req.body;

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return 
  }

  const filename = req.file.filename;

  try {
    await pool.query(
      "UPDATE doc_about SET profile_picture = ? WHERE id = ?",
      [filename, doctorId]
    );

    res.status(200).json({ message: "Profile picture updated", filename });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    res.status(500).json({ error: "Failed to update profile picture" });
  }
});


app.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { user_nume, user_prenume, user_id, user_email, user_parola } = req.body;

  if (!user_nume || !user_prenume || !user_id || !user_email || !user_parola) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    
    const saltRounds = 10; 
    const user_hashed_password = await bcrypt.hash(user_parola, saltRounds);
    const confirmationToken = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO users_reg (id, nume, prenume, email, parola, confirmare, conf_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [user_id, user_nume,  user_prenume, user_email,user_hashed_password, 0, confirmationToken]
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
      office_nume = null,
      office_judet = null,
      office_oras = null,
      office_adr = null,
      user_id,
      user_nume,
      user_prenume,
      user_email,
      user_spec,
      user_spec_id,
      user_parola,
    } = req.body;

    interface OfficeRow extends RowDataPacket {
      nume: string;
      judet: string;
      oras: string;
      adresa: string;
    }

    // Case 1: office_nume is null → user is joining an existing office by code
    if (!office_nume) {
      const [rows] = await conn.query<OfficeRow[]>(
        "SELECT office_id FROM doc_office WHERE office_id = ?",
        [office_id]
      );

      if (rows.length === 0) {
        throw new Error("Codul de cabinet nu există.");
      }

      // Proceed to user creation only
    } else {
      // Case 2: user is creating a new office or duplicating an existing one
      const [rows] = await conn.query<OfficeRow[]>(
        "SELECT nume, judet, oras, adresa FROM doc_office WHERE office_id = ?",
        [office_id]
      );

      if (rows.length > 0) {
        const existing = rows[0];
        const mismatch =
          office_nume.trim() !== existing.nume ||
          office_judet?.trim() !== existing.judet ||
          office_oras?.trim() !== existing.oras ||
          office_adr?.trim() !== existing.adresa;

        if (mismatch) {
          throw new Error("Codul de cabinet există deja cu alte detalii.");
        }

        // details match, allow new user to join
      } else {
        // create new office
        await conn.query(
          "INSERT INTO doc_office (office_id, nume, judet, oras, adresa) VALUES (?, ?, ?, ?, ?)",
          [office_id, office_nume, office_judet, office_oras, office_adr]
        );
      }
    }

    // Hash the password
    const saltRounds = 10;
    const user_hashed_password = await bcrypt.hash(user_parola, saltRounds);

    // Insert user
    await conn.query(
      "INSERT INTO users_doc (id, nume, prenume, email, spec, spec_id, office_id, parola) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        user_nume,
        user_prenume,
        user_email,
        user_spec,
        user_spec_id,
        office_id,
        user_hashed_password,
      ]
    );

    // Insert empty profile row
    await conn.query("INSERT INTO doc_about (id) VALUES (?)", [user_id]);

    await conn.commit();
    res.status(201).json({ message: "Doctor registered successfully!" });
  } catch (err) {
    await conn.rollback();

    const msg =
      err instanceof Error && err.message
        ? err.message
        : "Eroare la înregistrare.";
    console.error("Signup error:", msg);
    res.status(500).json({ error: msg });
  } finally {
    conn.release();
  }
});

app.get("/appointmentsTodayCount", async (req, res) => {
  const { doc_id } = req.query;

  try {
    const [rows]:any = await pool.query(
       `SELECT COUNT(*) AS count FROM doc_appointments WHERE doc_id = ? AND DATE(date) = CURDATE()`,
      [doc_id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch count" });
  }
});


app.get("/fetchOffices", async (req: Request, res: Response): Promise<void> => {
  const { q, judet, spec } = req.query;
  let sql = `
    SELECT
      o.office_id,
      o.nume              AS office_nume,
      o.oras,
      o.judet,
      o.adresa,

      d.id                AS doctor_id,
      d.nume              AS doctor_nume,
      d.prenume           AS doctor_prenume,
      d.spec              AS doctor_spec,

      a.bio               AS doctor_bio,
      a.profile_picture   AS profile_picture
    FROM doc_office o
    INNER JOIN users_doc  d ON o.office_id = d.office_id
    LEFT JOIN doc_about  a ON a.id        = d.id            
    WHERE 1 = 1
  `;
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
    sql += " AND d.spec = ?";
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
      req.session.user = {uid:user.id, email:user.email, role:'reg', name:user.prenume};

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
      req.session.user = {uid:user.id, email:user.email, role:user.spec, name:`${user.nume} ${user.prenume}`
};

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
  console.log("Session username in /main: ",req.session.user?.name)
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

app.post('/appointments', async (req: Request, res: Response): Promise<void> => {
  const { date, t_start, t_stop, patientId, name, notes  } = req.body;
  const doctorId = req.session.user?.uid;
  const doctorRole = req.session.user?.role;
  const appId = generateAppId();
  const appNotes = encrypt(notes);
  const appName = encrypt(name);

  if (!doctorId)
     res.status(401).send('Not logged in');

  try {
    await pool.query(
      'INSERT INTO doc_appointments (app_id, category, doc_id, reg_id, date, t_start, t_stop, enc_title, enc_notes) VALUES (?, ? , ?, ?, ?, ?, ?,? ,?)',
      [appId, doctorRole, doctorId, patientId, date, t_start, t_stop,appName, appNotes]
    );
   
    res.json({succes:true, appId});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting appointment');
  }
});

app.get('/fetchAppointments', async (req: Request, res: Response): Promise<void> => {
  const doctorId = req.session.user?.uid;
  

  if (!doctorId) 
    {res.status(401).send('Not logged in');
  return;
    }

  try {
    const [appointments]: any = await pool.query(
      `SELECT 
      app_id,
      status,
      category,
  DATE_FORMAT(date, '%Y-%m-%d') AS date,
  TIME_FORMAT(t_start, '%H:%i') AS startTime,
  TIME_FORMAT(t_stop, '%H:%i') AS endTime,
  enc_title,
  enc_notes
FROM doc_appointments
WHERE doc_id = ?`,
      [doctorId]
    );

    const decryptedAppointments = appointments.map((appointment: any) => ({
      app_id: appointment.app_id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      name: appointment.enc_title ? decrypt(appointment.enc_title) : "(No title available)",
      description: appointment.enc_notes ? decrypt(appointment.enc_notes) : "(No notes available)",
      status: appointment.status,
      category: appointment.category,
    }));

    res.json(decryptedAppointments);
    return; // array of appointments
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching appointments');
    return;
  }
});


app.get('/fetchAppointmentsReg', async (req: Request, res: Response): Promise<void> => {
  const regId = req.session.user?.uid;

  if (!regId) 
    {res.status(401).send('Not logged in');
  return;
    }

  try {
    const [appointments]: any = await pool.query(
      `SELECT 
  da.app_id,
  da.status,
  da.category,
  DATE_FORMAT(da.date, '%Y-%m-%d') AS date,
  TIME_FORMAT(da.t_start, '%H:%i') AS startTime,
  TIME_FORMAT(da.t_stop, '%H:%i') AS endTime,
  da.enc_notes,
  CONCAT(ud.nume, ' ', ud.prenume) AS doc_name
FROM doc_appointments da
JOIN users_doc ud ON da.doc_id = ud.id
WHERE da.reg_id = ?
`,
      [regId]
    );

    const decryptedAppointments = appointments.map((appointment: any) => ({
      app_id: appointment.app_id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      description: appointment.enc_notes ? decrypt(appointment.enc_notes) : "(No notes available)",
      status: appointment.status,
      category: appointment.category,
      docName: appointment.doc_name
    }));

    res.json(decryptedAppointments);
    return; // array of appointments
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching appointments');
    return;
  }
});

app.post('/confirmAppointment', async (req:Request, res:Response):Promise<void> => {
  const { appId } = req.body;
  if (!appId)
     res.status(400).send('Missing appId');

  try {
    await pool.query('UPDATE doc_appointments SET status = ? WHERE app_id = ?', ['confirmed', appId]);
    res.send({ success: true });
  } catch (error) {
    console.error('DB update error:', error);
    res.status(500).send('DB error');
  }
});

app.post('/updateAppointment', async (req: Request, res: Response): Promise<void> => {
  const { appId, notes } = req.body;

  if (!appId || !notes) {
    res.status(400).send('Missing appId or notes');
    return;
  }

  try {
    const encryptedNotes = encrypt(notes);

    await pool.query(
      'UPDATE doc_appointments SET enc_notes = ? WHERE app_id = ?',
      [encryptedNotes, appId]
    );

    res.send({ success: true });
  } catch (error) {
    console.error('DB update error:', error);
    res.status(500).send('DB error');
  }
});



app.get('/fetchPatientAppointments', async (req: Request, res: Response): Promise<void> => {
  const patientId = req.session.user?.uid; // Assuming patients also login and session stores their ID

  if (!patientId) {
    res.status(401).send('Unauthorized');
    return;
  }

  try {
    const [appointments]: any = await pool.query(`
      SELECT 
        app_id,
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        TIME_FORMAT(t_start, '%H:%i') AS startTime,
        TIME_FORMAT(t_stop, '%H:%i') AS endTime,
        enc_notes,
        status
      FROM doc_appointments
      WHERE reg_id = ?
        AND status = 'completed'
      ORDER BY date DESC
    `, [patientId]);

    // Decrypt notes for each appointment
    const decryptedAppointments = appointments.map((appointment: any) => ({
      app_id: appointment.app_id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      description: appointment.enc_notes ? decrypt(appointment.enc_notes) : "(No notes available)",
      status: appointment.status,
    }));

    res.json(decryptedAppointments);
    return ;
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).send('Error fetching appointments');
    return;
  }
});

app.post('/updateAppointmentDescription', async (req: Request, res: Response) => {
  const { appId, description } = req.body;

  if (!req.session.user) {
    res.status(401).send("Unauthorized");
    return;
  }

  if (!appId || typeof description !== "string") {
    res.status(400).send("Missing appId or description");
    return;
  }

  try {
    const encrypted = encrypt(description);

    await pool.query(
      "UPDATE doc_appointments SET enc_notes = ? WHERE app_id = ?",
      [encrypted, appId]
    );

    res.status(200).send("Description updated");
  } catch (err) {
    console.error("❌ Error updating appointment description:", err);
    res.status(500).send("Failed to update description");
  }
});



app.post('/complete-appointment', async (req: Request, res: Response): Promise<void> => {
  const { appointmentId, description } = req.body;
  const doctorId = req.session.user?.uid;

  if (!doctorId) {
    res.status(401).send('Unauthorized');
    return;
  }
  if (!appointmentId || !description) { 
    res.status(400).send('Missing data');
    return;
  }

  try {
    const encryptedDescription = encrypt(description);

    await pool.query(`
      UPDATE doc_appointments
      SET status = 'completed',
          enc_notes = ?
      WHERE app_id = ? AND doc_id = ?
    `, [encryptedDescription, appointmentId, doctorId]);

     res.send({ success: true });
     return; // ✅ add return here too
  } catch (error) {
    console.error('Error completing appointment:', error);
     res.status(500).send('Error completing appointment'); // ✅ fix: add return here
     return;
  }
});


app.get("/patientName", async (req: Request, res: Response): Promise<void> => {
  const { patientId } = req.query;

  if (!patientId) {
    res.status(400).json({ error: "Missing patientId" });
    return;
  }

  try {
    // simple cast to any[] avoids TS length/type issues
    const [rows]: any = await pool.query(
      "SELECT nume, prenume FROM users_reg WHERE id = ?",
      [patientId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Patient not found" });
      return;
    }

    const { nume, prenume } = rows[0];
    const fullName = `${prenume} ${nume}`.trim();

    res.json({ fullName });
  } catch (err) {
    console.error("Error fetching patient name:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



app.post('/deleteAppointment', async (req: Request, res: Response): Promise<void> => {
  const { appId } = req.body;

  if (!appId) {
    res.status(400).send('Missing appId');
    return;
  }

  try {
    await pool.query('DELETE FROM doc_appointments WHERE app_id = ?', [appId]);
    res.send({ success: true });
  } catch (error) {
    console.error('DB delete error:', error);
    res.status(500).send('Failed to delete appointment');
  }
});

app.post('/cancelAppointment', async (req: Request, res: Response): Promise<void> => {
  const { appId } = req.body;

  if (!appId) {
    res.status(400).send('Missing appId');
    return;
  }

  try {
    await pool.query(
      'UPDATE doc_appointments SET status = ? WHERE app_id = ?',
      ['canceled', appId]
    );

    res.send({ success: true });
  } catch (error) {
    console.error('DB update error:', error);
    res.status(500).send('Failed to cancel appointment');
  }
});



app.post('/about/updateProfile', async (req: Request, res: Response): Promise<void> => {
  const { uid, bio, about_text, about_text_office } = req.body;

  if (!uid) {
    res.status(400).send('Missing uid');
    return;
  }

  try {
    await pool.query(
      'UPDATE doc_about SET bio = ?, about_text = ?, about_text_office=? WHERE id = ?',
      [bio, about_text, about_text_office, uid]
    );

    res.send({ success: true });
  } catch (error) {
    console.error('DB update error:', error);
    res.status(500).send('DB error');
  }
});


app.get("/about/doctorOffice/:uid", async (req: Request, res: Response): Promise<void> => {
  const { uid } = req.params;

  if (!uid) {
    res.status(400).send("Missing doctor ID");
    return;
  }

  const sql = `
    SELECT 
      o.office_id,
      o.nume AS office_nume,
      o.oras,
      o.judet,
      o.adresa,
      d.id AS doctor_id,
      d.nume AS doctor_nume,
      d.prenume AS doctor_prenume,
      a.bio,
      a.about_text,
      a.about_text_office,
      a.profile_picture
    FROM users_doc d
    LEFT JOIN doc_office o ON d.office_id = o.office_id
    LEFT JOIN doc_about a ON d.id = a.id
    WHERE d.id = ?
    LIMIT 1
  `;

  try {
    const [rows]: any = await pool.query(sql, [uid]);
    if (rows.length === 0) {
      res.status(404).json({ error: "Doctor not found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Failed to fetch doctor's office and bio:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/about/uploadGalleryImages", upload.array("images", 12), async (req, res) => {
  const { doctorId } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || !doctorId) {
    res.status(400).json({ error: "Missing images or doctorId" });
    return 
  }

  try {
    const insertValues = files.map(file => [doctorId, file.filename]);
    await pool.query(
      "INSERT INTO doc_images (doctor_id, image_url) VALUES ?",
      [insertValues]
    );

    res.status(200).json({ message: "Images uploaded", filenames: files.map(f => f.filename) });
  } catch (error) {
    console.error("Gallery upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/about/galleryImages/:doctorId", async (req: Request, res: Response): Promise<void> => {
  const { doctorId } = req.params;

  if (!doctorId) {
    res.status(400).json({ error: "Missing doctor ID" });
    return;
  }

  try {
    const [rows] = await pool.query(
      "SELECT image_url FROM doc_images WHERE doctor_id = ?",
      [doctorId]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Failed to fetch gallery images:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/about/saveServices', async (req: Request, res: Response): Promise<void> => {
  const { uid, services } = req.body;

  if (!uid || !Array.isArray(services)) {
    res.status(400).json({ error: "Missing uid or services list" });
    return;
  }

  try {
    // Remove existing services for this doctor
    await pool.query("DELETE FROM doc_services WHERE doctor_id = ?", [uid]);

    // Prepare insert values
    const values = services
      .map((s: any, i: number) => {
        if (!s.name.trim() && !s.price.trim()) return null; // Skip empty rows
        return [uid, s.name.trim(), parseFloat(s.price || "0"), i + 1]; // slot_number is i+1
      })
      .filter(Boolean); // Remove nulls

    if (values.length > 0) {
      await pool.query(
        "INSERT INTO doc_services (doctor_id, service_name, service_price, slot_number) VALUES ?",
        [values]
      );
    }

    res.status(200).json({ message: "Services saved successfully" });
  } catch (err) {
    console.error("Error saving services:", err);
    res.status(500).json({ error: "Failed to save services" });
  }
});


app.get("/about/fetchServices/:uid", async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT service_name, service_price, slot_number FROM doc_services WHERE doctor_id = ? ORDER BY slot_number ASC",
      [uid]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Fetch services error:", err);
    res.status(500).json({ error: "Error fetching services" });
  }
});


app.post("/about/deleteGalleryImage", async (req: Request, res: Response):Promise<void> => {
  const { doctorId, imageUrl } = req.body;
  if (!doctorId || !imageUrl) {
    res.status(400).json({ error: "Missing data" });
    return ;
  }

  try {

    await pool.query(
      "DELETE FROM doc_images WHERE doctor_id = ? AND image_url = ?",
      [doctorId, imageUrl]
    );

    const filePath = path.join(__dirname, "uploads", imageUrl);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("File deletion error:", err);
      }
    });

    res.status(200).json({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/about/updateOfficeDetails", async (req: Request, res: Response):Promise<void> => {
  const { uid, nume, judet, oras, adresa } = req.body;

  if (!uid || !nume || !judet || !oras || !adresa) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  try {
    // Find the office_id from doctor's uid
    const [doctorResult]: any = await pool.query(
      "SELECT office_id FROM users_doc WHERE id = ?",
      [uid]
    );

    if (!doctorResult.length || !doctorResult[0].office_id) {
      res.status(404).json({ error: "Doctor or office not found" });
      return;
    }

    const officeId = doctorResult[0].office_id;

    // Update office data
    await pool.query(
      "UPDATE doc_office SET nume = ?, judet = ?, oras = ?, adresa = ? WHERE office_id = ?",
      [nume, judet, oras, adresa, officeId]
    );

    res.status(200).json({ message: "Office details updated" });
  } catch (err) {
    console.error("Office update failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(PORT, () => {
  console.log(`Server-ul ruleaza pe http://localhost:${PORT}`);
});