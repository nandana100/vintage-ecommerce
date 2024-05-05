const Product = require('../models/productModel')
const ITEMS_PER_PAGE = 6
const Category=require('../models/categoryModel')
const Offers = require('../models/offerModel');
const mongoose=require('mongoose')
const loadProduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const categoryFilter = req.query.category;
        // const sortQuery = req.query.sort;

        let filter = { is_disabled: false };

        if (categoryFilter) {
            const isValidObjectId = mongoose.Types.ObjectId.isValid(categoryFilter);

            if (isValidObjectId) {
                filter.category_id = categoryFilter;
            } else {
                const trimmedCategory = categoryFilter.trim().toLowerCase();
                const cat = await Category.findOne({ name: trimmedCategory });

                if (cat) {
                    filter.category_id = cat._id;
                } else {
                    console.log('Category not found for:', trimmedCategory);
                }
            }
        }

        const sortOption = req.query.sort;
        console.log("sortOption,",sortOption)

        let sortQuery = {};
        console.log("sortQuery:",sortQuery)
        if (sortOption === 'lowToHigh') {
            sortQuery = { price: 1 };
        } else if (sortOption === 'highToLow') {
            sortQuery = { price: -1 };
        }
        // console.log('sortQuery:', sortQuery);  // Add this line
        // console.log('sortOption:', sortOption);

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

        const productData = await Product.find(filter)
            .sort(sortQuery)
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);



            const currentDate1 = new Date();
            const curDate = currentDate1 + "+00:00";
            const currentDate = new Date(curDate);
            console.log(currentDate);
            const expiredOffers = await Offers.find({ expireAt: { $lt: currentDate } });
            console.log('expiredoff-', expiredOffers);
            if (expiredOffers.length > 0) {
                // Iterate over expired offers
                console.log('helo');
                for (const expiredOffer of expiredOffers) {
                    console.log('heu')
                    const { category: expiredCategory } = expiredOffer;
                    console.log('expiredcat-', expiredCategory);
                    // Find associated products by category
                    const cat = await Category.find({ name: expiredCategory });
                    const catIds = cat.map(category => category._id)
                    const associatedProducts = await Product.find({ category_id: { $in: catIds }, is_offer: true });
                    console.log('associate-', associatedProducts);
                    // Update each associated product
                    for (const product of associatedProducts) {
                        // Retrieve earlier price from the product
                        const earlierPrice = product.earlierPrice;
                        console.log('earlier-', earlierPrice);
                        // Update the product
                        await Product.findByIdAndUpdate(
                            product._id,
                            {
                                $set: {
                                    price: earlierPrice,
                                    is_offer: false
                                }
                            }
                        );
                    }
    
                    // Delete the expired offer
                    await Offers.findByIdAndDelete(expiredOffer._id);
                }
    
                console.log('Expired offers deleted and products updated.');
            } else {
                console.log('No expired offers.');
            }

        const categories = await Category.find();
        res.render('Product', {
            product: productData,
            categories,
            totalPages,
            currentPage: page,
            sortOption: sortOption, // Pass the sorting option to the template
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




const loadProductDetail = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            res.redirect('/home');
            return;
        }

        const product = await Product.findById(id).populate('category_id');


        if (product) {
            res.render('productDetail', { product });
        } else {
            res.redirect('/home');
        }

    } catch (error) {
        console.log(error.message);
        res.render('productDetail', { message: 'An error occurred while fetching product details' });
    }
};
const productSearch = async (req, res) => {
    try {
        const searchTerm = req.query.search;
        const page = parseInt(req.query.page) || 1;

        const totalSearchResults = await Product.countDocuments({
            name: { $regex: searchTerm, $options: 'i' }
        });
        const totalPages = Math.ceil(totalSearchResults / ITEMS_PER_PAGE);

        const searchResults = await Product.find({
            name: { $regex: searchTerm, $options: 'i' }
        })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
            const categories = await Category.find(); 

            res.render('product', { product: searchResults, categories, searchTerm, totalPages, currentPage: page });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports={
    loadProduct,
    loadProductDetail,
    productSearch

}