
/**
 * Analytics Service - Google Tag Manager / Data Layer Helpers
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const pushToDataLayer = (event: string, data: any) => {
  if (window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data
    });
  } else {
    console.warn('GTM Data Layer not found');
  }
};

// E-commerce Events
export const trackViewItemList = (items: any[], category?: string) => {
  pushToDataLayer('view_item_list', {
    ecommerce: {
      item_list_id: category || 'all_products',
      item_list_name: category || 'All Products',
      items: items.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        index: index + 1,
        item_brand: item.brand,
        item_category: item.category,
        price: item.price
      }))
    }
  });
};

export const trackViewItem = (item: any) => {
  pushToDataLayer('view_item', {
    ecommerce: {
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_brand: item.brand,
        item_category: item.category,
        price: item.price
      }]
    }
  });
};

export const trackAddToCart = (item: any, quantity: number) => {
  pushToDataLayer('add_to_cart', {
    ecommerce: {
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_brand: item.brand,
        item_category: item.category,
        price: item.price,
        quantity: quantity
      }]
    }
  });
};

export const trackBeginCheckout = (cart: any[]) => {
  pushToDataLayer('begin_checkout', {
    ecommerce: {
      items: cart.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_brand: item.brand,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackPurchase = (orderId: string, total: number, cart: any[], shipping: number = 0) => {
  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: orderId,
      value: total,
      tax: 0,
      shipping: shipping,
      currency: 'BRL',
      items: cart.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_brand: item.brand,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};
