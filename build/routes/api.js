"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const api_1 = __importDefault(require("../controllers/api"));
const router = express_1.default.Router();
router.get("/nearby", api_1.default.getNearbyStops);
router.get("/timings/code", api_1.default.getStopsByCode);
router.get("/timings/name", api_1.default.getStopsByName);
router.get("/timings", api_1.default.getBusTimings);
module.exports = router;
