
const Client = require('../models/Client');
const Agent = require('../models/Agent');
const User = require('../models/User');

// Approve a client
exports.approveClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.verification_status = 'approved';
    await client.save();

    res.json({ message: 'Client approved successfully', client });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Approve an agent
exports.approveAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    agent.verification_status = 'approved';
    await agent.save();

    res.json({ message: 'Agent approved successfully', agent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Reject a client
exports.rejectClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.verification_status = 'rejected';
    await client.save();

    res.json({ message: 'Client rejected successfully', client });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Reject an agent
exports.rejectAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    agent.verification_status = 'rejected';
    await agent.save();

    res.json({ message: 'Agent rejected successfully', agent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Ban a client from logging in forever
exports.banClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.verification_status = 'banned';
    await client.save();

    await User.findByIdAndUpdate(client.user_id, { $set: { banned: true } });

    res.json({ message: 'Client banned from login', client });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Suspend client from booking for 1 month
exports.suspendClientForMonth = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    client.verification_status = 'suspended';
    client.suspended_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await client.save();

    res.json({ message: 'Client suspended for 1 month', client });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Ban an agent from login
exports.banAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    agent.verification_status = 'banned';
    await agent.save();

    await User.findByIdAndUpdate(agent.user_id, { banned: true });

    res.json({ message: 'Agent banned from login', agent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Suspend an agent for 1 month
exports.suspendAgentForMonth = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    agent.verification_status = 'suspended';
    agent.suspended_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await agent.save();

    res.json({ message: 'Agent suspended for 1 month', agent });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};