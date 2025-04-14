import express, { Request, Response } from 'express';
import { StreamChat } from 'stream-chat';
import dotenv from 'dotenv';
import pool from "./db";


dotenv.config({path: "./src/backend/.env"});
const router = express.Router();

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
);

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    
    const users = await serverClient.queryUsers({});

    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/token-from-db', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;


  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    
    const [rows]: any = await pool.query(
      'SELECT id FROM users_reg WHERE email = ? LIMIT 1',
      [email]
    );

    // If user is not found
    if (rows.length === 0) {
     res.status(404).json({ error: 'Patient not found' });
     return;
    }

    const user = rows[0];

    const streamUser = {
      id: user.id,
      email: user.email,
    };

    const token = serverClient.createToken(user.id);
    await serverClient.upsertUser(streamUser);

    res.json({ token, user: streamUser });
    
  } catch (err) {
    console.error('Error generating Stream token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/channels', async (req, res) => {
  const id  = req.query.id as string;

  const channels = await serverClient.queryChannels({
    type: 'messaging',
    filter_conditions: {
      members: { $in: [id] },
    }
  });

  res.json({ channels });
});


export default router;
