const couponSchema= require("../../model/couponModel")



const availableCoupon =async (req, res) => {
    try {
        const availableCoupons = await couponSchema.find({ isActive: true });
        res.json({
            coupons: availableCoupons.map(coupon => ({
                couponCode: coupon.couponCode,
                discountType: coupon.discountType,
                discountAmount: coupon.discountAmount,
                minPurchaseAmount: coupon.minAmount,
                maxDiscountAmount: coupon.maxAmount,
                endDate: coupon.endDate
            }))
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
};


module.exports={availableCoupon}