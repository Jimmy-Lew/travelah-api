import express from "express";
import controller from "../controllers/api";
const router = express.Router();

router.get("/api", controller.getNearbyStops);

export = router;
