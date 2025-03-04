import express from "express"
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import dotenv from "dotenv"
import { connectDb } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());// json bodyparser
app.use(cookieParser());//cookie parser middleware 
app.use(cors({
    origin : "http://localhost:5173",
    credentials : true,
}
));


app.use("/api/auth",authRoutes);
app.use("/api/message",messageRoutes);

app.listen(PORT,()=>{
    console.log(`Server started on PORT ${PORT}`);
    connectDb();
});