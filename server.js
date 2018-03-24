var express = require("express"),
      path = require("path"),
      config = require("config"),
      family_db = require("./family-db.js");
var app = express(),
      router = express.Router();

function modulePath(path) {
    return express.static(__dirname + "/node_modules/" + path);
}

family_db.cacheJsonTree();

router.use("/d3", modulePath("/d3/build/"));
router.use("/d3-dtree", modulePath("/d3-dtree/dist/"));
router.use("/lodash", modulePath("/lodash/"));
router.use("/bootstrap", modulePath("/bootstrap/dist/"));
router.use("/jquery", modulePath("/jquery/dist/"));
router.use("/popper", modulePath("/popper.js/dist/"));
router.use(express.static("public"));

router.get("/api/all", (req, res) => {
    res.json(family_db.getJsonTree());
});

app.use(config.get("server.base_url"), router);
app.listen(config.get("server.port"));
