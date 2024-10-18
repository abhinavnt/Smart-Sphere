
// 500 Error Handler Middleware
const handle500Error = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack
    res.status(500).render("500", { error: "Internal Server Error" }); // Render 500 error page
  };
  
  // 404 Error Handler Middleware
  const handle404Error = (req, res, next) => {
    res.status(404).render("404"); // Render 404 error page
  };
  
  // Export both middleware functions
  module.exports = {
    handle500Error,
    handle404Error
  };