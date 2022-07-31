import https from "http";
import express, { Express } from "express";
import morgan from "morgan";
import routes from "./routes/api";

const router: Express = express();

router.use(morgan("dev"));
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "origin, X-Requested-With,Content-Type,Accept, Authorization"
  );
  res.header("Cache-Control", "s-max-age=1, stale-while-revalidate");

  if (req.method === "OPTION") {
    res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST");
    return res.status(200).json({});
  }

  next();
});

router.use("/", routes);

router.use((req, res, next) => {
  const error = new Error("not found");

  // @ts-ignore
  return res.status(404).json({
    message: error.message,
    params: req.params,
    query: req.query,
  });
});

const httpServer = https.createServer(router);
const PORT: any = process.env.PORT ?? 3000;
httpServer.listen(PORT, () =>
  console.log(`The server is running on port ${PORT}`)
);

setInterval(() => {
  https.get(`https://travelah-api.onrender.com/`);
}, 1500000);