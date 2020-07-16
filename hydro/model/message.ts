import { ObjectID } from 'mongodb';
import { Mdoc } from '../interface';
import * as db from '../service/db';

const coll = db.collection('message');

export const FLAG_UNREAD = 1;
export const FLAG_NOTIFICATION = 2;

export async function send(from: number, to: number, content: string, flag: number): Promise<Mdoc> {
    const res = await coll.insertOne({
        from, to, content, flag: FLAG_UNREAD | flag,
    });
    return {
        from, to, content, _id: res.insertedId, flag: FLAG_UNREAD | flag,
    };
}

export async function get(_id: ObjectID): Promise<Mdoc> {
    return await coll.findOne({ _id });
}

export async function getByUser(uid: number): Promise<Mdoc[]> {
    return await coll.find({ $or: [{ from: uid }, { to: uid }] }).sort('_id', 1).toArray();
}

export async function getMany(query: any, sort: any, page: number, limit: number): Promise<Mdoc[]> {
    return await coll.find(query).sort(sort)
        .skip((page - 1) * limit).limit(limit)
        .toArray();
}

export async function setFlag(messageId: ObjectID, flag: number) {
    const result = await coll.findOneAndUpdate(
        { _id: messageId },
        { $bit: { flag: { xor: flag } } },
        { returnOriginal: false },
    );
    return result.value;
}

export async function del(_id: ObjectID) {
    return await coll.deleteOne({ _id });
}

export function count(query: any) {
    return coll.find(query).count();
}

export function getMulti(uid: number) {
    return coll.find({ $or: [{ from: uid }, { to: uid }] });
}

export function ensureIndexes() {
    return Promise.all([
        coll.createIndex({ to: 1, _id: -1 }),
        coll.createIndex({ from: 1, _id: -1 }),
    ]);
}

global.Hydro.model.message = {
    FLAG_UNREAD,
    FLAG_NOTIFICATION,

    count,
    get,
    getByUser,
    del,
    setFlag,
    getMany,
    getMulti,
    send,
    ensureIndexes,
};
