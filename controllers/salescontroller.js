
const Order=require("../models/orderModel")
const excel = require('exceljs');

const puppeteer = require('puppeteer');

const fs = require('fs-extra');

const path = require('path');

const ejs = require('ejs')





const loadReport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 3;

        if (req.query.startDate && req.query.endDate) {
            const filteredOrders = await Order.find({
                status: 'Delivered',
                orderPlacedAt: {
                    $gte: new Date(req.query.startDate),
                    $lte: new Date(req.query.endDate),
                },
            })
            .populate('products.product_id')
            .sort({ orderPlacedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

            console.log('filteredOrders:', filteredOrders);

            if (filteredOrders.length === 0) {
                return res.render('salesReport', { orderData: [], totalPages: 0, currentPage: page, message: 'No data available for the selected date range' });
            } else {
                return res.status(200).json(filteredOrders);
            }
        } else {
            const totalCount = await Order.countDocuments({ status: 'Delivered' });
            const totalPages = Math.ceil(totalCount / limit);

            const orderDatas = await Order.find({ status: 'Delivered' })
            .populate('products.product_id')
            .sort({ orderPlacedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

            const orderData = orderDatas.map((order) => ({
                ...order,
                orderPlacedAt: new Date(order.orderPlacedAt).toLocaleDateString(),
             
            }));

            console.log('orderData:', orderData);

            res.render('salesReport', { orderData, totalPages, currentPage: page });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Internal Server Error');
    }
};



const exportExcelOrders = async (req, res) => {
  try {
      const { startDate, endDate } = req.query;
      console.log("startdateod excel:",startDate)
      console.log("end date of excel:",endDate)

      if (startDate && endDate) {

          const orders = await Order.find({
              status: 'Delivered',
              orderPlacedAt: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
              }
          }).populate('products.product_id').exec();
          orders.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

          const data = [];
          orders.forEach(order => {
              const productDetails = order.products.map(product => {
                  if (product.product_id) {
                      return `${product.product_id.name} (Qty: ${product.quantity}, Price: ${product.price})`;
                  } else {
                      return "Product not found";
                  }
              }).join(', ');

              const address = order.addresses || {};

              data.push({
                  name: order.name,
                  email: order.email,
                  paymentMethod: order.paymentMethod,
                  status: order.status,
                  productDetails: productDetails,
                  addresses: {
                      address: address ? address.address : 'N/A',
                      city: address ? address.city : 'N/A',
                      pincode: address ? address.pincode : 'N/A',
                      state: address ? address.state : 'N/A',
                  },
              });
            });

          const workbook = new excel.Workbook();
          const worksheet = workbook.addWorksheet("Orders");
          worksheet.columns = [
              { header: "name", key: "name", width: 20 },
              { header: "Email", key: "email", width: 20, numFmt: '0' },
              { header: "Payment Method", key: "paymentMethod", width: 20 },
              { header: "Status", key: "status", width: 20 },
              { header: "Product Details", key: "productDetails", width: 30 },
              { header: "Address", key: "address", width: 30 },
              { header: "City", key: "city", width: 15 },
              { header: "Pincode", key: "pincode", width: 10 },
              { header: "State", key: "state", width: 15 },
          ];

          data.forEach((order) => {
              const row = worksheet.addRow(order);
              row.height = 30;
          });

          worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true };
              worksheet.getRow(1).height = 20;
          });

          res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

          res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
          return workbook.xlsx.write(res).then(() => {
              res.status(200).end();
          });

      } else {
          const orders = await Order.find({ status: 'Delivered' }).populate('products.product_id');
          orders.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

          const data = [];
          orders.forEach(order => {
              const productDetails = order.products.map(product => {
                  if (product.product_id) {
                      return `${product.product_id.name} (Qty: ${product.quantity}, Price: ${product.price})`;
                  } else {
                      return "Product not found";
                  }
              }).join(', ');

              const address = order.addresses || {};

              data.push({
                  name: order.name,
                  email: order.email,
                  paymentMethod: order.paymentMethod,
                  status: order.status,
                  productDetails: productDetails,
                  addresses: {
                      address: address ? address.address : 'N/A',
                      city: address ? address.city : 'N/A',
                      pincode: address ? address.pincode : 'N/A',
                      state: address ? address.state : 'N/A',
                  },
              });
            });


          const workbook = new excel.Workbook();
          const worksheet = workbook.addWorksheet("Orders");
          worksheet.columns = [
              { header: "Fullname", key: "name", width: 20 },
              { header: "email", key: "email", width: 10, numFmt: '0' },
              { header: "Payment Method", key: "paymentMethod", width: 5 },
              { header: "Status", key: "status", width: 10 },
              { header: "Product Details", key: "productDetails", width: 30 },
              { header: "Address", key: "address", width: 30 },
              { header: "City", key: "city", width: 15 },
              { header: "Pincode", key: "pincode", width: 10 },
              { header: "State", key: "state", width: 15 },
          ];

          data.forEach((order) => {
              const row = worksheet.addRow(order);
              row.height = 30;
          });

          worksheet.getRow(1).eachCell((cell) => {
              cell.font = { bold: true };
              worksheet.getRow(1).height = 20;
          });

          res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

          res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
          return workbook.xlsx.write(res).then(() => {
              res.status(200).end();
          });
      }

  } catch (err) {
      console.log(err.message);
  }
};

