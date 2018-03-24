var express = require("express"),
    path = require("path"),
    config = require("config"),
    family_db = require("./family-db.js");

var app = express(),
    router = express.Router();

var git_version = require("child_process")
    .execSync("git rev-parse HEAD")
    .toString().trim();

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

router.put("/api/recache", (req, res) => {
    family_db.cacheJsonTree();
    res.json({ status: "ok" });
});

router.get("/api/version", (req, res) => {
    res.json({
        git: git_version,
        git_small: git_version.slice(0, 7)
    });
});

app.use(config.get("server.base_url"), router);
app.listen(config.get("server.port"));
