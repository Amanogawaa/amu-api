// packages
import type { Request, Response, Application, NextFunction } from "express"
import http from "http"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { server } from "typescript"

// modules

const CORSOPTIONS = {
    origin: ["http://localhost:3000", "*"],
    methods: "GET,POST,PATCH,PUT,DELETE",
    credentials: true
}

class App {
    public app: Application
    public server: http.Server

    constructor() {
        this.app = express()
        this.server = http.createServer(this.app)
    }


}
