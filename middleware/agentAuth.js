// add this to not modify in the auth middleware
// if the changes fit well with your existing code structure, we can add the changes to the auth middleware .
// if not this is the code for the agent auth middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const Agent = require('../models/Agent');

async function auth(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // change this line to match your token structure
    req.user = { id: verified.userId, role: verified.role };

    // change this line to match your token structure
    const user = await User.findById(verified.userId); 

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'client') {
      const client = await Client.findOne({ user_id: user._id });
      if (!client) return res.status(404).json({ error: 'Client profile not found' });

      if (client.verification_status === 'suspended' && client.suspended_until) {
        if (new Date() > client.suspended_until) {
          client.verification_status = 'approved';
          client.suspended_until = null;
          await client.save();
        } else {
          return res.status(403).json({ message: `Client suspended until ${client.suspended_until}` });
        }
      }
    }

    if (user.role === 'agent') {
      const agent = await Agent.findOne({ user_id: user._id });
      if (!agent) return res.status(404).json({ error: 'Agent profile not found' });

      if (agent.verification_status === 'suspended' && agent.suspended_until) {
        if (new Date() > agent.suspended_until) {
          agent.verification_status = 'approved';
          agent.suspended_until = null;
          await agent.save();
        } else {
          return res.status(403).json({ message: `Agent suspended until ${agent.suspended_until}` });
        }
      }
      // add the agent ID to the request object
      req.user.id = agent._id;
      req.user.verification_status = agent.verification_status;
    }

    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid Token', details: err.message });
  }
}

module.exports = auth;
