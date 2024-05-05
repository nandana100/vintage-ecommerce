const Coupon = require('../models/couponModel');

const couponLoad = async (req, res) => {
  try {
      const ITEMS_PER_PAGE = 5;
      const page = req.query.page || 1; 
      const skip = (page - 1) * ITEMS_PER_PAGE;

      const coupons = await Coupon.find()
          .skip(skip)
          .limit(ITEMS_PER_PAGE)
          .lean();

      const totalCoupons = await Coupon.countDocuments();
      const totalPages = Math.ceil(totalCoupons / ITEMS_PER_PAGE);

      coupons.forEach(coupon => {
          if (coupon.expiry) {
              const expiryDate = new Date(coupon.expiry);
              coupon.expiry = expiryDate.toLocaleString('en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                  timeZone: 'UTC'
              });
          }
      });

      res.render('viewCoupon', { coupons, totalPages, currentPage: +page });
  } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: 'Internal server error' });
  }
};

  
  
  
  const addCouponLoad = async (req, res) => {
    try {
      const coupons = await Coupon.find();
      res.render('coupon', { coupons });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
  
  const createCoupon = async (req, res) => {
    try {
      const { code, discount, expiry, minimumPurchase, discountType } = req.body;
  
      if (!expiry) {
        return res.render('coupon', { message: 'Expiry date is required.' });
      }
      const expiryWithOffset = expiry + "+00:00";
      const expiryDate = new Date(expiryWithOffset);
  
      const existingCoupon = await Coupon.findOne({ code });
  
      if (existingCoupon) {
        return res.render('coupon', { message: 'Coupon code already exists. Please choose a different one.' });
      }
  
      if (minimumPurchase < 0 || discount < 0) {
        return res.render('coupon', { message: 'Minimum purchase and discount values cannot be negative.' });
      }
  
      const newCoupon = new Coupon({ code, discount, expiry: expiryDate, minimumPurchase, discountType });
      await newCoupon.save();
      res.redirect('/admin/coupons');
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  const loadEditCoupon = async (req, res) => {
    try {
      const id = req.query.id;
      console.log('Coupon ID:', id);
  
      const coupon = await Coupon.findOne({ _id: id }).lean();
      const formattedExpiry = coupon.expiry ? coupon.expiry.toISOString().slice(0, 16) : null;
  
      res.render('editCoupon', { coupon: { ...coupon, formattedExpiry } });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
  const editCoupons = async (req, res) => {
    try {
      const { code, discount, expiry, minimumPurchase, discountType } = req.body;
      console.log('Edit Coupon Request Body:', req.body);
  
      const expiryWithOffset = expiry + "+00:00";
      const expiryDate = new Date(expiryWithOffset);
  
      console.log('Parsed Expiry Date:', expiryDate);
  
      if (minimumPurchase < 0 || discount < 0) {
        return res.render('editCoupon', { coupon: { _id: id, code, discount, expiry, minimumPurchase, discountType }, message: 'Minimum purchase and discount values cannot be negative.' });
      }
      const id = req.body.id
  console.log('id',id)
      const updatedCoupon = await Coupon.findOneAndUpdate(
        { _id: id },
        { code, discount, expiry: expiryDate.toISOString(), minimumPurchase, discountType },
        { new: true }
      );
      console.log('Updated Coupon:', updatedCoupon);
  
      if (updatedCoupon) {
        res.redirect('/admin/coupons');
      } else {
        console.log('Update failed or coupon not found.');
        res.render('editCoupon', { coupon: { _id: id, code, discount, expiry, minimumPurchase, discountType }, message: 'Coupon not found or update failed.' });
      }
    } catch (err) {
      console.error('Error in editCoupons:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
  
  
  const deleteCoupons = async (req, res) => {
    try {
      const id = req.query.id;
      const coupon = await Coupon.deleteOne({ _id: id });
      res.redirect('/admin/coupons');
    }
    catch (err) {
      console.log(err.message);
    }
  }
  module.exports={
    couponLoad,
  createCoupon,
  addCouponLoad,
  loadEditCoupon,
  editCoupons,
  deleteCoupons
  }