const compile = async function (templateName, data) {
  const filePath = path.join(process.cwd(), 'views', 'admin', `${templateName}.ejs`);
  const html = await fs.readFile(filePath, 'utf8');
  return ejs.compile(html)(data);
};

const exportPdfOrders = async (req, res) => {
    try {
        let filteredDate = '';
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        const { startDate, endDate } = req.query;

        console.log("Exporting PDF for startDate:", startDate, "endDate:", endDate);

        if (startDate && endDate) {
            filteredDate = `${startDate} to ${endDate}`;
            console.log("Filtered Date:", filteredDate);
            const orderDatas = await Order.find({ status: 'Delivered', orderPlacedAt: { $gte: new Date(startDate), $lte: new Date(endDate) } }).populate('products.product_id').lean();
            console.log("Filtered Orders:", orderDatas);
            orderDatas.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));

            const orderData = orderDatas.map(order => {
                let totalPrice = 0;
                order.products.forEach(product => {
                    totalPrice += product.price * product.quantity;
                });
                return {
                    ...order,
                    totalPrice: totalPrice
                };
            });
    
            const content = await compile('pdf', { orderData: orderData, filteredDate });
  
            await page.setContent(content);
  
            const pdfBuffer = await page.pdf({
              format: 'A4',
              printBackground: true
            });
  
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
  
            res.send(pdfBuffer);
  
            console.log('done creating pdf');
  
            await browser.close();
  
        } else {
            filteredDate = 'Nill';
            console.log("No date range provided, exporting all orders.");
            const orderDatas = await Order.find({ status: 'Delivered' }).populate('products.product_id').lean();
            console.log('else pdf orderDatas', orderDatas);
            orderDatas.sort((a, b) => new Date(b.orderPlacedAt) - new Date(a.orderPlacedAt));
            const orderData = orderDatas.map(order => {
              return {
                ...order,
                orderPlacedAt: new Date(order.orderPlacedAt).toLocaleDateString()
              };
            });
    
            const content = await compile('pdf', { orderData: orderData ,filteredDate});
      
            await page.setContent(content);
      
            const pdfBuffer = await page.pdf({
              format: 'A4',
              printBackground: true
            });
      
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
      
            res.send(pdfBuffer);
      
            console.log('done creating pdf');
      
            await browser.close();
        }

    }
    catch (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
}

module.exports = {
  loadReport,
  exportExcelOrders,
  exportPdfOrders,
};