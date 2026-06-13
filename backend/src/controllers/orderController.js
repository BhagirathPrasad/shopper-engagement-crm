import Order from '../models/Order.js';

// @desc    Get orders (with pagination)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const count = await Order.countDocuments();
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ orderDate: -1 });

    res.json({
      orders,
      page,
      pages: Math.ceil(count / limit),
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId', 'name email phone');
    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for a specific customer
// @route   GET /api/customers/:id/orders
// @access  Private
export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.params.id }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};
