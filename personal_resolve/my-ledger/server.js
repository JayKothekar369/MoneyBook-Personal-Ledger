import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database file path
const DATA_FILE = path.join(__dirname, 'moneybook_data.json');

// Helper to read data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return { users: [] };
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { users: [] };
  }
};

const pendingRegistrations = new Map();

// GET endpoint (Strip passwords)
app.get('/api/data', (req, res) => {
  const data = readData();
  const safeData = {
    users: data.users.map(({ password, ...rest }) => rest)
  };
  res.json(safeData);
});

// POST endpoint (Merge passwords)
app.post('/api/data', (req, res) => {
  try {
    const newData = req.body;
    const existingData = readData();
    
    if (newData.users) {
      newData.users = newData.users.map(u => {
        const existingUser = existingData.users.find(eu => eu.id === u.id);
        if (existingUser && existingUser.password && !u.password) {
          u.password = existingUser.password;
        }
        return u;
      });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf-8');
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data file:', error);
    res.status(500).json({ success: false, message: 'Failed to save data' });
  }
});

// Auth Endpoints
app.post('/api/auth/register-init', (req, res) => {
  const { name, password, mobile } = req.body;
  const trimmedName = (name || '').trim();
  if (!trimmedName || !password || !mobile) return res.status(400).json({ error: 'Name, password, and mobile required' });
  
  const data = readData();
  if (data.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  pendingRegistrations.set(trimmedName.toLowerCase(), { password, mobile, otp, originalName: trimmedName, timestamp: Date.now() });
  
  console.log('\n=============================================');
  console.log(`📱 Sending OTP to Mobile: ${mobile}`);
  console.log(`🔑 OTP for new registration (${trimmedName}): ${otp}`);
  console.log('=============================================\n');

  res.json({ success: true, message: 'OTP generated', simulatedOtp: otp });
});

app.post('/api/auth/register-verify', (req, res) => {
  const { name, otp } = req.body;
  const trimmedName = (name || '').trim();
  const pendingKey = trimmedName.toLowerCase();
  const pending = pendingRegistrations.get(pendingKey);
  
  if (!pending) return res.status(400).json({ error: 'No pending registration' });
  if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
    pendingRegistrations.delete(pendingKey);
    return res.status(400).json({ error: 'OTP expired' });
  }

  const data = readData();
  const newUser = {
    id: 'user_' + Date.now(),
    name: pending.originalName,
    password: pending.password, // Base64 encoded from client
    mobile: pending.mobile,
    accounts: [],
    transactions: []
  };
  
  data.users.push(newUser);
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    pendingRegistrations.delete(pendingKey);
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save user' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { name, password } = req.body;
  const trimmedName = (name || '').trim();
  const data = readData();
  const user = data.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
  
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.password !== password) return res.status(401).json({ error: 'Invalid password' });
  
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Forgot Password Flow
app.post('/api/auth/forgot-init', (req, res) => {
  const { name } = req.body;
  const trimmedName = (name || '').trim();
  if (!trimmedName) return res.status(400).json({ error: 'Name required' });
  
  const data = readData();
  const user = data.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase());
  if (!user) return res.status(400).json({ error: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const pendingKey = trimmedName.toLowerCase() + '-forgot';
  pendingRegistrations.set(pendingKey, { otp, timestamp: Date.now() });
  
  console.log('\n=============================================');
  console.log(`📱 Sending Password Reset OTP for (${trimmedName})`);
  console.log(`🔑 OTP: ${otp}`);
  console.log('=============================================\n');

  res.json({ success: true, message: 'OTP generated' });
});

app.post('/api/auth/forgot-verify', (req, res) => {
  const { name, otp, newPassword } = req.body;
  const trimmedName = (name || '').trim();
  const pendingKey = trimmedName.toLowerCase() + '-forgot';
  const pending = pendingRegistrations.get(pendingKey);
  
  if (!pending) return res.status(400).json({ error: 'No pending reset request' });
  if (pending.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
    pendingRegistrations.delete(pendingKey);
    return res.status(400).json({ error: 'OTP expired' });
  }

  const data = readData();
  const userIndex = data.users.findIndex(u => u.name.toLowerCase() === trimmedName.toLowerCase());
  if (userIndex === -1) return res.status(400).json({ error: 'User not found' });

  data.users[userIndex].password = newPassword;
  
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    pendingRegistrations.delete(pendingKey);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Profile Deletion Endpoint
app.post('/api/auth/delete-profile', (req, res) => {
  try {
    const { name, password } = req.body;
    const trimmedName = (name || '').trim();
    
    if (!trimmedName || !password) return res.status(400).json({ error: 'Name and password required' });

    const data = readData();
    const userIndex = data.users.findIndex(u => u.name.toLowerCase() === trimmedName.toLowerCase());
    
    if (userIndex === -1) return res.status(400).json({ error: 'User not found' });
    
    // Verify password before deletion
    if (data.users[userIndex].password !== password) {
      return res.status(401).json({ error: 'Invalid password. Cannot delete profile.' });
    }

    // Remove the user
    data.users.splice(userIndex, 1);

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.error("Profile deletion error:", error);
    res.status(500).json({ error: 'Failed to delete profile due to server error' });
  }
});

// Mock AI Chat Endpoint
app.post('/api/ai/chat', (req, res) => {
  try {
    const { query, userData } = req.body;
    
    const lowerQuery = (query || "").toLowerCase();
    let response = "I am an AI assistant. How can I help you manage your finances today?";

    const txs = (userData && userData.transactions) ? userData.transactions : [];

    if (lowerQuery.includes('spend') || lowerQuery.includes('expense')) {
      const totalSpent = txs.filter(t => t.type === 'expenditure').reduce((sum, t) => sum + Number(t.amount), 0);
      response = `Based on your records, your total expenses amount to ₹${totalSpent.toFixed(2)}.`;
    } else if (lowerQuery.includes('receive') || lowerQuery.includes('pay me')) {
      const toReceive = txs.filter(t => t.type === 'lent' && t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0);
      response = `You currently have ₹${toReceive.toFixed(2)} left to receive from others.`;
    } else if (lowerQuery.includes('invest')) {
      const totalInvested = txs.filter(t => t.type === 'investment').reduce((sum, t) => sum + Number(t.amount), 0);
      response = `You have invested a total of ₹${totalInvested.toFixed(2)} so far.`;
    } else if (lowerQuery.includes('balance') || lowerQuery.includes('summary')) {
      const totalSpent = txs.filter(t => t.type === 'expenditure').reduce((sum, t) => sum + Number(t.amount), 0);
      const totalIncome = txs.filter(t => t.type === 'salary').reduce((sum, t) => sum + Number(t.amount), 0);
      response = `Your total income is ₹${totalIncome.toFixed(2)} and expenses are ₹${totalSpent.toFixed(2)}. Net balance: ₹${(totalIncome - totalSpent).toFixed(2)}.`;
    }

    res.json({ success: true, response });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({ error: 'Failed to process AI query' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MoneyBook Backend Server running on http://0.0.0.0:${PORT}`);
});
