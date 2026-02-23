import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate invoice PDF
export const generateInvoice = async (orderData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `invoice-${orderData.orderNumber}.pdf`;
            const filePath = path.join(__dirname, '../uploads/invoices', fileName);

            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20).fillColor('#2d5016').text('KICKS DON\'T STINK', { align: 'center' });
            doc.fontSize(10).fillColor('#666').text('Sustainable Shoe Care', { align: 'center' });
            doc.moveDown();

            // Invoice title
            doc.fontSize(16).fillColor('#000').text('INVOICE', { align: 'center' });
            doc.moveDown();

            // Order details
            doc.fontSize(10);
            doc.text(`Order Number: ${orderData.orderNumber}`, 50, 150);
            doc.text(`Date: ${new Date(orderData.createdAt).toLocaleDateString()}`, 50, 165);
            doc.text(`Customer: ${orderData.shippingAddress.fullName}`, 50, 180);
            doc.text(`Email: ${orderData.customerEmail}`, 50, 195);

            // Shipping address
            doc.text('Shipping Address:', 350, 150);
            doc.text(orderData.shippingAddress.addressLine1, 350, 165);
            if (orderData.shippingAddress.addressLine2) {
                doc.text(orderData.shippingAddress.addressLine2, 350, 180);
            }
            doc.text(`${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}`, 350, 195);
            doc.text(orderData.shippingAddress.pincode, 350, 210);

            // Items table
            doc.moveDown(4);
            const tableTop = 250;

            doc.fontSize(10).fillColor('#2d5016');
            doc.text('Item', 50, tableTop);
            doc.text('Qty', 300, tableTop);
            doc.text('Price', 370, tableTop);
            doc.text('Total', 470, tableTop);

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            let yPosition = tableTop + 25;
            doc.fillColor('#000').fontSize(9);

            orderData.items.forEach(item => {
                doc.text(item.productName, 50, yPosition, { width: 230 });
                doc.text(item.variantDetails, 50, yPosition + 12, { width: 230, fontSize: 8, color: '#666' });
                doc.text(item.quantity.toString(), 300, yPosition);
                doc.text(`₹${item.price}`, 370, yPosition);
                doc.text(`₹${item.quantity * item.price}`, 470, yPosition);
                yPosition += 35;
            });

            // Pricing breakdown
            yPosition += 20;
            doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
            yPosition += 10;

            doc.text('Subtotal:', 350, yPosition);
            doc.text(`₹${orderData.pricing.subtotal}`, 470, yPosition);
            yPosition += 15;

            doc.text(`GST (${orderData.pricing.gstPercentage}%):`, 350, yPosition);
            doc.text(`₹${orderData.pricing.gst}`, 470, yPosition);
            yPosition += 15;

            doc.text('Delivery Charge:', 350, yPosition);
            doc.text(`₹${orderData.pricing.deliveryCharge}`, 470, yPosition);
            yPosition += 15;

            if (orderData.pricing.discount > 0) {
                doc.text('Discount:', 350, yPosition);
                doc.text(`-₹${orderData.pricing.discount}`, 470, yPosition);
                yPosition += 15;
            }

            doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
            yPosition += 10;

            doc.fontSize(12).fillColor('#2d5016');
            doc.text('Total:', 350, yPosition);
            doc.text(`₹${orderData.pricing.total}`, 470, yPosition);

            // Footer
            doc.fontSize(8).fillColor('#666');
            doc.text('Thank you for choosing sustainable products! 🌱', 50, 700, { align: 'center' });
            doc.text('Kicks Don\'t Stink - Eco-Friendly • Sustainable • Chemical-Free', 50, 715, { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(`/uploads/invoices/${fileName}`);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

// Generate monthly sales report PDF
export const generateMonthlyReport = async (reportData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `monthly-report-${reportData.month}-${reportData.year}.pdf`;
            const filePath = path.join(__dirname, '../uploads/reports', fileName);

            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.fontSize(24).fillColor('#2d5016').text('Monthly Sales Report', { align: 'center' });
            doc.fontSize(14).fillColor('#666').text(`${reportData.month} ${reportData.year}`, { align: 'center' });
            doc.moveDown(2);

            // Key metrics
            doc.fontSize(12).fillColor('#000');
            doc.text(`Total Revenue: ₹${reportData.totalRevenue}`, 50);
            doc.text(`Total Orders: ${reportData.totalOrders}`, 50);
            doc.text(`New Users: ${reportData.newUsers}`, 50);
            doc.text(`Average Order Value: ₹${reportData.averageOrderValue}`, 50);
            doc.moveDown();

            // Best selling products
            doc.fontSize(14).fillColor('#2d5016').text('Top Selling Products', 50);
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#000');

            reportData.topProducts.forEach((product, index) => {
                doc.text(`${index + 1}. ${product.name} - ${product.salesCount} units (₹${product.revenue})`, 60);
            });

            doc.moveDown();

            // Slow moving products
            doc.fontSize(14).fillColor('#2d5016').text('Slow Moving Products', 50);
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#000');

            reportData.slowProducts.forEach((product, index) => {
                doc.text(`${index + 1}. ${product.name} - ${product.salesCount} units`, 60);
            });

            doc.moveDown();

            // Stock status
            doc.fontSize(14).fillColor('#2d5016').text('Stock Status', 50);
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#000');
            doc.text(`Low Stock Items: ${reportData.lowStockCount}`, 60);
            doc.text(`Out of Stock Items: ${reportData.outOfStockCount}`, 60);

            // Footer
            doc.fontSize(8).fillColor('#666');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, 700, { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
