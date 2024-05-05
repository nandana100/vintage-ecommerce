

const easyinvoice = require('easyinvoice');
const Order = require('../models/orderModel');
const User = require('../models/userModel'); 

const createInvoice = async(req, res) => {
    try {
        const orderId = req.query.id;
        console.log(orderId);
        const orderData = await Order.findById(orderId).populate('products.product_id');
        const order = orderData.toObject();
        const user = await User.findById(order.userId);
        if (!order) {
            console.error('Order not found');
            return res.status(404).send('Order not found');
        }

        const shortenedOrderId = orderId.toString().substring(0, 6);

        const addresses = order.addresses;
        const adrs = addresses.address;
        const zip = addresses.pincode;
        const city = addresses.city;
        const state = addresses.state;
        const country = addresses.country;

        const invoiceData = {
            "images": {
                "background": "https://public.easyinvoice.cloud/pdf/sample-background.pdf"
            },
            "sender": {
                "company": "Vintage",
                "address": "Sample Street 123",
                "zip": "1234 AB",
                "city": "Sampletown",
                "country": "Samplecountry"
            },
            "client": {
                "company": user.name, 
                "address": adrs,
                "zip": zip,
                "city": city,
                "country": country
            },
            "information": {
                "number": `INV-${shortenedOrderId}`,
                "date": order.createdAt,
            },
            "products": order.products.map(product => ({
                "quantity": product.quantity,
                "description": product.product_id.name, 
                "tax-rate": 0,
                "price": product.price,
            })),
            "bottom-notice": "Thank you for your purchase",
            "settings": {
                "currency": "INR",
                "tax-notation": "GST"
            },
        };

        const result = await easyinvoice.createInvoice(invoiceData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
        res.send(Buffer.from(result.pdf, 'base64'));

        console.log(`Invoice created for order ${orderId}.`);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = { createInvoice };
