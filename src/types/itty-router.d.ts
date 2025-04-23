import { IRequest } from 'itty-router';
import { UserSession } from '../types';

declare module 'itty-router' {
  interface IRequest extends Request {
    data?: Record<string, any>;
    user?: UserSession;
    method: string;
    url: string;
    headers: Headers;
    clone(): IRequest;
  }
}
