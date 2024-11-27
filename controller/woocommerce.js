const axios = require("axios");

const createProductController = async (req, res) => {
  const {
    name,
    type,
    price,
    description,
    shortDescription,
    categories,
    images,
  } = req.body;

  const url = "https://gillstradingpost.com/wp-json/wc/v3/products";
  const consumerKey = process.env.CONSUMER_KEY;
  const consumerSecret = process.env.CONSUMER_SECRET;

  try {
    const response = await axios.post(
      url,
      {
        name,
        type,
        regular_price: price,
        description,
        short_description: shortDescription,
        categories,
        images,
      },
      {
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
      }
    );

    res.status(201).json({
      status: 201,
      message: "Product created successfully",
      product: response.data,
    });
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || error.message;

    console.error("Error creating product:", {
      status: statusCode,
      message: errorMessage,
    });

    res.status(statusCode).json({
      status: statusCode,
      message: "Error creating product",
      error: errorMessage,
    });
  }
};

module.exports = createProductController;
