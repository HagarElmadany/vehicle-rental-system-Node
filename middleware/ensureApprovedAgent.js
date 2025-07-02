// middleware/ensureApprovedAgent.js
module.exports = (req, res, next) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Access denied: not an agent' });
  }
    // console.log(req.user);
    if (req.user.verification_status !== 'approved') {
    return res.status(403).json({ message: 'Access denied: Agent not approved' });
  }

  next();
};
