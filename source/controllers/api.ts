import { Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import * as fs from "fs";

const IConvertJSONToArray = () => {
  // @ts-ignore
  const json = JSON.parse(fs.readFileSync("source/assets/stops.json"));
  let result = []

  for (const busStop of json) {
    result.push([busStop.number, busStop.name])
  }

  return result
}

const jsonArr = IConvertJSONToArray();

interface Location {
  lat: number
  lng: number
}

// #region Bus Timing API
const getNearbyStops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const location = {
    lat: req.query.lat,
    lng: req.query.lng,
  };

  let result: AxiosResponse = await axios.get(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=bus+stop&location=${location.lat}%2C${location.lng}&radius=150&type=[transit_station,bus_station]&key=AIzaSyCnu98m6eMKGjpCfOfSMHFfa2bwbPZ0UcI`
  );

  let busStops: [] = [];

  for (const item of result.data.results) {
    const code = IGetBusStopCode(item.name);

    if (code === "") continue;

    const serviceList = await IGetBusTimings(code);
    
    const busStop = {
      location: item.geometry.location,
      name: item.name,
      code: code,
      serviceList: serviceList,
    };
    // @ts-ignore
    busStops.push(busStop);
  }

  return res.status(200).json(
    busStops
  );
};

const getStopsByName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let busStops: [] = [];

  // @ts-ignore
  const query = req.query.stops;

  if(Array.isArray(query)){  
    // @ts-ignore
    for (let name of query) {
      // @ts-ignore
      if(name === "root") continue;

      // @ts-ignore
      const code = IGetBusStopCode(name);
      const serviceList = await IGetBusTimings(code);

      const busStop = {
        name: name,
        code: code,
        serviceList: serviceList,
      };
      // @ts-ignore
      busStops.push(busStop);
    }
  }
  else{
    // @ts-ignore
    const code = IGetBusStopCode(query);
    if(code === "") { }    
    else {
      // @ts-ignore
      const serviceList = await IGetBusTimings(code);

      const busStop = {
        name: query,
        code: code,
        serviceList: serviceList,
      };
      // @ts-ignore
      busStops.push(busStop);
    }
  }

  return res.status(200).json(
    busStops,
  );
}

const getStopsByCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let busStops: [] = [];

  // @ts-ignore
  const query = req.query.stops;

  if(Array.isArray(query)){
    // @ts-ignore
    for (let code of query) {
      // @ts-ignore
      const name = IGetBusStopName(code);
      // @ts-ignore
      const serviceList = await IGetBusTimings(code);

      const busStop = {
        name: name,
        code: code,
        serviceList: serviceList
      };
      // @ts-ignore
      busStops.push(busStop);
    }
  }
  else{
    // @ts-ignore
    const name = IGetBusStopName(query);
    // @ts-ignore
    const serviceList = await IGetBusTimings(query);

    const busStop = {
      name: name,
      code: query,
      serviceList: serviceList
    };
    // @ts-ignore
    busStops.push(busStop);
  }

  return res.status(200).json(
    busStops,
  );
}

const getBusTimings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const busStopCode = req.query.code;

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

      const estimatedTime = new Date(resBus.EstimatedArrival);

      const estTimeInMinutes = Math.round((estimatedTime.getTime() - new Date().getTime()) / 60000)
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

  return res.status(200).json(serviceList);
};
// #endregion

// #region Routes API
const getRoute = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const originStringArray = req.query.origin.split(",");
  // @ts-ignore
  const destinationStringArray = req.query.destination.split(",");

  const origin = {
    lat: originStringArray[0],
    lng: originStringArray[1]
  }
  
  const dest = {
    lat: destinationStringArray[0],
    lng: destinationStringArray[1]
  }

  let result : AxiosResponse = await axios.get(
    `https://maps.googleapis.com/maps/api/directions/json`, {
      params: {
        origin: `${origin.lat} ${origin.lng}`,
        destination: `${dest.lat} ${dest.lng}`,
        key: "AIzaSyBxhW9bm2Dissqi9ajYrN0bq6qAP69RRpA",
        alternatives: true,
        mode: "transit",
        units: "metric"
      }
    }
  )

  let routeList : [] = [];
  let legList : [] = [];
  let stepList : [] = [];

  for (const routeItem of result.data.routes)
  {
    legList = [];
    for (const legItem of routeItem.legs)
    { 
      stepList = [];
      for (const stepItem of legItem.steps)
      {
        const isTransit = stepItem.travel_mode === "TRANSIT";
        let transitDetails = {};

        if (isTransit)
        {
          const transitDetailsRes = stepItem.transit_details

          transitDetails = {
            arrTime: transitDetailsRes.arrival_time.text,
            from: transitDetailsRes.departure_stop.name,
            to: transitDetailsRes.arrival_stop.name,
            num_stops : transitDetailsRes.num_stops,
            line: {
              name: transitDetailsRes.line.name,
              type: transitDetailsRes.line.vehicle.type
            }
          }
        }

        const step = {
          distance: stepItem.distance.text,
          duration: stepItem.duration.text,
          mode: stepItem.travel_mode,
          details : transitDetails
        }
        
        //@ts-ignore
        stepList.push(step);
      }

      const leg = {
        dptTime : legItem.departure_time.text,
        arrTime : legItem.arrival_time.text,
        distance: legItem.distance.text,
        duration: legItem.duration.text,
        steps: stepList
      }

      //@ts-ignore
      legList.push(leg);
    }

    const route = {
      legs: legList
    }

    // @ts-ignore
    routeList.push(route);
  }

  return res.status(200).json(routeList)
}
// #endregion

// #region Internal methods
const IGetBusStopName = (busStopCode: string) => {
  return search(jsonArr, jsonArr.length, busStopCode, 0)[1]
};

const IGetBusStopCode = (busStopName: string) => {
  return search(jsonArr, jsonArr.length, busStopName, 1)[0]
};

const IGetBusTimings = async (busStopCode: String) => {
  if (busStopCode.length <= 0) return;

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

  if (services.length <= 0) return serviceList;

  services.forEach((item: any) => {
    const serviceNo = item.ServiceNo;
    let busList: [] = [];
    for (let i = 0; i < 3; i++) {
      const busNo = i <= 0 ? "NextBus" : `NextBus${i + 1}`;
      const resBus = item[busNo];
      if (resBus.EstimatedArrival.length <= 0) continue;

      const estimatedTime = new Date(resBus.EstimatedArrival);
      const estTimeInMinutes = Math.round((estimatedTime.getTime() - new Date().getTime()) / 60000)
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
};

const search = (arr : string[][], n: number, target: string, targetIdx : number) => {
  if (arr[n-1][targetIdx] === target) return arr[n-1]
  const backup = arr[n-1]
  arr[n-1][targetIdx] = target

  for (let i = 0;; i++) {
    if (arr[i][targetIdx] === target) {
      arr[n-1] = backup;
      if (i < n - 1) return arr[i]
      return "Not Found"
    }
  }
}

const ping = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const msg = Date.now() + " Ping Received"
  console.log(msg);
  return res.status(200).json(msg)
}
// #endregion 

export default { getNearbyStops, getBusTimings, getStopsByName, getStopsByCode, getRoute, ping};