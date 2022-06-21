import express from "express";
import controller from "../controllers/api";
const router = express.Router();

router.get("/nearby", controller.getNearbyStops);
router.get("/fav", controller.getFavouriteStops)

export = router;
