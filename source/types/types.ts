export interface Route {
    duration: string;
    legs:     Leg[];
}
   
export interface Leg {
    arrTime:  string;
    distance: string;
    dptTime:  string;
    duration: string;
    steps:    Step[];
}

export interface Step {
    details:  Details;
    distance: string;
    duration: string;
    mode:     Mode;
}

export interface Details {
    arrTime?:   string;
    from?:      string;
    line?:      Line;
    num_stops?: number;
    to:         string;
}

export interface Line {
    name: string;
    type: string;
}

export interface Bus {
  estimatedTime: string,
  load: string,
  feature: string,
  type: string
}

export interface Service {
  serviceNo: string,
  busList: Bus[]
}

export interface BusStop {
  location?: any,
  name: string,
  code: string,
  serviceList: Service[]
}

export interface Map<T> {
    [key: string] : T
}

export type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONObject
    | JSONArray;

export interface JSONObject { [x: string]: JSONValue }

export interface JSONArray extends Array<JSONValue> { }

export enum Mode {
    BUS = "BUS",
    LRT = "LRT",
    MRT = "MRT",
    WALKING = "WALKING",
}