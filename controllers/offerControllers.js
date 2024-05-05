const mongoose = require('mongoose');
const Offers = require('../models/offerModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

const offerLoad = async (req, res) => {
    try {
        const offers = await Offers.find().lean();
        offers.forEach(offer => {
            const expiryDate = new Date(offer.expireAt);
            const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                timeZone: 'UTC'
            });
            offer.expiry = formattedExpiry;
        });
        res.render('offers', { offers });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Internal Server Error');
    }
};

const fetchCategoriesFromDatabase = async () => {

    const category = await Category.find();
    console.log("category:",category)
    return category;

};

const addOffersLoad = async (req, res) => {
    try {
        const categories = await fetchCategoriesFromDatabase();

        res.render('addOffer', { categories: categories });
    }
    catch (err) {
        console.log(err.message);
    }
}
const checkCat= async (req, res) => {
    try {
      const { category } = req.body;
  
      const existingCategory = await Category.findOne({ name: category });
  
      res.json({ exists: !!existingCategory });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

const addOffers = async (req, res) => {
    try {
        const { category, discount, expiry } = req.body;

        const expiryWithOffset = expiry + "+00:00";
        const expiryDate = new Date(expiryWithOffset);
        console.log(category)
        console.log(discount)
        console.log(expiry)
        console.log(expiryDate)

        const offer = new Offers({
            category: category,
            discount: discount,
            expireAt: expiryDate,
            is_offer: true
        });
        const savedOffers = await offer.save();
        if (savedOffers) {
            const products = await Product.find().populate('category_id');
            console.log('products', products)
            const offer = await Offers.findOne({ is_offer: true });
            console.log('offer', offer)
            const proResult = products.filter(pro => pro.category_id?.name?.trim().toLowerCase() === category?.trim().toLowerCase());
            console.log('Filtered Products:', proResult);
            const discount = offer.discount;

            const updatedProducts = await Promise.all(
                proResult.map(async (product) => {
                    const earlierPrice = product.price
                    const discountedPrice = product.price * (1 - discount / 100);

                    await Product.findByIdAndUpdate(product._id, { $set: { price: discountedPrice, is_offer: true ,earlierPrice} });

                    return { ...product, discountedPrice };
                })
            );

            console.log('updatedProducts:', updatedProducts)
            if (updatedProducts) {
                await Offers.findOneAndUpdate({ is_offer: true }, { $set: { is_offer: false } });
            }

            console.log(`${updatedProducts.length} products updated with individual discounts.`);


            res.redirect('/admin/offers');
        }

    }
    catch (err) {
        console.log(err.message);
    }
}





module.exports = {
    offerLoad,
    addOffersLoad,
    addOffers,
    checkCat
};