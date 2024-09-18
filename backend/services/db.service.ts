import {MongoMemoryReplSet} from 'mongodb-memory-server';
import {connect, Types} from 'mongoose';


export async function connectDB(test: boolean) {
    if (!test) {
        console.log("[mongoDB] Connected to database");
        // @ts-ignore (ignore env key-value undefined)
        await connect(process.env.MONGODB_URI);
    } else {
        console.log("[mongoDB] Connected to mongo memory server");
        // const mongoServer = await MongoMemoryServer.create({ instance: { replSet: 'repl' } });
        const replSet = await MongoMemoryReplSet.create();
        await connect(replSet.getUri());
    }
}

export function clean(obj_: { [k: string]: any }) {
    const obj = JSON.parse(JSON.stringify(obj_));
    for (var k in obj) {
        if (!obj.hasOwnProperty(k)) {
            continue;
        } else if (k === '_id') {
            obj['id'] = obj['_id']
            delete obj['_id']
        } else if (k === '__v') {
            delete obj['__v']
        } else if (typeof obj[k] == 'object' && obj[k] !== null) {
            obj[k] = clean(obj[k]);
        }
    }
    return obj
}

export type Document<T> = T & { _id: Types.ObjectId }