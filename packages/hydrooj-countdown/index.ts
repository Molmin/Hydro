import { Context } from 'hydrooj';

export function apply(ctx: Context) {
    ctx.withHandlerClass('HomeHandler', (h) => {
        h.prototype['getCountdown'] = (data) => {
            console.info(data);
            return data;
        };
    });
}
