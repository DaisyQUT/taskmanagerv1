const mongoose = require('mongoose');

// One entry for every approve or reject decision. Entries are never edited.
const auditLogSchema = new mongoose.Schema(
    {
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        decision: { type: String, enum: ['approved', 'rejected'], required: true },
        reason: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);