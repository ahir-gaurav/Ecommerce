import cron from 'node-cron';
import {
    detectFastSelling,
    detectSlowSelling,
    checkLowStock,
    sendFastSellingAlert,
    sendSlowSellingAlert,
    sendLowStockAlert,
    generateSalesReport
} from '../utils/analytics.js';
import { generateMonthlyReport } from '../utils/pdf.js';
import { sendAdminAlert } from '../utils/email.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🤖 AI Analytics cron jobs initialized');

// Hourly: Check for low stock and fast-selling products
cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly analytics check...');

    try {
        // Check low stock
        const lowStockItems = await checkLowStock();
        if (lowStockItems.length > 0) {
            await sendLowStockAlert(lowStockItems);
            console.log(`📦 Low stock alert sent for ${lowStockItems.length} items`);
        }

        // Check fast-selling products
        const fastSellingProducts = await detectFastSelling();
        if (fastSellingProducts.length > 0) {
            await sendFastSellingAlert(fastSellingProducts);
            console.log(`🚀 Fast-selling alert sent for ${fastSellingProducts.length} products`);
        }
    } catch (error) {
        console.error('❌ Error in hourly analytics:', error);
    }
});

// Daily: Analyze slow-selling products and suggest discounts
cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running daily slow-selling analysis...');

    try {
        const slowSellingProducts = await detectSlowSelling();
        if (slowSellingProducts.length > 0) {
            await sendSlowSellingAlert(slowSellingProducts);
            console.log(`📉 Slow-selling report sent for ${slowSellingProducts.length} products`);
        }
    } catch (error) {
        console.error('❌ Error in daily analytics:', error);
    }
});

// Monthly: Generate and email comprehensive sales report (1st day of month at 9 AM)
cron.schedule('0 9 1 * *', async () => {
    console.log('⏰ Generating monthly sales report...');

    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const salesData = await generateSalesReport(lastMonth, endOfLastMonth);

        if (!salesData) {
            console.log('⚠️ No sales data available for report');
            return;
        }

        // Get user count
        const userCount = await User.countDocuments();
        const newUsersLastMonth = await User.countDocuments({
            createdAt: { $gte: lastMonth, $lte: endOfLastMonth }
        });

        // Get low stock count
        const lowStockItems = await checkLowStock();

        const reportData = {
            month: lastMonth.toLocaleString('default', { month: 'long' }),
            year: lastMonth.getFullYear(),
            totalRevenue: salesData.totalRevenue,
            totalOrders: salesData.totalOrders,
            averageOrderValue: salesData.averageOrderValue,
            newUsers: newUsersLastMonth,
            totalUsers: userCount,
            topProducts: salesData.topProducts.map(p => ({
                name: p.product.name,
                salesCount: p.salesCount,
                revenue: p.revenue
            })),
            slowProducts: salesData.slowProducts.map(p => ({
                name: p.product.name,
                salesCount: p.salesCount
            })),
            lowStockCount: lowStockItems.length,
            outOfStockCount: 0 // Can be calculated if needed
        };

        const pdfPath = await generateMonthlyReport(reportData);

        // Send email with PDF attachment
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER,
            subject: `Monthly Sales Report - ${reportData.month} ${reportData.year}`,
            html: `
        <h2>Monthly Sales Report</h2>
        <p>Please find attached the comprehensive sales report for ${reportData.month} ${reportData.year}.</p>
        <h3>Key Highlights:</h3>
        <ul>
          <li>Total Revenue: ₹${reportData.totalRevenue}</li>
          <li>Total Orders: ${reportData.totalOrders}</li>
          <li>New Users: ${reportData.newUsers}</li>
          <li>Average Order Value: ₹${reportData.averageOrderValue}</li>
        </ul>
      `,
            attachments: [{
                filename: `monthly-report-${reportData.month}-${reportData.year}.pdf`,
                path: pdfPath
            }]
        });

        console.log('📊 Monthly sales report generated and sent');
    } catch (error) {
        console.error('❌ Error generating monthly report:', error);
    }
});

console.log('✅ Cron jobs scheduled:');
console.log('  - Hourly: Low stock & fast-selling checks');
console.log('  - Daily (9 AM): Slow-selling analysis');
console.log('  - Monthly (1st, 9 AM): Comprehensive sales report');
