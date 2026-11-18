import type { Request } from 'express';

export type BodyRequest<Body> = Request<Record<string, string>, unknown, Body>;

export type IdBodyRequest<Body> = Request<{ id: string }, unknown, Body>;

export type QueryRequest<Query> = Request<Record<string, string>, unknown, unknown, Query>;
