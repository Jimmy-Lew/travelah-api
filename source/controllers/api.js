"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
exports.__esModule = true;
var axios_1 = require("axios");
var fs = require("fs");
var busStopRepo = /** @class */ (function () {
  function busStopRepo() {
    // @ts-ignore
    this.data = JSON.parse(fs.readFileSync("build/assets/stops.json"));
  }
  busStopRepo.prototype.getData = function () {
    return this.data;
  };
  busStopRepo.prototype.getInstance = function () {
    return busStopRepo.instance === null
      ? (busStopRepo.instance = new busStopRepo())
      : busStopRepo.instance;
  };
  return busStopRepo;
})();
var getNearbyStops = function (req, res, next) {
  return __awaiter(void 0, void 0, void 0, function () {
    var location, result, busStops, _i, _a, item, code, serviceList, busStop;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          location = {
            lat: req.query.lat,
            lng: req.query.lng,
          };
          console.log(req.query.lat);
          return [
            4 /*yield*/,
            axios_1["default"].get(
              "https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=bus+stop&location="
                .concat(location.lat, "%2C")
                .concat(
                  location.lng,
                  "&radius=150&type=[transit_station,bus_station]&key=AIzaSyCnu98m6eMKGjpCfOfSMHFfa2bwbPZ0UcI"
                )
            ),
          ];
        case 1:
          result = _b.sent();
          busStops = [];
          (_i = 0), (_a = result.data.results);
          _b.label = 2;
        case 2:
          if (!(_i < _a.length)) return [3 /*break*/, 6];
          item = _a[_i];
          return [4 /*yield*/, getBusStopCode(item.name)];
        case 3:
          code = _b.sent();
          return [4 /*yield*/, getBusTimings(code)];
        case 4:
          serviceList = _b.sent();
          busStop = {
            location: item.geometry.location,
            name: item.name,
            code: code,
            serviceList: serviceList,
          };
          // @ts-ignore
          busStops.push(busStop);
          _b.label = 5;
        case 5:
          _i++;
          return [3 /*break*/, 2];
        case 6:
          return [
            2 /*return*/,
            res.status(200).json({
              data: busStops,
            }),
          ];
      }
    });
  });
};
var getBusStopCode = function (busStopName) {
  return __awaiter(void 0, void 0, void 0, function () {
    var busStopCode;
    return __generator(this, function (_a) {
      busStopCode = "";
      // @ts-ignore
      busStopRepo
        .getInstance()
        .getData()
        .forEach(function (busStop) {
          if (busStopName.match(busStop.name)) {
            busStopCode = busStop.number;
          }
        });
      return [2 /*return*/, busStopCode];
    });
  });
};
var getBusTimings = function (busStopCode) {
  return __awaiter(void 0, void 0, void 0, function () {
    var result, serviceList, services;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            axios_1["default"].get(
              "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=".concat(
                busStopCode
              ),
              {
                headers: {
                  AccountKey: "RdoZ93saQ32Ts1JcHbFegg==",
                },
              }
            ),
          ];
        case 1:
          result = _a.sent();
          serviceList = [];
          services = result.data.Services;
          if (services.length < 0) return [2 /*return*/];
          services.forEach(function (item) {
            var serviceNo = item.ServiceNo;
            var busList = [];
            for (var i = 0; i < 3; i++) {
              var busNo = i <= 0 ? "NextBus" : "NextBus".concat(i + 1);
              var resBus = item[busNo];
              if (resBus.EstimatedArrival.length <= 0) continue;
              var adjustForTimeZone = function (d, offset) {
                var date = d.toISOString();
                var targetTime = new Date(date);
                var timeZoneFromDB = offset; //time zone value from database
                //get the timezone offset from local time in minutes
                var tzDifference =
                  timeZoneFromDB * 60 + targetTime.getTimezoneOffset();
                //convert the offset to milliseconds, add to targetTime, and make a new Date
                var offsetTime = new Date(
                  targetTime.getTime() + tzDifference * 60 * 1000
                );
                return offsetTime;
              };
              var estimatedTime = new Date(resBus.EstimatedArrival);
              var adjustedTime = adjustForTimeZone(estimatedTime, 8.5);
              var estTimeInMinutes = new Date(
                Math.abs(adjustedTime.getTime() - new Date().getTime())
              ).getMinutes();
              var estTime =
                estTimeInMinutes < 2
                  ? "Arr"
                  : "".concat(estTimeInMinutes, " mins");
              var bus = {
                estimatedTime: estTime,
                load: resBus.Load,
                feature: resBus.Feature,
                type: resBus.Type,
              };
              // @ts-ignore
              busList.push(bus);
            }
            var service = {
              serviceNo: serviceNo,
              busList: busList,
            };
            // @ts-ignore
            serviceList.push(service);
          });
          return [2 /*return*/, serviceList];
      }
    });
  });
};
// async function test(){
//     const loc: Location = {
//         lat: "1.3918577281406086",
//         lng: "103.75166620390048"
//     }
//     const busStops = await getNearbyStops(loc);
//     busStops.forEach(busStop => {
//         console.log(busStop);
//     })
//     // const code = "12101";
//     // const busList = await getBusTimings(code);
//     // busList.forEach(bus => {
//     //     console.log(bus);
//     // })
//     // const code = await getBusStopCode("Ngee Ann Poly");
//     // console.log(code);
// }
// test()
exports["default"] = { getNearbyStops: getNearbyStops };
