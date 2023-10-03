const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list(req, res) {
  res.send({ data: dishes });
}

function validateForName(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name && name.trim() !== "") {
    next();
  } else {
    next({
      status: 400,
      message: "Dish must include a non-empty name",
    });
  }
}

function validateForDescription(req, res, next) {
  const description = req.body.data.description;
  if (description && description.length > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "description",
    });
  }
}
function validateForImage(req, res, next) {
  const { image_url } = req.body.data;
  if (image_url && image_url.length > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "image_url",
    });
  }
}
function validatePriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "price",
    });
  }
  next();
}

function create(req, res, next) {
  // make a new object w/ the data from the request body
  let newDish = {
    id: nextId(),
    name: req.body.data.name,
    description: req.body.data.description,
    price: req.body.data.price,
    image_url: req.body.data.image_url,
  };
  // save it into the dishes array
  dishes.push(newDish);
  // send back a 201 status code w/ the new dish
  res.status(201).json({ data: newDish });
}

function validateDishExists(req, res, next) {
  const { dishId } = req.params;
  const dishIndex = dishes.findIndex((dish) => dish.id === dishId);
  if (dishIndex >= 0) {
    // save the information about the found dish so it can be used again
    // in the route handlers
    res.locals.dishIndex = dishIndex;
    res.locals.dish = dishes[dishIndex];
    next();
  } else {
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }
}

function read(req, res, next) {
  const { dish } = res.locals;
  res.send({ data: dish });
}
function validateBodyAndParamsIdMatch(req, res, next) {
  let { id } = req.body.data;
  if (id && id !== req.params.dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${req.params.dishId}`,
    });
  } else {
    next();
  }
}
function update(req, res, next) {
  let { dish, dishIndex } = res.locals;
  dish.name = req.body.data.name;
  dish.description = req.body.data.description;
  dish.price = req.body.data.price;
  dish.image_url = req.body.data.image_url;
  res.send({ data: dish });
}

module.exports = {
  list,
  create: [
    validateForName,
    validateForDescription,
    validateForImage,
    validatePriceProperty,
    create,
  ],
  read: [validateDishExists, read],
  update: [
    validateDishExists,
    validateBodyAndParamsIdMatch,
    validateForName,
    validateForDescription,
    validateForImage,
    validatePriceProperty,
    update,
  ],
};
