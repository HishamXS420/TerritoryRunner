const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const mongoConnection = require('../config/mongodb');
const User = require('../models/User');
const UserStatistics = require('../models/UserStatistics');

const isMongoReady = () => {
  if (!mongoConnection) {
    return false;
  }
  return mongoConnection.readyState === 1;
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const trimmedUsername = username?.trim();

    console.log('📝 Registration attempt:', { username, email });

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (isMongoReady()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        console.log('⚠️ Email already in use:', email);
        return res.status(409).json({ message: 'Email already in use.' });
      }

      const newUser = new User({
        username: trimmedUsername,
        email: normalizedEmail,
        password,
      });

      const user = await newUser.save();
      console.log('✅ User registered successfully:', user._id);

      const stats = new UserStatistics({
        userId: user._id,
        totalDistance: 0,
        totalTime: 0,
        totalCalories: 0,
        totalTerritoryArea: 0,
        totalRunningSessions: 0,
      });
      await stats.save();
      console.log('✅ User statistics created:', stats._id);

      return res.status(201).json({
        message: 'User registered successfully.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    }

    const existingPgUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingPgUser.rows.length > 0) {
      console.log('⚠️ Email already in use:', email);
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertedUser = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [trimmedUsername, normalizedEmail, hashedPassword]
    );

    const user = insertedUser.rows[0];

    await pool.query(
      `INSERT INTO user_statistics (user_id, total_distance, total_time, total_calories, total_territory_area, total_running_sessions)
       VALUES ($1, 0, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    console.log('✅ User registered successfully (PostgreSQL):', user.id);

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();

    console.log('🔑 Login attempt:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (isMongoReady()) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', email);
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      console.log('✅ Login successful:', user._id);

      return res.json({
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    }

    const result = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log('✅ Login successful (PostgreSQL):', user.id);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('👤 Fetching profile for user:', userId);

    if (isMongoReady()) {
      const user = await User.findById(userId);
      const stats = await UserStatistics.findOne({ userId: userId });

      if (!user) {
        console.log('❌ User not found:', userId);
        return res.status(404).json({ message: 'User not found.' });
      }

      console.log('✅ User profile fetched successfully');

      return res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        stats,
      });
    }

    const userResult = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: 'User not found.' });
    }

    const statsResult = await pool.query(
      `SELECT total_distance, total_time, total_calories, total_territory_area, total_running_sessions
       FROM user_statistics WHERE user_id = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    const rawStats = statsResult.rows[0] || {
      total_distance: 0,
      total_time: 0,
      total_calories: 0,
      total_territory_area: 0,
      total_running_sessions: 0,
    };

    console.log('✅ User profile fetched successfully (PostgreSQL)');

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
      stats: {
        totalDistance: Number(rawStats.total_distance) || 0,
        totalTime: Number(rawStats.total_time) || 0,
        totalCalories: Number(rawStats.total_calories) || 0,
        totalTerritoryArea: Number(rawStats.total_territory_area) || 0,
        totalRunningSessions: Number(rawStats.total_running_sessions) || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
