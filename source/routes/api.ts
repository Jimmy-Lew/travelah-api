import express from "express";
import controller from "../controllers/api";
const router = express.Router();

router.get("/", controller.ping);

router.get("/nearby", controller.getNearbyStops);

router.get("/timings", controller.getBusTimings);
router.get("/timings/code", controller.getStopsByCode);
router.get("/timings/name", controller.getStopsByName);

router.get("/route", controller.getRoute);
router.get("/route/name", controller.getRouteByDestinationName);
router.get("/route/name_2", controller.getRouteByName);

router.get("/util/code", controller.getBusStopName)
router.get("/util/fare", controller.getFare)

export = router;