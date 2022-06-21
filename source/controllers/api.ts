import { Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import * as fs from "fs";

interface BusStop {
  location: {
    lat: number;
    lng: number;
  };
  name: String;
  code: String;
  serviceList: [Service];
}

interface Service {
  serviceNo: String;
  busList: [Bus];
}

interface Bus {
  estimatedTime: String;
  load: String;
  feature: String;
  type: String;
}

interface Location {
  lat: String;
  lng: String;
}

// @ts-ignore
// const busStopJSON = JSON.parse(fs.readFileSync("build/assets/stops.json"));

const getNearbyStops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const location = {
    lat: req.query.lat,
    lng: req.query.lng,
  };

  console.log(req.query.lat);

  let result: AxiosResponse = await axios.get(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=bus+stop&location=${location.lat}%2C${location.lng}&radius=150&type=[transit_station,bus_station]&key=AIzaSyCnu98m6eMKGjpCfOfSMHFfa2bwbPZ0UcI`
  );

  let busStops: [] = [];

  for (const item of result.data.results) {
    const code = await getBusStopCode(item.name);
    const serviceList = await getBusTimings(code);

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
};

const getBusStopCode = async (busStopName: String) => {
  // @ts-ignore
  const data = JSON.parse(fs.readFileSync("source/assets/stops.json"));
  let busStopCode = "";

  // @ts-ignore
  for(const busStop of data){
    if (busStopName.match(busStop.name)) {
      busStopCode = busStop.number;
      break;
    }
  }

  return busStopCode;
};

const getBusTimings = async (busStopCode: String) => {
  let result: AxiosResponse = await axios.get(
    `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}`,
    {
      headers: {
        AccountKey: "RdoZ93saQ32Ts1JcHbFegg==",
      },
    }
  );

  let serviceList: [] = [];

  const services = result.data.Services;

  if (services.length < 0) return;

  services.forEach((item: any) => {
    const serviceNo = item.ServiceNo;
    let busList: [] = [];
    for (let i = 0; i < 3; i++) {
      const busNo = i <= 0 ? "NextBus" : `NextBus${i + 1}`;
      const resBus = item[busNo];
      if (resBus.EstimatedArrival.length <= 0) continue;

      const adjustForTimeZone = (d: Date, offset: number): Date => {
        var date = d.toISOString();
        var targetTime = new Date(date);
        var timeZoneFromDB = offset; //time zone value from database
        //get the timezone offset from local time in minutes
        var tzDifference = timeZoneFromDB * 60 + targetTime.getTimezoneOffset();
        //convert the offset to milliseconds, add to targetTime, and make a new Date
        var offsetTime = new Date(
          targetTime.getTime() + tzDifference * 60 * 1000
        );
        return offsetTime;
      };

      const estimatedTime = new Date(resBus.EstimatedArrival);
      const adjustedTime = adjustForTimeZone(estimatedTime, 8.5);

      const estTimeInMinutes = new Date(
        Math.abs(adjustedTime.getTime() - new Date().getTime())
      ).getMinutes();
      const estTime = estTimeInMinutes < 2 ? "Arr" : `${estTimeInMinutes} mins`;

      const bus: Bus = {
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

export default { getNearbyStops };