import express from "express";
import controller from "../controllers/api";
const router = express.Router();

router.get("/nearby", controller.getNearbyStops);
router.get("/timings/code", controller.getStopsByCode);
router.get("/timings/name", controller.getStopsByName);
router.get("/timings", controller.getBusTimings);
router.get("/route", controller.getRoute);
router.get("/route/name", controller.getRouteByName);
router.get("/", controller.ping);
router.get("/util/code", controller.getBusStopName)

export = router;