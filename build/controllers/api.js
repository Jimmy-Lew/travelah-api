"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
// @ts-ignore
const jsonData = JSON.parse(fs.readFileSync("source/assets/stops.json"));
const getNearbyStops = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const location = {
        lat: req.query.lat,
        lng: req.query.lng,
    };
    console.log(req.query.lat);
    let result = yield axios_1.default.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=bus+stop&location=${location.lat}%2C${location.lng}&radius=150&type=[transit_station,bus_station]&key=AIzaSyCnu98m6eMKGjpCfOfSMHFfa2bwbPZ0UcI`);
    let busStops = [];
    for (const item of result.data.results) {
        const code = yield getBusStopCode(item.name);
        const serviceList = yield IGetBusTimings(code);
        const busStop = {
            location: item.geometry.location,
            name: item.name,
            code: code,
            serviceList: serviceList,
        };
        // @ts-ignore
        busStops.push(busStop);
    }
    return res.status(200).json({
        data: busStops,
    });
});
// TODO:
const getFavouriteStops = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let busStops = [];
    // @ts-ignore
    const favouritesList = req.query.favs;
    // @ts-ignore
    for (let code of favouritesList) {
        const name = yield getBusStopName(code);
        const serviceList = yield IGetBusTimings(code);
        const busStop = {
            name: name,
            code: code,
            serviceList: serviceList,
        };
        // @ts-ignore
        busStops.push(busStop);
    }
    return res.status(200).json({
        data: busStops,
    });
});
const getBusTimings = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const busStopCode = req.query.code;
    let result = yield axios_1.default.get(`http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}`, {
        headers: {
            AccountKey: "RdoZ93saQ32Ts1JcHbFegg==",
        },
    });
    let serviceList = [];
    const services = result.data.Services;
    if (services.length < 0)
        return;
    services.forEach((item) => {
        const serviceNo = item.ServiceNo;
        let busList = [];
        for (let i = 0; i < 3; i++) {
            const busNo = i <= 0 ? "NextBus" : `NextBus${i + 1}`;
            const resBus = item[busNo];
            if (resBus.EstimatedArrival.length <= 0)
                continue;
            const adjustForTimeZone = (d, offset) => {
                var date = d.toISOString();
                var targetTime = new Date(date);
                var timeZoneFromDB = offset; //time zone value from database
                //get the timezone offset from local time in minutes
                var tzDifference = timeZoneFromDB * 60 + targetTime.getTimezoneOffset();
                //convert the offset to milliseconds, add to targetTime, and make a new Date
                var offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);
                return offsetTime;
            };
            const estimatedTime = new Date(resBus.EstimatedArrival);
            const adjustedTime = adjustForTimeZone(estimatedTime, 8.5);
            const estTimeInMinutes = new Date(Math.abs(adjustedTime.getTime() - new Date().getTime())).getMinutes();
            const estTime = estTimeInMinutes < 2 ? "Arr" : `${estTimeInMinutes} mins`;
            const bus = {
                estimatedTime: estTime,
                load: resBus.Load,
                feature: resBus.Feature,
                type: resBus.Type,
            };
            // @ts-ignore
            busList.push(bus);
        }
        const service = {
            serviceNo: serviceNo,
            busList: busList,
        };
        // @ts-ignore
        serviceList.push(service);
    });
    return res.status(200).json({
        data: serviceList,
    });
});
// #region Internal methods
const getBusStopName = (busStopCode) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    // const data = JSON.parse(fs.readFileSync("source/assets/stops.json"));
    let busStopName = "";
    // @ts-ignore
    for (const busStop of jsonData) {
        if (busStopCode.match(busStop.number)) {
            busStopName = busStop.name;
            break;
        }
    }
    return busStopName;
});
const getBusStopCode = (busStopName) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    // const data = JSON.parse(fs.readFileSync("source/assets/stops.json"));
    let busStopCode = "";
    // @ts-ignore
    for (const busStop of jsonData) {
        if (busStopName.match(busStop.name)) {
            busStopCode = busStop.number;
            break;
        }
    }
    return busStopCode;
});
const IGetBusTimings = (busStopCode) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield axios_1.default.get(`http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}`, {
        headers: {
            AccountKey: "RdoZ93saQ32Ts1JcHbFegg==",
        },
    });
    let serviceList = [];
    const services = result.data.Services;
    if (services.length < 0)
        return;
    services.forEach((item) => {
        const serviceNo = item.ServiceNo;
        let busList = [];
        for (let i = 0; i < 3; i++) {
            const busNo = i <= 0 ? "NextBus" : `NextBus${i + 1}`;
            const resBus = item[busNo];
            if (resBus.EstimatedArrival.length <= 0)
                continue;
            const adjustForTimeZone = (d, offset) => {
                var date = d.toISOString();
                var targetTime = new Date(date);
                var timeZoneFromDB = offset; //time zone value from database
                //get the timezone offset from local time in minutes
                var tzDifference = timeZoneFromDB * 60 + targetTime.getTimezoneOffset();
                //convert the offset to milliseconds, add to targetTime, and make a new Date
                var offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);
                return offsetTime;
            };
            const estimatedTime = new Date(resBus.EstimatedArrival);
            const adjustedTime = adjustForTimeZone(estimatedTime, 8.5);
            const estTimeInMinutes = new Date(Math.abs(adjustedTime.getTime() - new Date().getTime())).getMinutes();
            const estTime = estTimeInMinutes < 2 ? "Arr" : `${estTimeInMinutes} mins`;
            const bus = {
                estimatedTime: estTime,
                load: resBus.Load,
                feature: resBus.Feature,
                type: resBus.Type,
            };
            // @ts-ignore
            busList.push(bus);
        }
        const service = {
            serviceNo: serviceNo,
            busList: busList,
        };
        // @ts-ignore
        serviceList.push(service);
    });
    return serviceList;
});
// #endregion
// async function test() {
//   const data = await getFavouriteStops(["84469", "46821"]);
//   // const data = await getBusStopCode("Blk 703")
//   console.log(data);
// }
// test()
exports.default = { getNearbyStops, getFavouriteStops, getBusTimings };
