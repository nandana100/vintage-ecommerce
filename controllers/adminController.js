
const User = require('../models/userModel')


const Category = require('../models/categoryModel');
const product = require('../models/productModel');
const Order=require("../models/orderModel")
const fs=require("fs")








// ..............................category........................................

const loadCategory = async (req, res) => {

    try {

        res.render('addcategory');

    } catch (error) {
        console.log(error.message);
    }
}

const addCategory = async (req, res) => {
    try {
        const name = req.body.categoryName.toLowerCase(); 

        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.render('addcategory', { message: 'Existing Category', exist: true });
        }

        const category = new Category({ name });
        const savedCategory = await category.save();

        if (savedCategory) {
            return res.redirect('/admin/viewCategory');
        } else {
            return res.render('addcategory', { message: 'Something went wrong with saving the category.' });
        }
    } catch (error) {
        console.error('Error saving category:', error);
        return res.render('addcategory', { message: 'Error saving the category.' });
    }
};




const loadCategoryList = async (req, res) => {
    try {                                                                
        const ITEMS_PER_PAGE = 5; 
        const page = req.query.page || 1; 
        const skip = (page - 1) * ITEMS_PER_PAGE;

        const categoryList = await Category.find({})
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .exec();

        
        const totalCategories = await Category.countDocuments();

        
        const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);

        res.render('category', {
            category: categoryList,
            totalPages,
            currentPage: +page,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).redirect('/');
    }
};





const editCategoryLoad = async (req, res) => {

    try {

        const id = req.query.id;

        const categoryList = await Category.findById({ _id: id });

        if (categoryList) {
            res.render('editCategory', { category: categoryList });
            console.log(categoryList)
        } else {
            res.redirect('/admin/viewCategory');
        }

    } catch (error) {
        console.log(error.message);
    }

};

const editCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const categoryname = req.body.name;

        console.log(categoryId);
        console.log(categoryname);

        if (!categoryname) {
            return res.render('editCategory', { errorMessage: 'Category name is required' });
        }

        const existingCategory = await Category.findOne({ name: categoryname, _id: { $ne: categoryId } });

        if (existingCategory) {
            return res.render('editCategory', { errorMessage: 'Category name already exists', category: { _id: categoryId, name: categoryname } });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { name: categoryname },
            { new: true }
        );

        if (updatedCategory) {
            return res.redirect('/admin/viewCategory');
        } else {
            return res.render('editCategory', { errorMessage: 'Error updating category' });
        }
    } catch (error) {
        console.error(error.message);
        return res.render('editCategory', { errorMessage: 'Error updating category' });
    }
};




const deleteCategory = async (req, res) => {

    try {

        const id = req.query.id
         await Category.deleteOne({ _id: id })
        res.redirect('/admin/viewCategory')
      
         
        

    } catch (error) {
        console.log(error.message)
    }

}


// .........................product..........................................

const ITEMS_PER_PAGE = 4; 

const loadProductList = async (req, res) => {
    try {
        const page = req.query.page || 1; 
        const skip = (page - 1) * ITEMS_PER_PAGE;

        const totalProducts = await product.countDocuments({ is_deleted: false, is_disabled: false });
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

        const activeProducts = await product
            .find({ is_deleted: false, is_disabled: false })
            .populate('category_id')
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(ITEMS_PER_PAGE);

        res.render('ProductList', {
            product: activeProducts,
            totalPages,
            currentPage: +page,
        });
    } catch (error) {
        console.log(error.message);
    }
};




const loadProduct = async (req, res) => {

    try {

        const categories = await fetchCategoriesFromDatabase();
        res.render('addProduct', { category: categories });

    } catch (error) {
        console.log(error.message);
    }
};

const fetchCategoriesFromDatabase = async () => {

    const category = await Category.find();
    return category;

};

const addProduct = async (req, res) => {

    try {

        const category = await fetchCategoriesFromDatabase();

        const Product = new product({
            name: req.body.name,
            quantity: req.body.quantity,
            price: req.body.price,
            description: req.body.description,
            image: req.files ? req.files.map(file => file.filename) : [],
            category_id: req.body.category_id
        })
       

        const productData = await Product.save()


        if (productData) {

            res.redirect('/admin/productList')

        } else {

            res.render('addProduct', { message: 'Something Wrong', category })
        }

    } catch (error) {
        console.log(error.message)
    }
};

const editProductLoad = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            res.redirect('/admin/productList');
            return;
        }

        const productDetails = await product.findById(id).populate('category_id');

        if (productDetails) {
            const categories = await fetchCategoriesFromDatabase();

            res.render('editProduct', { product: productDetails, categories: categories, existingImages: productDetails.image });
          
        } else {
            res.redirect('/admin/productList');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/productList');
    }
};


const deleteImage = async (req, res) => {
    try {
        const { productId, imageName } = req.query;

        
        const foundProduct = await product.findById(productId);

        if (!foundProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        foundProduct.image = foundProduct.image.filter((image) => image !== imageName);

        await foundProduct.save();

        const imagePath = `./public/productImage/${imageName}`;
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error deleting image:', err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                res.status(200).json({ message: 'Image deleted successfully' });
            }
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const updateProduct = async (req, res) => {
    try {
        const productId = req.body.id;

        const existingProduct = await product.findById(productId);

        if (!existingProduct) {
            console.log(`Product with id ${productId} not found`);
            return res.redirect('/admin/productList');
        }

        const existingImages = existingProduct.image || [];

        
        const newImages = req.files ? req.files.map(file => file.filename) : [];

        
        const updatedImages = existingImages.concat(newImages).slice(0, 3);

        
        const productData = await product.findByIdAndUpdate(
            productId,
            {
                name: req.body.name,
                quantity: req.body.quantity,
                price: req.body.price,
                description: req.body.description,
                image: updatedImages,
                category_id: req.body.category_id,
            },
            { new: true } 
        );

        if (productData) {
            return res.redirect('/admin/productList');
        }

        res.redirect('/admin/productList');
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/productList');
    }
};










const deleteProduct = async (req, res) => {
    try {
        const productId = req.query.id;

        await product.findByIdAndUpdate(productId, { $set: { is_deleted: true } });

  
        res.redirect('/admin/productList');
    } catch (error) {
        console.log(error.message);
        
        res.redirect('/admin/productList');
    }
};
const logout = async(req,res) => {
    try {
        
        req.session.destroy()
        res.redirect('/admin/login')

    } catch (error) {
        console.log(error.message)
    }
}
const loadOrder = async (req, res) => {
    try {
        const page = req.query.page || 1; 
        const skip = (page - 1) * ITEMS_PER_PAGE;

        const orders = await Order.find()
            .skip(skip)
            .sort({ orderPlacedAt: -1 }) 
            .limit(ITEMS_PER_PAGE);

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

        res.render('orderList', { orders, totalPages, currentPage: +page });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server error");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { newStatus } = req.body;

        if (!newStatus) {
            return res.status(400).json({ error: 'New status is required' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder, newStatus });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const orderDetail= async (req, res) => {
    try {
        const orderId = req.query.orderId;
       
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }
        
        res.render('orderDetail', { order });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}
const salesLoad=async(req,res)=>{

}


module.exports = {
   
    loadCategory,
    addCategory,
    loadCategoryList,
    editCategoryLoad,
    editCategory,
    deleteCategory,
    //  .....................
    loadProduct,
    loadProductList,
    addProduct,
    deleteImage,
    updateProduct,
    editProductLoad,
    deleteProduct,
    logout,
   
    //--------------------
    loadOrder,
    updateOrderStatus,
    orderDetail,
    salesLoad


}