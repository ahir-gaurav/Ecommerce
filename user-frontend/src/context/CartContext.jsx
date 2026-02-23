import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, variant, quantity = 1) => {
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(
                item => item.productId === product._id && item.variantId === variant._id
            );

            if (existingIndex >= 0) {
                const newCart = [...prevCart];
                newCart[existingIndex].quantity += quantity;
                return newCart;
            }

            return [...prevCart, {
                productId: product._id,
                productName: product.name,
                variantId: variant._id,
                variantDetails: {
                    type: variant.type,
                    size: variant.size,
                    fragrance: variant.fragrance,
                    sku: variant.sku
                },
                price: product.basePrice + variant.priceAdjustment,
                quantity,
                image: product.images[0]?.url
            }];
        });
    };

    const removeFromCart = (productId, variantId) => {
        setCart(prevCart =>
            prevCart.filter(item =>
                !(item.productId === productId && item.variantId === variantId)
            )
        );
    };

    const updateQuantity = (productId, variantId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId, variantId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.productId === productId && item.variantId === variantId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
