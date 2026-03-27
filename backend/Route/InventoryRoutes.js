const express = require("express");
const router = express.Router();
//Insert Model
const user = require("../Model/Inventory");
//Insert controller
const userController = require("../Controllers/InventoryController");

router.get("/",userController.getallusers);
router.post("/",userController.adduser);
router.get("/:id",userController.getById);
router.put("/:id",userController.Updateuser);
router.delete("/:id",userController.deleteUsers);

//export
module.exports = router;