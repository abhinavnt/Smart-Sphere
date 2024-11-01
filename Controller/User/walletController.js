const walletSchema = require('../../model/walletModel')




// to show transactions 
const transaction = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const wallet = await walletSchema.findOne({ userId });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
        const latestTransactions = wallet.transactions
        .sort((a, b) => b.date - a.date)
        return res.json(latestTransactions); // Send all transactions
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to fetch transactions' });
    }
}



module.exports ={
    transaction
}