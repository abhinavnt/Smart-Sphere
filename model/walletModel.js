const mongoose = require('mongoose');
const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    balance: { type: Number, default: 0 },
    transactions: [
        {
            type: { type: String, enum: ['credit', 'debit'], required: true },
            amount: { type: Number, required: true },
            date: { type: Date, default: Date.now },
            description: { type: String }
        }
    ]
},{timestamps:true});
module.exports = mongoose.model('Wallet', walletSchema);