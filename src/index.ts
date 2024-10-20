
import express, { Request } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { getMetar } from "./weather_api.js";


const app = express();

app.use(cookieParser());

app.use(cors({
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
}));


app.get("/ekhk", async (req, res) => {
  console.log(req.query.key)

  const requestApiKey = req.query.key ?? "";
  const matchKey = "en-api-key"


  if (matchKey != requestApiKey) {
    res.status(401).send({ error: "Api nøglen er ikke genkendt" })
    return;
  }

  const result = await getMetar()


  if (result) {

    res.status(200).send(result);
  } else {
    res.status(500).send({ error: "En fejl opstod under kald til DMI" })
  }


})



// ERROR HANDLERS:
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: err });
});




// WooProducts()
app.listen(process.env.PORT ?? 8000, () => {
  console.log("SERVER IS RUNNING");
  console.log(process.env.PORT ?? 8000);
});

