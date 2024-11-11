// 500 Error Handler Middleware
const handle500Error = (err, req, res, next) => {
  res.status(500).render("500", { error: "Internal Server Error" });
};

// 404 Error Handler Middleware
const handle404Error = (req, res, next) => {
  res.status(404).render("404");
};

// Export both middleware functions
module.exports = {
  handle500Error,
  handle404Error,
};
