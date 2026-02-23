import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { sendAdminAlert } from './email.js';

// Calculate sales velocity (sales per day)
export const calculateSalesVelocity = (salesCount, daysInStock) => {
    if (daysInStock === 0) return 0;
    return salesCount / daysInStock;
};

// Detect fast-selling products
export const detectFastSelling = async () => {
    try {
        const products = await Product.find({ isActive: true });
        const fastSellingProducts = [];

        for (const product of products) {
            for (const variant of product.variants) {
                const daysInStock = variant.lastRestocked
                    ? Math.ceil((Date.now() - variant.lastRestocked.getTime()) / (1000 * 60 * 60 * 24))
                    : 30; // Default to 30 days if no restock date

                const velocity = calculateSalesVelocity(variant.salesCount, daysInStock);

                // Fast selling: more than 5 sales per day
                if (velocity > 5) {
                    fastSellingProducts.push({
                        product: product.name,
                        variant: `${variant.type} - ${variant.size} - ${variant.fragrance}`,
                        sku: variant.sku,
                        velocity: velocity.toFixed(2),
                        stock: variant.stock
                    });
                }
            }
        }

        return fastSellingProducts;
    } catch (error) {
        console.error('Error detecting fast-selling products:', error);
        return [];
    }
};

// Detect slow-selling products
export const detectSlowSelling = async () => {
    try {
        const products = await Product.find({ isActive: true });
        const slowSellingProducts = [];

        for (const product of products) {
            for (const variant of product.variants) {
                const daysInStock = variant.lastRestocked
                    ? Math.ceil((Date.now() - variant.lastRestocked.getTime()) / (1000 * 60 * 60 * 24))
                    : 30;

                const velocity = calculateSalesVelocity(variant.salesCount, daysInStock);

                // Slow selling: less than 0.5 sales per day and in stock for more than 7 days
                if (velocity < 0.5 && daysInStock > 7 && variant.stock > 0) {
                    slowSellingProducts.push({
                        product: product.name,
                        variant: `${variant.type} - ${variant.size} - ${variant.fragrance}`,
                        sku: variant.sku,
                        velocity: velocity.toFixed(2),
                        stock: variant.stock,
                        daysInStock
                    });
                }
            }
        }

        return slowSellingProducts;
    } catch (error) {
        console.error('Error detecting slow-selling products:', error);
        return [];
    }
};

// Suggest discount for slow-selling products
export const suggestDiscount = (daysInStock, currentStock) => {
    // Rule-based discount suggestion
    if (daysInStock > 60 && currentStock > 20) {
        return { percentage: 30, reason: 'Very slow movement with high stock' };
    } else if (daysInStock > 45 && currentStock > 15) {
        return { percentage: 20, reason: 'Slow movement with moderate stock' };
    } else if (daysInStock > 30 && currentStock > 10) {
        return { percentage: 15, reason: 'Slow movement' };
    } else if (daysInStock > 20) {
        return { percentage: 10, reason: 'Slightly slow movement' };
    }
    return { percentage: 0, reason: 'No discount needed' };
};

// Check low stock
export const checkLowStock = async () => {
    try {
        const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
        const products = await Product.find({ isActive: true });
        const lowStockItems = [];

        for (const product of products) {
            for (const variant of product.variants) {
                if (variant.stock > 0 && variant.stock <= threshold) {
                    lowStockItems.push({
                        product: product.name,
                        variant: `${variant.type} - ${variant.size} - ${variant.fragrance}`,
                        sku: variant.sku,
                        stock: variant.stock,
                        threshold
                    });
                }
            }
        }

        return lowStockItems;
    } catch (error) {
        console.error('Error checking low stock:', error);
        return [];
    }
};

// Generate sales report data
export const generateSalesReport = async (startDate, endDate) => {
    try {
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            'paymentInfo.status': 'Completed'
        }).populate('items.product');

        const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);
        const totalOrders = orders.length;

        // Calculate product sales
        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = `${item.product._id}-${item.variantId}`;
                if (!productSales[key]) {
                    productSales[key] = {
                        product: item.product,
                        variantId: item.variantId,
                        variantDetails: item.variantDetails,
                        salesCount: 0,
                        revenue: 0
                    };
                }
                productSales[key].salesCount += item.quantity;
                productSales[key].revenue += item.price * item.quantity;
            });
        });

        // Sort by sales count
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.salesCount - a.salesCount)
            .slice(0, 10);

        const slowProducts = Object.values(productSales)
            .sort((a, b) => a.salesCount - b.salesCount)
            .slice(0, 10);

        return {
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
            topProducts,
            slowProducts
        };
    } catch (error) {
        console.error('Error generating sales report:', error);
        return null;
    }
};

// Send fast-selling alert
export const sendFastSellingAlert = async (products) => {
    if (products.length === 0) return;

    const message = `
    <h3>Fast-Selling Products Detected</h3>
    <p>The following products are selling rapidly:</p>
    <ul>
      ${products.map(p => `
        <li>
          <strong>${p.product}</strong> (${p.variant})<br>
          SKU: ${p.sku}<br>
          Velocity: ${p.velocity} sales/day<br>
          Current Stock: ${p.stock} units
        </li>
      `).join('')}
    </ul>
    <p><strong>Action Required:</strong> Consider restocking these items soon to avoid stockouts.</p>
  `;

    await sendAdminAlert('Fast-Selling Products Alert', message);
};

// Send low stock alert
export const sendLowStockAlert = async (items) => {
    if (items.length === 0) return;

    const message = `
    <h3>Low Stock Alert</h3>
    <p>The following items are running low on stock:</p>
    <ul>
      ${items.map(item => `
        <li>
          <strong>${item.product}</strong> (${item.variant})<br>
          SKU: ${item.sku}<br>
          Current Stock: ${item.stock} units (Threshold: ${item.threshold})
        </li>
      `).join('')}
    </ul>
    <p><strong>Action Required:</strong> Restock these items to maintain inventory levels.</p>
  `;

    await sendAdminAlert('Low Stock Alert', message);
};

// Send slow-selling alert with discount suggestions
export const sendSlowSellingAlert = async (products) => {
    if (products.length === 0) return;

    const message = `
    <h3>Slow-Selling Products Report</h3>
    <p>The following products have slow movement:</p>
    <ul>
      ${products.map(p => {
        const discount = suggestDiscount(p.daysInStock, p.stock);
        return `
          <li>
            <strong>${p.product}</strong> (${p.variant})<br>
            SKU: ${p.sku}<br>
            Velocity: ${p.velocity} sales/day<br>
            Days in Stock: ${p.daysInStock}<br>
            Current Stock: ${p.stock} units<br>
            <strong>Suggested Discount: ${discount.percentage}%</strong> (${discount.reason})
          </li>
        `;
    }).join('')}
    </ul>
    <p><strong>Action Required:</strong> Consider applying suggested discounts to improve sales velocity.</p>
  `;

    await sendAdminAlert('Slow-Selling Products Report', message);
};
