const express = require("express"),
      path = require("path"),
      config = require("config"),
      family_db = require("./family-db.js");
const app = express(),
      router = express.Router();

family_db.cacheJsonTree();

router.use("/d3", express.static(path.join(__dirname, "/node_modules/d3/build/")));
router.use("/d3-dtree", express.static(path.join(__dirname, "/node_modules/d3-dtree/dist/")));
router.use("/lodash", express.static(path.join(__dirname, "/node_modules/lodash/")));
router.use(express.static("public"));
router.get("/api/all", (req, res) => {
    res.json(family_db.getJsonTree());
});

app.use(config.get("server.base_url"), router);
app.listen(config.get("server.port"));
