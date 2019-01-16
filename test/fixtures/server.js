const http = require('http');

const template = path => `<html><body><a href="${path}">${path}</a></body></html>`;

const makeRoutes = (limit) => {
  const routes = {};

  for (let i = 0; i < limit;) {
    const route = i === 0 ? '/' : `/${i}`;
    const path = ++i < limit ? `/${i}` : '';
    routes[route] = template(path);
  }

  return routes;
};

const Server = function (limit) {
  http.Server.call(this);

  const routes = makeRoutes(limit);

  this.on('request', (req, res) => {
    res.setHeader('Content-Type', 'text/html');

    if (Object.keys(routes).indexOf(req.url) > -1) {
      res.end(routes[req.url]);
    } else {
      res.statusCode = 404;
      res.end(template(''));
    }
  });
};

Server.prototype = Object.create(http.Server.prototype);

module.exports = Server;
