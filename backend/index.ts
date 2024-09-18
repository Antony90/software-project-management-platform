import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import cors from 'cors';


import {authRouter, orgRouter, projectRouter, userRouter} from './routes';
import {authenticated, errorHandler} from './middlewares';
import {connectDB} from './services/db.service';

import swaggerUI from 'swagger-ui-express'
import {swaggerSpec} from './docs';
import {runDemo} from './services/risk/ProjectEvaluator.demo';

dotenv.config();

export const app = express();
const test = app.settings.env === 'test' || !!process.env.demo
connectDB(test);

const port = process.env.PORT;

app.use(cors({origin : true, credentials:true}));
app.use(session({
    // @ts-ignore (ignore env key-value null)
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    // store: MongoStore.create({ 
    //     client: mongoose.connection.getClient(),
    //     collectionName: 'sessions'
    // }),
    cookie: {
        maxAge: 1000 * 3600 * 24 * 7 // 1 week
    }
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec))
app.use('/auth', authRouter);

// Following routes require auth
app.use(authenticated);

app.use('/user', userRouter);
app.use('/org', orgRouter);
app.use('/project', projectRouter);

app.use(errorHandler)

app.listen(port, async () => {
    console.log(`[server]: Running at http://localhost:${port}`);
    if (!!process.env.demo) {
        runDemo()
    }
})