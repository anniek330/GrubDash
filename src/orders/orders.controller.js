const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

//Middleware Functions
function validateDeliverToProperty(req, res, next) {
  const { deliverTo } = req.body.data;
  if (deliverTo && deliverTo.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "deliverTo",
  });
}

function validateMobileNumberProperty(req, res, next) {
  const { mobileNumber } = req.body.data;
  if (mobileNumber && mobileNumber.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "mobileNumber",
  });
}
function validateStatusProperty(req, res, next) {
  const { status } = req.body.data;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: "status",
  });
}
function validateOrderIsNotDelivered(req, res, next) {
  const { status } = req.body.data;
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  } else {
    next();
  }
}
function validateOrderIsPending(req, res, next) {
  const { status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  } else {
    next();
  }
}
function validateDishesProperty(req, res, next) {
  const { dishes } = req.body.data;
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  } else {
    next();
  }
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  if (orderIndex >= 0) {
    res.locals.orderIndex = orderIndex;
    res.locals.order = orders[orderIndex];
    next();
  } else {
    next({
      status: 404,
      message: `could not find order with id ${orderId}`,
    });
  }
}

function validateBodyAndParamsIdMatch(req, res, next) {
  let { id } = req.body.data;
  if (id && id !== req.params.orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${req.params.orderId}.`,
    });
  } else {
    next();
  }
}

function validateDishQuantity(req, res, next) {
  const { data: { dishes } = [] } = req.body;
  dishes.forEach(({ quantity }, index) => {
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const { deliverTo, mobileNumber, status, dishes } = req.body.data;
  const initialStatus = status || "pending";
  // make a new object w/ the data from the request body
  let newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: initialStatus,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const { order } = res.locals;
  res.send({ data: order });
}

function update(req, res, next) {
  let { order, orderIndex } = res.locals;
  order.deliverTo = req.body.data.deliverTo;
  order.mobileNumber = req.body.data.mobileNumber;
  order.status = req.body.data.status;
  order.dishes = req.body.data.dishes;
  res.send({ data: order });
}

function destroy(req, res, next) {
  // figure out where the order is in the array
  const { orderIndex } = res.locals;
  // remove the order from the array
  orders.splice(orderIndex, 1);
  // send a 204 response
  res.status(204).send();
}

module.exports = {
  list,
  create: [
    validateDeliverToProperty,
    validateMobileNumberProperty,
    validateDishesProperty,
    validateDishQuantity,
    create,
  ],
  read: [validateOrderExists, read],
  update: [
    validateOrderExists,
    validateBodyAndParamsIdMatch,
    validateDeliverToProperty,
    validateMobileNumberProperty,
    validateStatusProperty,
    validateOrderIsNotDelivered,
    validateDishesProperty,
    validateDishQuantity,
    update,
  ],
  delete: [validateOrderExists, validateOrderIsPending, destroy],
};
