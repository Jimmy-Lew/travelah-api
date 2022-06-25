import { Request, Response, NextFunction } from "express";
import axios, { AxiosResponse } from "axios";
import * as fs from "fs";

// @ts-ignore
const jsonData = JSON.parse(fs.readFileSync("source/assets/stops.json"));

interface Location {
  lat: number
  lng: number
}

const getNearbyStops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const location = {
    lat: req.query.lat,
    lng: req.query.lng,
  };

  // @ts-ignore
  // const isRaining : boolean = await IIsRaining(location);

  let result: AxiosResponse = await axios.get(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=bus+stop&location=${location.lat}%2C${location.lng}&radius=150&type=[transit_station,bus_station]&key=AIzaSyCnu98m6eMKGjpCfOfSMHFfa2bwbPZ0UcI`
  );

  console.log(result.status);

  let busStops: [] = [];

  for (const item of result.data.results) {
    const code = await IGetBusStopCode(item.name);
    const serviceList = await IGetBusTimings(code);
    
    const busStop = {
      location: item.geometry.location,
      name: item.name,
      code: code,
      serviceList: serviceList,
      // isRaining: isRaining
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
      const code = await IGetBusStopCode(name);
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
    if(query === "root") {
      
    }    
    else {
      // @ts-ignore
      const code = await IGetBusStopCode(query);
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
      const name = await IGetBusStopName(code);
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
    const name = await IGetBusStopName(query);
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

  return res.status(200).json({
    data: serviceList,
  });
};

// #region Internal methods
const IIsRaining = async (location: Location) => {
  let result: AxiosResponse = await axios.get(`https://weatherbit-v1-mashape.p.rapidapi.com/current?lon=${location.lng}&lat=${location.lat}&units=metric&lang=en`,
  {
    headers: {
      "X-RapidAPI-Key": "db09627fefmshbb7e0a02975ba60p1e9b1fjsn7a01a15d0b4c",
      "X-RapidAPI-Host": "weatherbit-v1-mashape.p.rapidapi.com"
    }
  })

  return result.data.data[0].precip > 0;
};

const IGetBusStopName = async (busStopCode: String) => {
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
};

const IGetBusStopCode = async (busStopName: String) => {
  // @ts-ignore
  // const data = JSON.parse(fs.readFileSync("source/assets/stops.json"));
  let busStopCode = "";

  // @ts-ignore
  for (const busStop of jsonData) {
    if (busStopName === busStop.name) {
      busStopCode = busStop.number;
      break;
    }
  }

  return busStopCode;
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
// #endregion 

export default { getNearbyStops, getBusTimings, getStopsByName, getStopsByCode };