const PORT = process.env.PORT || 3001;

const SOCKET_CORS = {
  origin: "*",
  methods: ["GET", "POST"],
};

module.exports = {
  PORT,
  SOCKET_CORS,
};
