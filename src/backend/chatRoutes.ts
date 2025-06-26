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

console.log("✅ chatRoutes loaded");


router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    
    const results = await serverClient.queryUsers({});

    res.json({ users: results.users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/chatStartReg', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;


  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    
    const [rows]: any = await pool.query(
  `SELECT id, email, nume, prenume FROM users_reg WHERE email = ? LIMIT 1`,
  [email]
);

if (rows.length === 0) {
  res.status(404).json({ error: "Patient not found" });
  return;
}

const user = rows[0];

const streamUser = {
  id: user.id,
  name: `${user.nume} ${user.prenume}`,   // ✅ proper display name
  email: user.email,                      // extra field (optional)
  // image: "https://…/avatar.jpg"        // add if you have one
};

const token = serverClient.createToken(user.id);
await serverClient.upsertUser(streamUser);

res.json({ token, user: streamUser });
    console.log('Stream user:', user);
    
  } catch (err) {
    console.error('Error generating Stream token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/chatStartDoc', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;


  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    
    const [rows]: any = await pool.query(
      'SELECT id, email,nume,prenume FROM users_doc WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
     res.status(404).json({ error: 'Patient not found' });
     return;
    }

    const user = rows[0];

    const streamUser = {
      id: user.id,
      email: user.email,
      name:`${user.nume} ${user.prenume}`,
    };

    const token = serverClient.createToken(user.id);
    await serverClient.upsertUser(streamUser);

    res.json({ token, user: streamUser });
    console.log('Stream user:', user);
    
  } catch (err) {
    console.error('Error generating Stream token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/delete-test-users', async (req: Request, res: Response) => {
  try {
    const usersToDelete = ["69429927", "51773893", "15368685", "doctor123"];

    const result = await serverClient.deleteUsers(usersToDelete, {
      hard_delete: true,
      mark_messages_deleted: true
    } as any); 

    console.log("Deleted users:", result);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({ error: 'Failed to delete users' });
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

router.get('/check-appointment-status', async (req: Request, res: Response): Promise<void> => {
  const { appId } = req.query;

  if (!appId || typeof appId !== 'string') {
    res.status(400).send('Missing or invalid appId');
    return;
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT status FROM doc_appointments WHERE app_id = ? LIMIT 1',
      [appId]
    );

    
    if (rows.length === 0) {
      res.status(404).send('Appointment not found');
      return;
    }

    res.json({ status: rows[0].status });
  } catch (error) {
    console.error('❌ Error checking appointment status:', error);
    res.status(500).send('Server error');
  }
});



router.get('/stream-token', async (req: Request, res: Response): Promise<void> => {
  const userId = req.session.user?.uid;
  if (!userId) {
    res.status(401).send('Not logged in');
    return; 
  }

  const token = serverClient.createToken(userId);

  res.json({ token });
});

router.post('/confirm-appointment-chat', async (req: Request, res: Response): Promise<void> => {
  const { messageId, userId, appId } = req.body;

  if (!messageId || !userId || !appId) {
    console.error('Missing messageId, userId, or appId');
    res.status(400).send('Missing parameters');
    return;
  }

  try {
    // 1. Fetch appointment status from DB
    const [rows]: any = await pool.query(
      'SELECT status FROM doc_appointments WHERE app_id = ? LIMIT 1',
      [appId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).send('Appointment not found');
      return;
    }

    const currentStatus = rows[0].status;

    if (currentStatus !== 'confirmed' && currentStatus !== 'completed') {
      console.log('Appointment is neither confirmed nor completed');
      res.status(403).send('Appointment not yet confirmed or completed');
      return;
    }

    // 2. Fetch Stream message
    const { message } = await serverClient.getMessage(messageId);

    if (!message) {
      console.error('Message not found!');
      res.status(404).send('Message not found');
      return;
    }

    // 3. Update customData
    const updatedCustomData = {
      ...(message.customData || {}),
      status: 'confirmed', // Still mark as confirmed in chat UI
    };

    // 4. Update message in Stream
    const updatedMessage = {
      id: messageId,
      user_id: userId,
      text: message.text ?? '',
      customType: message.customType ?? 'appointmentRequest',
      customData: updatedCustomData,
    };

    const response = await serverClient.updateMessage(updatedMessage);

    console.log('✅ Message updated in Stream:', response);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to confirm appointment in chat:', error);
    res.status(500).send('Server error');
  }
});







export default router;
